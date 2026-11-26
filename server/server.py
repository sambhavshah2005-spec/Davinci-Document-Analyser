from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import chromadb
from openai import OpenAI
from dotenv import load_dotenv
import os
import uuid
import datetime
import logging
import io
import re

# === Document Processing ===
import PyPDF2
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# === Embeddings ===
from sentence_transformers import SentenceTransformer

# === Research Module ===
from research import run_research_and_store

# === Logging ===
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# === Load ENV ===
load_dotenv()

# ==========================================================
# CONFIGURATION (IMPORTANT: FIXED PATHS)
# ==========================================================

VAULT_PATH = r"C:\Users\Margil\OneDrive\Documents\MyNotes\Rag"
CHROMA_PATH = r"C:\Users\Margil\Development\Davinci-2.0\chroma_db"

COLLECTION_NAME = "obsidian_notes"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logging.info(f"📂 Project Root: {PROJECT_ROOT}")

os.makedirs(VAULT_PATH, exist_ok=True)
os.makedirs(CHROMA_PATH, exist_ok=True)

# ==========================================================
# FLASK SETUP
# ==========================================================

app = Flask(__name__)
# 🔒 CORS: Allowing all origins during setup
CORS(app, origins=["*"])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# === Database ===
import database
database.init_db()

# ==========================================================
# EMBEDDING MODEL (SAME AS INGESTER)
# ==========================================================

logging.info("🔄 Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
logging.info("✅ Embedding model loaded")

# ==========================================================
# CHROMADB
# ==========================================================

logging.info(f"📂 Using ChromaDB path: {CHROMA_PATH}")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
logging.info(f"🔍 Collection '{COLLECTION_NAME}' loaded with {collection.count()} embeddings")

# Analyzer Collection
ANALYZER_COLLECTION_NAME = "analyzer_docs"
analyzer_collection = chroma_client.get_or_create_collection(name=ANALYZER_COLLECTION_NAME)
logging.info(f"🔍 Analyzer Collection '{ANALYZER_COLLECTION_NAME}' loaded")

# ==========================================================
# OLLAMA (LOCAL LLM)
# ==========================================================

ollama_client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)

# ==========================================================
# CORE RAG LOGIC
# ==========================================================

def get_answer_from_notes(query: str) -> dict:
    """Standard RAG search across Obsidian notes"""
    logging.info(f"🔍 RAG Search: {query}")
    
    # Generate Embedding
    query_embedding = embedding_model.encode([query]).tolist()
    
    # Query Chroma
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=5,
        include=["documents", "metadatas", "distances"]
    )
    
    retrieved_docs = []
    retrieved_metadatas = []
    
    # Strict distance threshold (lower is better for L2, higher is better for cosine)
    # Chroma default is L2 (squared L2 distance). 1.0 is often a good cut-off.
    if results["documents"]:
        for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            if dist < 1.7:  # Adjust threshold as needed
                retrieved_docs.append(doc)
                retrieved_metadatas.append(meta)
        
    if not retrieved_docs:
        return {"answer": "I couldn't find any relevant information in your notes regarding your specific question.", "sources": []}
        
    context = "\n---\n".join(retrieved_docs)
    
    # Generate Answer
    system_prompt = f"""
    You are a strict question-answering engine.
    Use the provided notes context to answer the user's question.

    STRICT RULES:
    1. If the specific subject or entity mentioned in the question (e.g., a specific university name) is NOT present in the context, state clearly that you don't have information about that specific subject.
    2. DO NOT provide information about other subjects or entities found in the context if they are not what the user asked for.
    3. Answer in 1 SINGLE sentence.
    4. Be extremely concise.
    5. NO filler words. NO "Based on...". NO "According to...".
    6. Just output the answer or the denial.
    
    Context:
    {context}
    """
    
    response = ollama_client.chat.completions.create(
        model="llama3:8b", 
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
    )
    
    answer = response.choices[0].message.content.strip()

    # Force clean common AI prefixes
    prefixes = [
        r"^According to (the|your) (notes|text|documents?|records?),?\s*",
        r"^Based on (the|your) (notes|text|documents?|records?),?\s*",
        r"^From (the|your) (notes|text|documents?|records?),?\s*",
        r"^As mentioned in (the|your) (notes|text|documents?|records?),?\s*",
        r"^I (do not|don't) have any information (about|regarding)\s*"
    ]
    
    for pattern in prefixes:
        # We only want to remove prefixes, not the denial itself if it's the whole answer
        if not re.match(pattern + "$", answer, flags=re.IGNORECASE):
            answer = re.sub(pattern, "", answer, flags=re.IGNORECASE)
        
    # Capitalize first letter if needed
    if answer:
        answer = answer[0].upper() + answer[1:]
        
    return {
        "answer": answer,
        "sources": [{"metadata": meta} for meta in retrieved_metadatas]
    }

# ==========================================================
# DOCUMENT PROCESSING (ANALYZER)
# ==========================================================

def process_document(file_content, filename):
    """Extract text from PDF, DOCX, or TXT"""
    file_ext = os.path.splitext(filename)[1].lower()
    text = ""
    
    try:
        if file_ext == '.pdf':
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        elif file_ext == '.docx':
            doc = Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif file_ext == '.txt':
            text = file_content.decode('utf-8', errors='ignore')
        return text
    except Exception as e:
        logging.error(f"❌ Document extraction error: {e}")
        return None

