import chromadb
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(PROJECT_ROOT, "chroma_db")
COLLECTION_NAME = "obsidian_notes"

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(name=COLLECTION_NAME)

print("🔍 Searching for 'Introduction 2.md' content...")

result = collection.get(where={"source": "Introduction 2.md"}, include=["documents", "metadatas"])

if not result["documents"]:
    print("❌ Document found in index list previously but not found via query now!")
else:
    for i, doc in enumerate(result["documents"]):
        print(f"\n--- Chunk {i+1} ---")
        print(f"Metadata: {result['metadatas'][i]}")
        print(f"Content: '{doc}'")
