import os
import re
import time

import chromadb
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ============================================================
# CONFIGURATION (MUST MATCH server.py)
# ============================================================

# Use Windows Paths properly - pointing to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT_PATH = r"C:\Users\Margil\OneDrive\Documents\MyNotes\Rag"
CHROMA_PATH = r"C:\Users\Margil\Development\Davinci-2.0\chroma_db"
COLLECTION_NAME = "obsidian_notes"

print(f"📂 Resolved Project Root: {PROJECT_ROOT}")

os.makedirs(VAULT_PATH, exist_ok=True)
os.makedirs(CHROMA_PATH, exist_ok=True)

# ============================================================
# INITIALIZE EMBEDDING MODEL
# ============================================================

print("🔄 Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Embedding model loaded")

# ============================================================
# INITIALIZE CHROMADB
# ============================================================

print(f"📂 Using ChromaDB path: {CHROMA_PATH}")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
print(f"🔍 Collection '{COLLECTION_NAME}' ready")

# ============================================================
# CLEAN OBSIDIAN WIKI LINKS
# ============================================================

def clean_obsidian(text: str) -> str:
    # Remove embeds like ![[image.png]]
    text = re.sub(r'!\[\[.*?\]\]', '', text)

    # Convert [[Page|Alias]] → Alias, [[Page]] → Page
    text = re.sub(
        r'\[\[([^\|\]]+)\|?([^\]]*)\]\]',
        lambda m: m.group(2) if m.group(2) else m.group(1),
        text
    )

    return text

# ============================================================
# INGEST SINGLE MARKDOWN FILE
# ============================================================

def process_and_upsert_md(file_path: str):
    try:
        file_name = os.path.basename(file_path)
        print(f"📄 Processing: {file_name}")

        loader = TextLoader(file_path, encoding='utf-8')
        documents = loader.load()

        for doc in documents:
            doc.page_content = clean_obsidian(doc.page_content)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )

        chunks = splitter.split_documents(documents)

        if not chunks:
            print(f"⚠️ Skipped: {file_name} (no content)")
            return

        texts = [chunk.page_content for chunk in chunks]
        metadatas = [
            {
                **chunk.metadata,
                "source": os.path.relpath(file_path, VAULT_PATH)
            }
            for chunk in chunks
        ]

        ids = [
            f"{os.path.relpath(file_path, VAULT_PATH)}_chunk_{i}"
            for i in range(len(chunks))
        ]

        embeddings = embedding_model.encode(texts, show_progress_bar=False)

        collection.upsert(
            documents=texts,
            metadatas=metadatas,
            embeddings=embeddings.tolist(),
            ids=ids
        )

        print(f"✅ Indexed: {file_name}")

    except Exception as e:
        print(f"❌ Error processing {file_name}: {e}")

# ============================================================
# INITIAL BULK INGESTION
# ============================================================

def initial_ingestion():
    print(f"🔍 Starting initial ingestion from: {VAULT_PATH}")

    if not os.path.exists(VAULT_PATH):
        print(f"❌ Vault path does not exist: {VAULT_PATH}")
        return False

    markdown_files = []
    for root, _, files in os.walk(VAULT_PATH):
        for file in files:
            if file.endswith(".md"):
                markdown_files.append(os.path.join(root, file))

    if not markdown_files:
        print("📭 No markdown files found")
        return True

    print(f"📚 Found {len(markdown_files)} markdown files\n")

    for md_file in markdown_files:
        process_and_upsert_md(md_file)

    print("\n✅ Initial ingestion complete")
    return True

# ============================================================
# WATCHDOG HANDLER
# ============================================================

class MarkdownEventHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            print(f"🆕 New note: {os.path.basename(event.src_path)}")
            process_and_upsert_md(event.src_path)

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            print(f"✏️ Updated: {os.path.basename(event.src_path)}")
            process_and_upsert_md(event.src_path)

# ============================================================
# MAIN
# ============================================================


if __name__ == "__main__":
    success = initial_ingestion()

    if not success:
        print("❌ Ingestion failed")
        exit(1)

    print(f"\n👀 Watching '{VAULT_PATH}' for changes...")

    event_handler = MarkdownEventHandler()
    observer = Observer()
    observer.schedule(event_handler, VAULT_PATH, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping watcher...")
        observer.stop()

    observer.join()