# ==========================================================
# API ROUTES
# ==========================================================

@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.json
        query = data.get("query", "").strip()
        session_id = data.get("session_id")

        if not query:
            return jsonify({"error": "Query required"}), 400
            
        # 1. Save User Message
        if session_id:
            database.add_chat_message(doc_id=None, role="user", content=query, session_id=session_id)

        # 2. Get Answer from local notes
        result = get_answer_from_notes(query)
        
        # Unpack result safely
        answer = result.get("answer", "I couldn't process that request.")
        sources = result.get("sources", [])
        
        # 3. Save AI Message
        if session_id:
            database.add_chat_message(doc_id=None, role="assistant", content=answer, session_id=session_id)
            
        return jsonify({
            "answer": answer,
            "sources": sources
        })
    except Exception as e:
        logging.error(f"❌ Error in /ask: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/research", methods=["POST"])
def research():
    """Execute deep research and store in knowledge base"""
    try:
        data = request.json
        query = data.get("query", "").strip()
        
        if not query:
            return jsonify({"error": "Query required"}), 400
            
        logging.info(f"🚀 Starting deep research for: {query}")
        
        # Call the modular pipeline
        # Passing the main RAG collection for storage
        summary = run_research_and_store(query, collection)
        
        return jsonify({
            "message": "Research completed and stored",
            "answer": summary
        })
    except Exception as e:
        logging.error(f"❌ Error in /research: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sessions", methods=["GET"])
def list_sessions():
    """List all chat sessions"""
    sessions = database.get_sessions()
    return jsonify(sessions)

@app.route("/sessions", methods=["POST"])
def create_session():
    """Create a new chat session"""
    title = request.json.get("title", "New Conversation")
    session_id = database.create_session(title)
    return jsonify({"session_id": session_id, "title": title})

@app.route("/sessions/<session_id>", methods=["GET"])
def get_session_history(session_id):
    """Get chat history for a session"""
    history = database.get_chat_history(session_id=session_id)
    return jsonify(history)

@app.route("/sessions/<session_id>", methods=["DELETE"])
def delete_chat_session(session_id):
    """Delete a chat session"""
    try:
        database.delete_session(session_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyzer/upload", methods=["POST"])
def analyzer_upload():
    """Handle document upload for analyzer"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        file_content = file.read()
        filename = file.filename
        document_text = process_document(file_content, filename)
        
        if not document_text or len(document_text.strip()) == 0:
            return jsonify({"success": False, "error": "No text extracted"}), 400
        
        doc_id = str(uuid.uuid4())
        file_ext = os.path.splitext(filename)[1].lower()
        save_filename = f"{doc_id}{file_ext}"
        
        UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        save_path = os.path.join(UPLOAD_FOLDER, save_filename)
        with open(save_path, "wb") as f:
            f.write(file_content)
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(document_text)
        
        if chunks:
            embeddings = embedding_model.encode(chunks).tolist()
            metadatas = [{"doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
            ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            analyzer_collection.add(documents=chunks, embeddings=embeddings, metadatas=metadatas, ids=ids)
        
        database.add_document(
            doc_id=doc_id,
            filename=filename,
            filepath=save_filename,
            chunk_count=len(chunks),
            file_type=file_ext.replace('.', ''),
            file_size=len(file_content)
        )
        
        return jsonify({
            "success": True,
            "doc_id": doc_id,
            "filename": filename,
            "preview_url": f"http://localhost:5000/files/{save_filename}"
        })
    except Exception as e:
        logging.error(f"❌ Upload failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/analyzer", methods=["POST"])
def analyzer():
    try:
        data = request.json
        query = data.get("query", "").strip()
        doc_id = data.get("doc_id")
        
        if not query:
            return jsonify({"error": "Query required"}), 400
        
        results = analyzer_collection.query(
            query_texts=[query],
            n_results=5,
            where={"doc_id": doc_id},
            include=["documents"]
        )
        
        retrieved_chunks = results["documents"][0] if results["documents"] else []
        context = "\n---\n".join(retrieved_chunks)
        
        system_prompt = f"Answer in 1 sentence using context: {context}"
        response = ollama_client.chat.completions.create(
            model="llama3:8b",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": query}]
        )
        
        answer = response.choices[0].message.content.strip()
        return jsonify({"answer": answer, "doc_id": doc_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/files/<path:filename>')
def serve_file(filename):
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/documents", methods=["GET"])
def list_documents():
    docs = database.get_documents()
    for doc in docs:
        doc["preview_url"] = f"http://localhost:5000/files/{doc['filepath']}"
    return jsonify(docs)

@app.route("/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    try:
        doc = database.get_document(doc_id)
        if doc:
            analyzer_collection.delete(where={"doc_id": doc_id})
            UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
            file_path = os.path.join(UPLOAD_FOLDER, doc["filepath"])
            if os.path.exists(file_path):
                os.remove(file_path)
            database.delete_document(doc_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@socketio.on("connect")
def on_connect():
    logging.info("⚡ Client connected")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)