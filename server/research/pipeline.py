from .crawler import fetch_web_data
from .processor import process_content
import logging
import uuid
import time
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load embedding model once
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def run_research(query: str) -> str:
    """
    Final research pipeline entry point (Process only).
    """
    logging.info(f"🌐 Fetching data for: {query}")
    raw_text = fetch_web_data(query)
    if not raw_text:
        return "Failed to retrieve information from the web."
    
    logging.info("🧠 Processing content...")
    return process_content(raw_text)

def run_research_and_store(query: str, collection) -> str:
    """
    Execute research, summarize, and index the findings into ChromaDB.
    """
    # 1. Execute Research & Get Summary
    summary = run_research(query)
    
    if not summary or "Failed to" in summary:
        return summary

    try:
        logging.info(f"📦 Indexing research results into ChromaDB for: {query}")
        
        # 2. Chunk the summary
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )
        chunks = text_splitter.split_text(summary)
        
        if not chunks:
            return summary

        # 3. Generate Embeddings & IDs
        embeddings = embedding_model.encode(chunks).tolist()
        ids = [f"web_{uuid.uuid4().hex[:8]}_{int(time.time())}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": "web", "query": query, "chunk": i} for i in range(len(chunks))]
        
        # 4. Add to Collection
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        logging.info(f"✅ Stored {len(chunks)} research chunks in ChromaDB.")
        return summary

    except Exception as e:
        logging.error(f"❌ Storage failed: {e}")
        return summary # Still return the summary even if indexing fails

# Compatibility alias
def run_research_pipeline(query: str) -> str:
    return run_research(query)
