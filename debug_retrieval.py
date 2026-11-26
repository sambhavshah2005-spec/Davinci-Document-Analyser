import chromadb
import os
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(PROJECT_ROOT, "chroma_db")
COLLECTION_NAME = "obsidian_notes"

print("🔄 Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print(f"📂 Checking ChromaDB at: {CHROMA_PATH}")
client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(name=COLLECTION_NAME)

queries = ["how long can i swim", "what does harsh loves"]

with open("retrieval_debug.log", "w", encoding="utf-8") as f:
    for query in queries:
        f.write(f"\n\n❓ Query: {query}\n")
        query_embedding = embedding_model.encode([query]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=5,
            include=["documents", "distances", "metadatas"]
        )

        f.write("\n🔎 Results:\n")
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                f.write(f"\n--- Result {i+1} ---\n")
                f.write(f"Distance: {results['distances'][0][i]}\n")
                f.write(f"Source: {results['metadatas'][0][i].get('source')}\n")
                f.write(f"Content: {doc}\n")
        else:
            f.write("No results found.\n")
    print("✅ Log written to retrieval_debug.log")
