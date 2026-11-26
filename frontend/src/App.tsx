import React, { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { 
  MessageSquare, 
  FileSearch, 
  Globe, 
  Database, 
  Settings as SettingsIcon,
  Plus,
  MemoryStick as Memory,
  Network,
  Bell,
  UserCircle,
  Search,
  Send,
  Paperclip,
  Sparkles,
  Download,
  Quote,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  Menu,
  X,
  Upload,
  File,
  MoreVertical,
  Edit2,
  BookOpen,
  Telescope,
  Clock,
  Loader2,
  Check,
  Zap,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// --- TYPES ---

type AppMode = 'chat' | 'analyzer' | 'web' | 'kb' | 'settings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cards?: { title: string; desc: string }[];
  sources?: string[];
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: string;
  filepath: string;
  previewUrl?: string;
}

interface ResearchJob {
  id: string;
  topic: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  message: string;
  progress: number;
}

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  contextPanelOpen: boolean;
  toggleContextPanel: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeDocument: Document | null;
  setActiveDocument: (doc: Document | null) => void;
}

// --- STORE ---

const useAppStore = create<AppState>((set) => ({
  mode: 'chat',
  setMode: (mode) => set({ mode, mobileMenuOpen: false }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  contextPanelOpen: true,
  toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  activeDocument: null,
  setActiveDocument: (doc) => set({ activeDocument: doc }),
}));

// --- API SERVICE ---

const API_BASE_URL = ""; // Using direct proxy

const api = {
  ask: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Server error");
    }
    return response.json();
  },
  getDocuments: async () => {
    const response = await fetch(`${API_BASE_URL}/documents`);
    return response.json();
  },
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/analyzer/upload`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },
  deleteDocument: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
  analyzerQuery: async (query: string, docId: string) => {
    const response = await fetch(`${API_BASE_URL}/analyzer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, doc_id: docId }),
    });
    return response.json();
  },
  startResearch: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return response.json();
  }
};

// --- COMPONENTS ---

