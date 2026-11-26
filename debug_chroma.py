import chromadb
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(PROJECT_ROOT, "chroma_db")
COLLECTION_NAME = "obsidian_notes"

print(f"📂 Checking ChromaDB at: {CHROMA_PATH}")

try:
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    
    count = collection.count()
    print(f"📊 Total documents: {count}")

    if count == 0:
        print("❌ Collection is empty!")
    else:
        print("📝 Indexed Files:")
        result = collection.get(include=["metadatas"])
        
        seen_files = set()
        for meta in result["metadatas"]:
            source = meta.get("source", "UNKNOWN")
            seen_files.add(source)
            
        for file in seen_files:
            print(f" - {file}")
            
except Exception as e:
    print(f"❌ Error: {e}")
