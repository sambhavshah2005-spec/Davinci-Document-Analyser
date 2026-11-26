import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, File, X, Search, Database, Sparkles, ChevronRight, BookOpen, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useDocuments } from '@/hooks/useDocuments';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

const DropZone = ({ onDrop }: { onDrop: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onDrop(files[0]);
    }
  }, [onDrop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        onDragOver={handleDragIn}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mx-auto mb-6 glow-primary"
        >
          <Upload className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
        </motion.div>

        <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
          Drop your document here
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Supports PDF, DOCX, and TXT files up to 50MB
        </p>

        <Button variant="outline" className="gap-2">
          <FileText size={16} strokeWidth={1.5} />
          Browse Files
        </Button>
      </div>
    </motion.div>
  );
};

interface ChunkVisualizerProps {
  chunks: { id: string; pageNumber: number; content: string }[];
}

const ChunkVisualizer = ({ chunks }: ChunkVisualizerProps) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
      Document Structure
    </h4>
    <div className="flex flex-wrap gap-2">
      {chunks.map((chunk, index) => (
        <motion.button
          key={chunk.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          className="px-3 py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-sm border border-transparent hover:border-primary/20"
        >
          Page {chunk.pageNumber}
        </motion.button>
      ))}
    </div>
  </div>
);

