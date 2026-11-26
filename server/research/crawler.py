import requests
from bs4 import BeautifulSoup
import logging
import time
from urllib.parse import quote, unquote

def classify_query(query: str) -> str:
    """
    Classify the query into 'wikipedia' (factual, historical, biography, animal, scientific queries)
    or 'google' (technical, programming, coding error, setup, general search).
    """
    from openai import OpenAI
    try:
        ollama_client = OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama"
        )
        system_prompt = (
            "You are a search routing agent. Your job is to classify the user's search query into one of two routing intents:\n"
            "1. 'wikipedia': If the query is about general knowledge, factual concepts, animals, history, geography, science, biographies, nature, culture, etc. (e.g., 'tiger', 'roman empire', 'albert einstein', 'photosynthesis').\n"
            "2. 'google': If the query is about technical issues, programming, code snippets, library usage, software installation, debugging errors, configuration, latest news/events, or web developer resources (e.g., 'how to write a flask app', 'python TypeError', 'docker build permissions').\n\n"
            "Respond with exactly one word: 'wikipedia' or 'google'. Do not include quotes, explanation, or punctuation."
        )
        response = ollama_client.chat.completions.create(
            model="llama3:8b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.0
        )
        intent = response.choices[0].message.content.strip().lower()
        if "wikipedia" in intent:
            return "wikipedia"
        elif "google" in intent:
            return "google"
    except Exception as e:
        logging.error(f"⚠️ Query classification via Ollama failed: {e}")
        
    # Heuristic fallback if Ollama fails or is offline
    tech_keywords = [
        "code", "program", "error", "install", "how to", "react", "python", "javascript", "docker",
        "kubernetes", "database", "flask", "django", "npm", "pip", "git", "api", "css", "html", "server",
        "framework", "bug", "exception", "configure", "compile", "dependency", "tutorial", "version",
        "build", "script", "import", "package"
    ]
    query_lower = query.lower()
    if any(kw in query_lower for kw in tech_keywords):
        return "google"
    return "wikipedia"

