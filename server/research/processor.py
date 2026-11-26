import re
import logging
from openai import OpenAI

# Setup Ollama client
ollama_client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)

def process_content(raw_text: str) -> str:
    """
    Clean raw scraped text and summarize it using Ollama.
    """
    if not raw_text:
        return ""

    try:
        # 1. Cleaning
        # Remove any lingering HTML tags
        clean_text = re.sub(r'<[^>]+>', '', raw_text)
        
        # Remove junk symbols and non-printable chars (basic)
        clean_text = re.sub(r'[^\x00-\x7f]', '', clean_text)
        
        # Normalize whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # 2. Trimming
        # Max 8000 characters for LLM context safety
        trimmed_text = clean_text[:8000]
        
        if not trimmed_text:
            return "No readable content found to process."

        logging.info(f"🧠 Summarizing content ({len(trimmed_text)} chars) using Ollama (llama3:8b)...")

        # 3. Summarization
        system_prompt = "You are a research assistant. Summarize the provided web content into clean, structured, and professional knowledge. Use bullet points and clear headings."
        
        response = ollama_client.chat.completions.create(
            model="llama3:8b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Summarize into clean structured knowledge:\n\n{trimmed_text}"}
            ]
        )
        
        summary = response.choices[0].message.content.strip()
        
        logging.info("✅ Summarization complete.")
        return summary

    except Exception as e:
        logging.error(f"❌ Processing/Summarization failed: {e}")
        return f"Error processing research content: {str(e)}"

# Alias for old function if needed
def clean_html(html_content: str) -> str:
    return process_content(html_content)
