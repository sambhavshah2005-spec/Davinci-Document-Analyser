import sqlite3
import datetime
import os
import json

DB_NAME = "chat.db"

def init_db():
    """Initialize the database tables if they don't exist"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Documents table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        chunk_count INTEGER,
        uploaded_at TEXT,
        file_type TEXT,
        file_size INTEGER
    )
    ''')
    
    # Chat Sessions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at TEXT
    )
    ''')

    # Chat History table (updated to include session_id)
    # Note: For existing DBs, this won't add the column. 
    # We will check if column exists and add it if not.
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT,
        session_id TEXT,
        role TEXT,
        content TEXT,
        timestamp TEXT,
        FOREIGN KEY(doc_id) REFERENCES documents(id),
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
    )
    ''')
    
    # Check if session_id column exists in chat_history (migration hack)
    cursor.execute("PRAGMA table_info(chat_history)")
    columns = [info[1] for info in cursor.fetchall()]
    if "session_id" not in columns:
        try:
            cursor.execute("ALTER TABLE chat_history ADD COLUMN session_id TEXT")
        except:
            pass # Column might exist or other error
            
    conn.commit()
    conn.close()

def add_document(doc_id, filename, filepath, chunk_count, file_type, file_size):
    """Save document metadata to DB"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    uploaded_at = datetime.datetime.now().isoformat()
    
    cursor.execute('''
    INSERT OR REPLACE INTO documents (id, filename, filepath, chunk_count, uploaded_at, file_type, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (doc_id, filename, filepath, chunk_count, uploaded_at, file_type, file_size))
    
    conn.commit()
    conn.close()

def get_documents():
    """Get all documents"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM documents ORDER BY uploaded_at DESC')
    rows = cursor.fetchall()
    
    documents = []
    for row in rows:
        documents.append({
            "id": row["id"],
            "filename": row["filename"],
            "filepath": row["filepath"],
            "chunk_count": row["chunk_count"],
            "uploaded_at": row["uploaded_at"],
            "type": row["file_type"],
            "size": row["file_size"]
        })
    
    conn.close()
    return documents

def get_document(doc_id):
    """Get specific document"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "filename": row["filename"],
            "filepath": row["filepath"],
            "chunk_count": row["chunk_count"],
            "uploaded_at": row["uploaded_at"],
            "type": row["file_type"],
            "size": row["file_size"]
        }
    return None

def create_chat_session(session_id, title):
    """Create a new chat session"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    created_at = datetime.datetime.now().isoformat()
    
    cursor.execute('''
    INSERT INTO chat_sessions (id, title, created_at)
    VALUES (?, ?, ?)
    ''', (session_id, title, created_at))
    
    conn.commit()
    conn.close()
    return session_id

def get_chat_sessions():
    """Get all chat sessions"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM chat_sessions ORDER BY created_at DESC')
    rows = cursor.fetchall()
    
    sessions = []
    for row in rows:
        sessions.append({
            "id": row["id"],
            "title": row["title"],
            "created_at": row["created_at"]
        })
    
    conn.close()
    return sessions

def add_chat_message(doc_id, role, content, session_id=None):
    """Save a chat message"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().isoformat()
    
    cursor.execute('''
    INSERT INTO chat_history (doc_id, session_id, role, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
    ''', (doc_id, session_id, role, content, timestamp))
    
    conn.commit()
    conn.close()

def get_chat_history(doc_id=None, session_id=None):
    """Get chat history for a document OR a session"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute('SELECT id, role, content, timestamp FROM chat_history WHERE session_id = ? ORDER BY id ASC', (session_id,))
    elif doc_id:
        cursor.execute('SELECT id, role, content, timestamp FROM chat_history WHERE doc_id = ? ORDER BY id ASC', (doc_id,))
    else:
        return []
        
    rows = cursor.fetchall()
    
    history = []
    for row in rows:
        history.append({
            "id": str(row["id"]), # Convert to string for frontend consistency
            "role": row["role"],
            "content": row["content"],
            "timestamp": row["timestamp"]
        })
    
    conn.close()
    return history

def delete_session(session_id):
    """Delete a session and its messages"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_id,))
    cursor.execute('DELETE FROM chat_sessions WHERE id = ?', (session_id,))
    conn.commit()
    conn.close()

def delete_document(doc_id):
    """Delete document and its chat history"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Delete chat history first (foreign key)
    cursor.execute('DELETE FROM chat_history WHERE doc_id = ?', (doc_id,))
    
    # Delete document
    cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    
    conn.commit()
    conn.close()

def update_document_name(doc_id, new_name):
    """Update document filename"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('UPDATE documents SET filename = ? WHERE id = ?', (new_name, doc_id))
    
    conn.commit()
    conn.close()