def fetch_google_links(query: str, headers: dict) -> list:
    """
    Search Google and extract result links.
    """
    links = []
    try:
        logging.info(f"🔍 Searching Google: {query}")
        google_url = f"https://www.google.com/search?q={quote(query)}"
        response = requests.get(google_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            for a in soup.find_all('a'):
                href = a.get('href')
                if not href:
                    continue
                # Handle Google redirect links /url?q=...
                if href.startswith('/url?q='):
                    href = href.split('/url?q=')[1].split('&')[0]
                href = unquote(href)
                # Filter out internal Google links and cache links
                if href.startswith('http') and 'google.com' not in href and 'webcache.googleusercontent.com' not in href:
                    links.append(href)
    except Exception as e:
        logging.error(f"❌ Google Search failed: {e}")
    return links

def fetch_brave_links(query: str, headers: dict) -> list:
    """
    Search Brave Search and extract result links.
    """
    links = []
    try:
        logging.info(f"🔍 Searching Brave: {query}")
        brave_url = f"https://search.brave.com/search?q={quote(query)}"
        response = requests.get(brave_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            for a in soup.find_all('a'):
                href = a.get('href')
                if href and href.startswith('http') and 'brave.com' not in href and 'google.com' not in href:
                    links.append(href)
    except Exception as e:
        logging.error(f"❌ Brave Search failed: {e}")
    return links

def fetch_web_data(query: str) -> str:
    """
    Search web based on query classification.
    - Factual/GK queries -> prioritize Wikipedia direct extracts and pages.
    - Technical/Coding queries -> prioritize Google (with Brave as fallback) for stackoverflow/docs/github.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    intent = classify_query(query)
    logging.info(f"🎯 Query intent classified as: {intent.upper()}")
    
    links = []
    
    if intent == "wikipedia":
        logging.info(f"📚 Wikipedia Route: Searching Wikipedia API for '{query}'")
        # 1. Search Wikipedia API
        try:
            wiki_api = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(query)}&format=json"
            response = requests.get(wiki_api, headers=headers, timeout=10)
            if response.status_code == 200:
                results = response.json().get('query', {}).get('search', [])
                for r in results[:3]:
                    title = r['title']
                    # Get direct extract
                    extract_api = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles={quote(title)}&format=json"
                    ext_res = requests.get(extract_api, headers=headers, timeout=10)
                    if ext_res.status_code == 200:
                        pages = ext_res.json().get('query', {}).get('pages', {})
                        for p_id, p_data in pages.items():
                            if 'extract' in p_data:
                                links.append(f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}")
        except Exception as e:
            logging.error(f"❌ Wikipedia API search failed: {e}")
            
        # 2. Add Google search results as fallback or supplementary information
        google_links = fetch_google_links(query, headers)
        if not google_links:
            google_links = fetch_brave_links(query, headers)
        
        # We prefer Wikipedia links in the wikipedia route, so put them first
        links = list(dict.fromkeys(links + google_links))
        
    else: # intent == "google" (technical route)
        logging.info(f"💻 Technical Route: Skipping Wikipedia search, querying Google for '{query}'")
        # Search Google first, fallback to Brave if Google gets blocked or returns empty
        google_links = fetch_google_links(query, headers)
        if not google_links:
            logging.info("🔄 Google empty or blocked. Trying Brave Search...")
            google_links = fetch_brave_links(query, headers)
        
        links = list(dict.fromkeys(google_links))
        
    # Deduplicate and limit to top 6 target links to avoid scraping too many pages
    target_links = links[:6]
    logging.info(f"🔗 Target links ({len(target_links)}): {target_links}")
    
    combined_text = []
    for link in target_links:
        try:
            logging.info(f"🌐 Visiting: {link}")
            time.sleep(1) # Respectful delay
            
            res = requests.get(link, headers=headers, timeout=8)
            logging.info(f"Page Status: {res.status_code}, Length: {len(res.content)}")
            res.raise_for_status()
            
            if len(res.content) > 1000000: # 1MB limit
                logging.warning(f"⚠️ Skipping too large page: {link}")
                continue
                
            page_soup = BeautifulSoup(res.text, 'html.parser')
            
            # Remove scripts, styles, navigation, headers, footers for cleaner technical content
            for tag in page_soup(["script", "style", "nav", "header", "footer", "aside"]):
                tag.decompose()
                
            # Extract content from common article/doc tags
            content_tags = page_soup.find_all(['p', 'article', 'main', 'section', 'code', 'pre'])
            
            # Fallback: find divs with significant text
            if not content_tags or sum(len(t.get_text()) for t in content_tags) < 500:
                for div in page_soup.find_all('div'):
                    if len(div.get_text(strip=True)) > 200:
                        content_tags.append(div)
            
            if not content_tags:
                content_tags = [page_soup.body] if page_soup.body else []
            
            logging.info(f"Found {len(content_tags)} potential content tags")
            
            page_text = ""
            for tag in content_tags:
                text = tag.get_text(separator=' ', strip=True)
                if len(text) > 30:
                    page_text += text + " "
            
            if page_text.strip():
                clean_text = " ".join(page_text.split())
                logging.info(f"Extracted {len(clean_text)} chars from {link}")
                combined_text.append(f"--- Source: {link} ---\n{clean_text[:4000]}") # Increase limit slightly for technical details
            else:
                logging.warning(f"No text extracted from {link}")
                
        except Exception as e:
            logging.error(f"❌ Failed to fetch {link}: {e}")
            continue
            
    if not combined_text:
        return "No research data could be retrieved from the web at this time."
        
    return "\n\n".join(combined_text)

def fetch_duckduckgo_results(query: str) -> str:
    """Alias for backward compatibility."""
    return fetch_web_data(query)