export function DocumentAnalyzer() {
  const { documents, activeDocument, setActiveDocument, setDocuments } = useAppStore();
  const { uploadDocument, isUploading, queryDocument, isQuerying, fetchDocumentsFn, fetchChatHistoryFn, deleteDocument, renameDocument } = useDocuments();
  const [query, setQuery] = useState('');
  const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Documents List
  const { data: fetchedDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocumentsFn,
  });

  // Sync fetched documents to store
  useEffect(() => {
    if (fetchedDocuments) {
      setDocuments(fetchedDocuments);
    }
  }, [fetchedDocuments, setDocuments]);

  // Fetch Chat History when activeDocument changes
  const { data: fetchedHistory } = useQuery({
    queryKey: ['chatHistory', activeDocument?.id],
    queryFn: () => fetchChatHistoryFn(activeDocument?.id || ''),
    enabled: !!activeDocument?.id,
  });

  // Reset or Set chat history
  useEffect(() => {
    if (activeDocument?.id && fetchedHistory) {
      // Map role 'user'/'assistant' correctly if needed, but DB stores them as such
      setChatHistory(fetchedHistory as any);
    } else {
      setChatHistory([]); // Clear if no doc or no history
    }
  }, [activeDocument?.id, fetchedHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleUpload = (file: File) => {
    uploadDocument(file);
  };

  const handleQuery = () => {
    if (activeDocument && query.trim()) {
      const currentQuery = query.trim();

      // Add user message immediately
      setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
      setQuery('');

      queryDocument(
        { documentId: activeDocument.id, query: currentQuery },
        {
          onSuccess: (data) => {
            setChatHistory(prev => [...prev, { role: 'assistant', content: data }]);
          },
          onError: () => {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
          }
        }
      );
    }
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-14 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <h1 className="font-serif font-medium text-foreground">Document Analyzer</h1>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {!activeDocument ? (
            <div className="max-w-2xl mx-auto">
              <DropZone onDrop={handleUpload} />

              {/* Recent Documents */}
              {documents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                    Recent Documents
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <motion.button
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setActiveDocument(doc)}
                        className="w-full flex items-center gap-4 p-4 glass-card hover-lift text-left group"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <File className="w-5 h-5 text-accent" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {(doc.size / 1024).toFixed(1)} KB • {doc.status}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md -mr-2">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = prompt("Enter new name for document:", doc.name);
                                if (newName && newName.trim() !== "" && newName !== doc.name) {
                                  renameDocument({ docId: doc.id, name: newName.trim() });
                                }
                              }}
                            >
                              <Edit2 size={14} />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this document?')) {
                                  deleteDocument(doc.id, {
                                    onSuccess: () => refetchDocuments()
                                  });
                                  if (activeDocument?.id === doc.id) setActiveDocument(null);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <PanelGroup direction="horizontal" className="h-full">
              {/* Document Preview */}
              <Panel defaultSize={50} minSize={30} className="pr-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel p-6 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-accent" strokeWidth={1.5} />
                      <h3 className="font-serif font-medium text-foreground">{activeDocument.name}</h3>
                    </div>
                    <motion.button
                      onClick={() => setActiveDocument(null)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </motion.button>
                  </div>

                  <div className="flex-1 bg-muted/30 rounded-lg flex items-center justify-center border border-border/50 overflow-hidden relative">
                    {activeDocument.type === 'pdf' && activeDocument.previewUrl ? (
                      <iframe
                        src={activeDocument.previewUrl}
                        className="w-full h-full border-none"
                        title="Document Preview"
                      />
                    ) : activeDocument.type === 'txt' || activeDocument.type === 'md' ? (
                      <iframe
                        src={activeDocument.previewUrl}
                        className="w-full h-full border-none bg-white p-4"
                        title="Text Preview"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
                        <p className="text-sm text-muted-foreground">Preview not available for {activeDocument.type}</p>
                        {/* DEBUG INFO */}
                        <p className="text-xs text-red-400 mt-4 font-mono">
                          DEBUG: URL is "{activeDocument.previewUrl || 'MISSING'}"
                        </p>
                      </div>
                    )}
                  </div>

                  {activeDocument.chunks && (
                    <div className="mt-4">
                      <ChunkVisualizer chunks={activeDocument.chunks} />
                    </div>
                  )}
                </motion.div>
              </Panel>

              {/* Resize Handle (Invisible but interactive) */}
              <PanelResizeHandle className="w-2 bg-transparent hover:bg-primary/10 transition-colors cursor-col-resize -mx-1 z-10" />

              {/* Query Panel */}
              <Panel defaultSize={50} minSize={30} className="pl-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel p-6 flex flex-col h-full"
                >
                  <h3 className="font-serif font-medium text-foreground mb-4">Ask about this document</h3>

                  {/* Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-sm">Include Knowledge Base</span>
                    </div>
                    <Switch checked={includeKnowledgeBase} onCheckedChange={setIncludeKnowledgeBase} />
                  </div>

                  {/* Chat History */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 min-h-0" ref={scrollRef}>
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                        <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Ask questions about your document to start a conversation.</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-3 rounded-lg text-sm leading-relaxed max-w-[90%]",
                            msg.role === 'user'
                              ? "bg-primary/10 text-foreground ml-auto rounded-tr-none"
                              : "bg-muted/50 text-foreground/90 mr-auto rounded-tl-none border border-border/50"
                          )}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1.5 opacity-70">
                              <Sparkles size={10} className="text-primary" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">AI Assistant</span>
                            </div>
                          )}
                          {msg.content}
                        </motion.div>
                      ))
                    )}
                    {isQuerying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-muted/50 text-foreground/90 mr-auto rounded-tl-none border border-border/50 p-3 rounded-lg text-sm max-w-[90%]"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-primary animate-pulse" />
                          <span className="text-muted-foreground italic">Thinking...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Query Input */}
                  <div className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      onKeyDown={(e) => e.key === 'Enter' && !isQuerying && handleQuery()}
                      className="bg-muted/50"
                    />
                    <Button onClick={handleQuery} disabled={isQuerying || !query.trim()} variant="gradient">
                      {isQuerying ? <Sparkles size={16} className="animate-pulse" strokeWidth={1.5} /> : <Search size={16} strokeWidth={1.5} />}
                    </Button>
                  </div>
                </motion.div>
              </Panel>
            </PanelGroup>
          )}
        </div>
      </div>
    </div>
  );
}
