// Core types for the AI Research Assistant

export type AppMode = 'chat' | 'document' | 'research' | 'explorer';

export type KnowledgeSourceType = 'obsidian' | 'document' | 'web';

export type SyncStatus = 'synced' | 'indexing' | 'error' | 'disconnected';

export type ResearchDepth = 'quick' | 'deep';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export interface SourceReference {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  excerpt: string;
  confidence: number;
  path?: string;
  url?: string;
  matchedText?: string;
}

export interface ObsidianNote {
  id: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  lastModified: Date;
  similarity?: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  size: number;
  uploadedAt: Date;
  previewUrl?: string;
  chunks?: DocumentChunk[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface DocumentChunk {
  id: string;
  pageNumber: number;
  content: string;
  startOffset: number;
  endOffset: number;
}

export interface ResearchTask {
  id: string;
  topic: string;
  depth: ResearchDepth;
  status: 'pending' | 'crawling' | 'analyzing' | 'summarizing' | 'complete' | 'error';
  progress: number;
  sources: WebSource[];
  summary?: string;
  createdAt: Date;
}

export interface WebSource {
  id: string;
  url: string;
  title: string;
  domain: string;
  credibilityScore: number;
  snippet: string;
  crawledAt: Date;
}

export interface SystemHealth {
  ollama: 'online' | 'offline' | 'loading';
  chromadb: 'online' | 'offline' | 'loading';
  obsidian: SyncStatus;
}

// API Contracts
export interface ChatRequest {
  message: string;
  conversationId?: string;
  sources?: KnowledgeSourceType[];
}

export interface ChatResponse {
  id: string;
  content: string;
  sources: SourceReference[];
}

export interface SearchRequest {
  query: string;
  sources: KnowledgeSourceType[];
  limit?: number;
}

export interface SearchResponse {
  results: SourceReference[];
  totalCount: number;
}

export interface DocumentUploadRequest {
  file: File;
}

export interface DocumentQueryRequest {
  documentId: string;
  query: string;
  includeKnowledgeBase?: boolean;
}

export interface ResearchStartRequest {
  topic: string;
  depth: ResearchDepth;
}

export interface ObsidianSaveRequest {
  title: string;
  content: string;
  folder?: string;
  tags?: string[];
}