const Sidebar = () => {
  const { mode, setMode, sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  
  const navItems = [
    { name: 'Research Chat', id: 'chat' as const, icon: MessageSquare },
    { name: 'Document Analyzer', id: 'analyzer' as const, icon: FileSearch },
    { name: 'Web Research', id: 'web' as const, icon: Globe },
    { name: 'Knowledge Base', id: 'kb' as const, icon: Database },
    { name: 'Settings', id: 'settings' as const, icon: SettingsIcon },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
    md:relative md:translate-x-0
    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}
    bg-neutral-900/90 backdrop-blur-2xl border-r border-white/5 shadow-2xl flex flex-col w-64
  `;

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={sidebarClasses}>
        <div className="p-6 flex items-center justify-between">
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div>
              <h1 className="text-xl font-bold tracking-widest text-neutral-100 font-headline uppercase mb-1">Luminescent</h1>
              <p className="text-xs text-neutral-400 font-label tracking-wider opacity-60">AI Research System</p>
            </div>
          )}
          <button onClick={toggleSidebar} className="hidden md:block p-2 text-neutral-500 hover:text-primary transition-colors">
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-neutral-500 hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-4 mb-6">
          <button className={`w-full py-3 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:scale-95 active:scale-90 shadow-lg shadow-primary-container/20 ${sidebarCollapsed && !mobileMenuOpen ? 'px-0' : 'px-4'}`}>
            <Plus size={16} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="font-semibold text-sm">New Session</span>}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 transition-all duration-200 rounded-lg ${
                  isActive 
                    ? 'border-l-4 border-primary bg-neutral-800/50 text-primary font-semibold' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
                } ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center border-l-0' : ''}`}
              >
                <item.icon size={20} />
                {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>
        
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="mt-auto p-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-label uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <Memory size={12} />
                <span>Ollama Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-label uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <Network size={12} />
                <span>ChromaDB Connected</span>
              </div>
            </div>
            
            <div className="pt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/10 bg-neutral-800 flex items-center justify-center text-xs font-bold">MP</div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-100">Alexander Thorne</span>
                <span className="text-[10px] text-neutral-500">Lead Researcher</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

const Header = ({ title }: { title: string }) => {
  const { toggleContextPanel, setMobileMenuOpen } = useAppStore();
  return (
    <header className="flex items-center justify-between px-4 md:px-8 h-16 bg-neutral-950/50 backdrop-blur-md w-full sticky top-0 z-40 border-b border-white/5">
      <div className="flex items-center gap-4">
        <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
        <span className="text-xs font-label text-neutral-500 tracking-[0.2em] uppercase hidden sm:block">{title}</span>
        <span className="text-xs font-label text-neutral-500 tracking-[0.2em] uppercase sm:hidden truncate max-w-[100px]">{title}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative group hidden sm:block">
          <input 
            className="bg-surface-container-high border-none rounded-full px-5 py-1.5 text-[10px] md:text-xs w-40 md:w-64 outline-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-on-surface-variant placeholder:text-neutral-600 caret-primary" 
            placeholder="Search archive..." 
            type="text"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500" size={14} />
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-neutral-500">
          <button onClick={toggleContextPanel} className="hover:text-primary transition-opacity opacity-80 hover:opacity-100 hidden md:block">
            <Activity size={20} />
          </button>
          <button className="hover:text-primary transition-opacity opacity-80 hover:opacity-100">
            <Bell size={20} className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>
          <button className="hover:text-primary transition-opacity opacity-80 hover:opacity-100">
            <UserCircle size={20} className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

const ContextPanel = () => {
  return (
    <aside className="w-80 h-full border-l border-white/5 bg-surface-container-low/50 hidden lg:flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <h3 className="text-xs font-label uppercase tracking-widest text-neutral-500 mb-6">Research Context</h3>
      <div className="space-y-6">
        <div className="p-4 bg-surface-container-high/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-primary">Active Analysis</span>
            <Sparkles size={12} className="text-primary" />
          </div>
          <div className="space-y-3">
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[75%]"></div>
            </div>
            <p className="text-[10px] text-neutral-400">Synthesizing 14 sources across 3 database clusters.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <span className="text-[10px] font-label uppercase tracking-widest text-neutral-600">Quick Actions</span>
          <button className="w-full text-left px-4 py-3 bg-surface-container rounded-xl text-xs hover:bg-surface-container-high transition-colors flex items-center justify-between group">
            <span>Export Synthesis</span>
            <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button className="w-full text-left px-4 py-3 bg-surface-container rounded-xl text-xs hover:bg-surface-container-high transition-colors flex items-center justify-between group">
            <span>Generate Citations</span>
            <Quote size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </aside>
  );
};

// --- CHAT PANEL ---

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Direct vault-only query
      const response = await api.ask(query);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer || "I couldn't find an answer in your vault.",
        timestamp: new Date(),
        sources: response.sources?.map((s: any) => s.metadata?.source || 'Source') || []
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || "Error connecting to server.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-dim relative overflow-hidden">
      <Header title="Research Chat" />
      
      <main ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-10 max-w-5xl mx-auto w-full space-y-10 pb-40">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 pt-20">
            <Sparkles size={64} className="text-primary" />
            <div>
              <h2 className="text-xl font-headline font-bold">Luminescent Research</h2>
              <p className="text-sm font-label uppercase tracking-widest">Awaiting query...</p>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center gap-3 mb-2 opacity-50 group-hover:opacity-100 transition-opacity px-2">
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 bg-primary-container rounded-sm flex items-center justify-center text-primary">
                  <Sparkles size={12} />
                </div>
              )}
              <span className={`text-[10px] font-label tracking-tighter uppercase ${msg.role === 'assistant' ? 'text-primary' : ''}`}>
                {msg.role === 'user' ? 'You' : 'Luminescent AI'}
              </span>
              <span className="text-[10px] font-label text-neutral-600">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className={`relative ${
              msg.role === 'user' 
                ? 'bg-surface-container-highest text-on-surface max-w-[85%] md:max-w-[80%] px-5 py-3 md:px-6 md:py-4 rounded-2xl rounded-tr-none' 
                : 'bg-neutral-900/40 backdrop-blur-xl border-l border-primary/20 max-w-[95%] md:max-w-[90%] px-6 py-4 md:px-8 md:py-6 rounded-2xl rounded-tl-none text-on-surface-variant'
              } shadow-sm text-sm leading-relaxed whitespace-pre-wrap`}>
              
              {msg.role === 'assistant' && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-2xl"></div>}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-primary opacity-50 px-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        )}
      </main>

      {/* Input Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-surface-dim via-surface-dim/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl"></div>
            <div className="relative bg-surface-container-high rounded-2xl flex items-end gap-2 md:gap-3 p-3 md:p-4 shadow-2xl border border-white/5">
              <button className="p-2 text-neutral-500 hover:text-primary transition-colors">
                <Paperclip size={20} />
              </button>
              <textarea 
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-on-surface placeholder:text-neutral-600 text-sm py-2 resize-none max-h-40 custom-scrollbar caret-primary" 
                placeholder="Deep research into knowledge vault..." 
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isLoading || !inputValue.trim() 
                    ? 'bg-neutral-800 text-neutral-500' 
                    : 'bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ANALYZER PANEL ---

const AnalyzerPanel = () => {
  const { activeDocument, setActiveDocument } = useAppStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const docs = await api.getDocuments();
      const mappedDocs = docs.map((d: any) => ({
        id: d.id,
        name: d.filename,
        size: d.size,
        type: d.type,
        status: 'ready',
        filepath: d.filepath,
        previewUrl: `http://localhost:5000/files/${d.filepath}`
      }));
      setDocuments(mappedDocs);
    } catch (error) {
      console.error("Error fetching docs:", error);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await api.uploadDocument(file);
      if (result.success) {
        await fetchDocs();
        const newDoc: Document = {
          id: result.doc_id,
          name: result.filename,
          size: file.size,
          type: file.name.split('.').pop() || 'file',
          status: 'ready',
          filepath: result.filepath || result.doc_id,
          previewUrl: result.preview_url
        };
        setActiveDocument(newDoc);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim() || !activeDocument || isQuerying) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setIsQuerying(true);
    
    try {
      const response = await api.analyzerQuery(currentQuery, activeDocument.id);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer || "No response from analyzer.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Query failed:", error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this document?")) {
      await api.deleteDocument(id);
      if (activeDocument?.id === id) setActiveDocument(null);
      fetchDocs();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-dim overflow-hidden">
      <Header title="Document Analyzer" />
      
      <div className="flex-1 flex overflow-hidden">
        {!activeDocument ? (
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12">
              <div 
                className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer group ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">Ingest New Archive</h3>
                <p className="text-sm text-neutral-500 font-label tracking-wide uppercase">PDF, DOCX, TXT • Max 50MB</p>
                {isUploading && <div className="mt-6 flex items-center justify-center gap-2 text-primary text-sm font-semibold animate-pulse"><Sparkles size={16} /> Uploading...</div>}
              </div>

              {documents.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-label uppercase tracking-[0.2em] text-neutral-500">Recent Archives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="p-4 bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                        onClick={() => setActiveDocument(doc)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
                            <File size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold truncate max-w-[200px]">{doc.name}</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{(doc.size/1024).toFixed(0)} KB • {doc.status}</p>
                          </div>
                        </div>
                        <button 
                          className="p-2 text-neutral-600 hover:text-error transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden h-full">
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              <div className="flex-1 border-r border-white/5 bg-neutral-950/30 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" size={18} />
                    <h3 className="font-semibold text-sm truncate max-w-[200px] md:max-w-[400px]">{activeDocument.name}</h3>
                  </div>
                  <button onClick={() => setActiveDocument(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative group">
                  {activeDocument.previewUrl ? (
                    <iframe src={activeDocument.previewUrl} className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4">
                      <BookOpen size={48} className="opacity-20" />
                      <p className="text-xs uppercase tracking-widest font-label">Preview not supported</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-[450px] flex flex-col bg-surface-dim overflow-hidden h-full">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-xs font-label uppercase tracking-widest text-neutral-500">Document Analysis</h3>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                      <Database size={32} />
                      <p className="text-xs font-label uppercase tracking-widest">Query this archive</p>
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        msg.role === 'user' ? 'bg-surface-container-highest rounded-tr-none' : 'bg-neutral-900 border-l border-primary/20 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isQuerying && <div className="text-primary animate-pulse text-xs flex gap-1"><div className="w-1 h-1 bg-primary rounded-full"></div><div className="w-1 h-1 bg-primary rounded-full"></div><div className="w-1 h-1 bg-primary rounded-full"></div></div>}
                </div>

                <div className="p-6 bg-gradient-to-t from-surface-dim to-transparent">
                  <div className="relative bg-surface-container-high rounded-xl flex items-center p-2 border border-white/5 focus-within:border-primary/30 transition-all">
                    <input 
                      type="text" 
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 outline-none caret-primary" 
                      placeholder="Ask the document..." 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                    />
                    <button 
                      onClick={handleQuery}
                      disabled={isQuerying || !query.trim()}
                      className="w-10 h-10 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                      {isQuerying ? <Sparkles size={16} className="animate-pulse" /> : <Search size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- WEB RESEARCH PANEL ---
const WebResearchPanel = () => {
  const [topic, setTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);

  const handleStart = async () => {
    if (!topic.trim()) return;
    
    setResearchResult(null);
    setIsResearching(true);
    const researchTopic = topic;
    setTopic('');

    try {
      const result = await api.startResearch(researchTopic);
      if (result.answer) {
        setResearchResult(result.answer);
      }
    } catch (error) {
      console.error("Research failed:", error);
      setResearchResult("Research failed. Please check if the backend is running and try again.");
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-dim overflow-hidden">
      <Header title="Web Research" />
      
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-12">
          {!isResearching && !researchResult ? (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 glow-primary">
                <Telescope size={40} className="text-on-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold mb-3">AI Deep Discovery</h2>
                <p className="text-neutral-500 font-label tracking-widest uppercase text-xs">Autonomous Web Synthesis</p>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-2xl group-focus-within:bg-primary/10 transition-all rounded-3xl"></div>
                <div className="relative bg-surface-container-high rounded-2xl flex items-center p-2 border border-white/5 shadow-2xl">
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-base px-6 py-4 outline-none caret-primary placeholder:text-neutral-600" 
                    placeholder="What would you like me to research deep?..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  />
                  <button 
                    onClick={handleStart}
                    disabled={!topic.trim()}
                    className="w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-20"
                  >
                    <Search size={24} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-surface-container rounded-2xl border border-white/5">
                  <Zap size={16} className="text-primary mb-2" />
                  <p className="text-xs font-semibold mb-1">Deep Synthesis</p>
                  <p className="text-[10px] text-neutral-500">Crawls top results & summarizes</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl border border-white/5">
                  <Database size={16} className="text-primary mb-2" />
                  <p className="text-xs font-semibold mb-1">Auto-Indexing</p>
                  <p className="text-[10px] text-neutral-500">Stored in your knowledge vault</p>
                </div>
              </div>
            </div>
          ) : isResearching ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 py-12">
              <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-3xl border border-white/5 p-16 shadow-2xl relative overflow-hidden text-center">
                <div className="flex flex-col items-center space-y-6">
                  <Loader2 size={64} className="animate-spin text-primary" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Discovery in Progress</h3>
                    <p className="text-sm text-neutral-500 animate-pulse">Searching multiple sources, visiting top results, and synthesizing knowledge...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Research Summary</h3>
                <button 
                  onClick={() => setResearchResult(null)}
                  className="text-xs text-primary hover:underline"
                >
                  Start New Discovery
                </button>
              </div>
              <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-xl prose prose-invert max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-on-surface-variant">
                  {researchResult}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                    <Check size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Research Complete & Indexed</p>
                    <p className="text-xs text-neutral-400">This information is now available in your Research Chat.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const { mode, contextPanelOpen } = useAppStore();

  const renderContent = () => {
    switch (mode) {
      case 'chat': return <ChatPanel />;
      case 'analyzer': return <AnalyzerPanel />;
      case 'web': return <WebResearchPanel />;
      case 'kb': return <div className="flex-1 flex flex-col bg-surface-dim"><Header title="Knowledge Base" /><div className="flex-1 flex items-center justify-center opacity-20">Coming Soon</div></div>;
      case 'settings': return <div className="flex-1 flex flex-col bg-surface-dim"><Header title="Settings" /><div className="flex-1 flex items-center justify-center opacity-20">Coming Soon</div></div>;
      default: return <ChatPanel />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface text-neutral-100 selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>
      {contextPanelOpen && mode === 'chat' && <ContextPanel />}
    </div>
  );
}
