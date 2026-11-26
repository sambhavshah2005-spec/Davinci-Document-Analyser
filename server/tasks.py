"""
Huey-based task definitions for research and workflow processing
"""
import time
import chromadb
import openai
from dotenv import load_dotenv
import os
import uuid
import traceback
from huey import SqliteHuey
from typing import Dict, Any

# Load environment variables
load_dotenv()

# === Huey Configuration ===
# Using SQLite for simplicity - no Redis needed
huey = SqliteHuey('davinci_tasks', filename='tasks.db')

# === ChromaDB Setup ===
VAULT_PATH = r"C:\Users\Margil\OneDrive\Documents\MyNotes\Rag"  # Your Obsidian folder
CHROMA_PATH = os.path.join("chroma_db", uuid.uuid5(uuid.NAMESPACE_DNS, VAULT_PATH).hex)
COLLECTION_NAME = "obsidian_notes"

# Global ChromaDB client (initialized once)
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

@huey.task()
def process_research_task(query: str, task_id: str = None) -> Dict[str, Any]:
    """Process a research job using Huey"""
    try:
        print(f"Processing research task: {query}")
        
        # Query Chroma with distances
        results = collection.query(
            query_texts=[query],
            n_results=5,
            include=["documents", "distances", "metadatas"]
        )

        retrieved_docs = []
        retrieved_metadatas = []
        retrieved_distances = []

        # Filter by distance for relevance
        if results["documents"]:
            for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
                if dist < 1.5:  # Relevance threshold
                    retrieved_docs.append(doc)
                    retrieved_metadatas.append(meta)
                    retrieved_distances.append(dist)

        if not retrieved_docs:
            return {
                "success": False,
                "answer": "❌ No specific information found in your notes regarding this subject for research.",
                "sources": [],
                "query": query
            }

        context = "\n---\n".join(retrieved_docs)

        system_prompt = f"""
You are a strict research assistant. Your task is to provide analysis ONLY based on the specific subject requested.

STRICT RULES:
1. If the specific subject or entity mentioned in the query is NOT present in the context, state that you don't have information about that specific subject.
2. DO NOT provide research about other entities or subjects found in the context if they are not the primary subject of the query.
3. Provide detailed insights only if they directly relate to the requested subject.
4. If information is missing, say "I need more specific information in your notes regarding [Subject] for complete research".
5. Structure your response with clear sections and bullet points.

Context from your notes:
{context}
"""

        openai_client = openai.OpenAI(
            base_url='http://localhost:11434/v1',
            api_key='ollama',  # required, but unused
        )

        response = openai_client.chat.completions.create(
            model="llama3:8b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )

        answer = response.choices[0].message.content
        
        # Prepare result with metadata
        result = {
            "success": True,
            "answer": answer,
            "sources": [
                {
                    "content": doc[:200] + "..." if len(doc) > 200 else doc,
                    "distance": float(dist) if dist is not None else None,
                    "metadata": meta
                }
                for doc, dist, meta in zip(
                    retrieved_docs, 
                    retrieved_distances, 
                    retrieved_metadatas
                )
            ],
            "query": query,
            "processed_at": time.time()
        }
        
        print(f"Completed research task: {query}")
        return result
        
    except Exception as e:
        error_msg = f"Error processing research task: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        return {
            "success": False,
            "answer": f"❌ Error: {error_msg}",
            "sources": [],
            "query": query,
            "error": str(e)
        }

@huey.task()
def process_workflow_task(query: str, task_id: str = None) -> Dict[str, Any]:
    """Process a workflow job using Huey"""
    try:
        print(f"Processing workflow task: {query}")
        
        # Search for workflow-related content
        results = collection.query(
            query_texts=[query],
            n_results=3,
            include=["documents", "distances", "metadatas"]
        )

        documents = results["documents"][0]

        if not documents or all(doc.strip() == "" for doc in documents):
            return {
                "success": False,
                "answer": "❌ No workflow information found in your notes.",
                "sources": [],
                "query": query
            }

        context = "\n---\n".join(documents)

        system_prompt = f"""
You are a workflow assistant that helps create actionable step-by-step processes based on the provided notes context.

Rules:
- Create clear, actionable workflows and processes
- Break down complex tasks into step-by-step instructions
- Use numbered lists and clear formatting
- Focus on practical implementation
- If the context doesn't have enough information, say "I need more workflow information in your notes"
- Emphasize actionable next steps

Context from your notes:
{context}
"""

        openai_client = openai.OpenAI(
            base_url='http://localhost:11434/v1',
            api_key='ollama',  # required, but unused
        )

        response = openai_client.chat.completions.create(
            model="llama3:8b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )

        answer = response.choices[0].message.content
        
        result = {
            "success": True,
            "answer": answer,
            "sources": [
                {
                    "content": doc[:200] + "..." if len(doc) > 200 else doc,
                    "distance": float(dist) if dist is not None else None,
                    "metadata": meta
                }
                for doc, dist, meta in zip(
                    documents, 
                    results["distances"][0], 
                    results["metadatas"][0]
                )
            ],
            "query": query,
            "processed_at": time.time()
        }
        
        print(f"Completed workflow task: {query}")
        return result
        
    except Exception as e:
        error_msg = f"Error processing workflow task: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        return {
            "success": False,
            "answer": f"❌ Error: {error_msg}",
            "sources": [],
            "query": query,
            "error": str(e)
        }

# Export the huey instance for the consumer
__all__ = ['huey', 'process_research_task', 'process_workflow_task'] 