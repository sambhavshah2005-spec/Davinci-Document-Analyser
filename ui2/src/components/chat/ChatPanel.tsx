import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Zap, BookOpen, FileSearch, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5 } 
  },
};

const EmptyState = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="flex-1 flex flex-col items-center justify-center p-8"
  >
    <motion.div 
      variants={staggerItem}
      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center mb-8 glow-primary"
    >
      <BookOpen className="w-9 h-9 text-primary-foreground" />
    </motion.div>
    
    <motion.h2 
      variants={staggerItem}
      className="text-3xl font-serif font-semibold text-foreground mb-3 tracking-tight"
    >
      Welcome, Researcher
    </motion.h2>
    <motion.p 
      variants={staggerItem}
      className="text-muted-foreground text-center max-w-md mb-10 leading-relaxed"
    >
      Your personal AI research companion. Query your Obsidian vault, analyze documents, 
      and discover insights across your knowledge base.
    </motion.p>

    <motion.div 
      variants={staggerItem}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full"
    >
      {[
        {
          icon: MessageSquare,
          title: 'Semantic Search',
          description: 'Query your notes using natural language',
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
        {
          icon: FileSearch,
          title: 'Document Analysis',
          description: 'Extract insights from PDFs and documents',
          color: 'text-accent',
          bg: 'bg-accent/10',
        },
        {
          icon: Globe,
          title: 'Web Research',
          description: 'Automated research with source attribution',
          color: 'text-warning',
          bg: 'bg-warning/10',
        },
      ].map((feature, index) => (
        <motion.div
          key={feature.title}
          variants={staggerItem}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className={cn(
            'w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
            feature.bg
          )}>
            <feature.icon className={cn('w-5 h-5', feature.color)} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </motion.div>

    <motion.div
      variants={staggerItem}
      className="mt-10 flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Sparkles size={12} className="text-primary" />
      <span>Powered by local LLMs via Ollama</span>
    </motion.div>
  </motion.div>
);

// Need to import cn
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { messages, sendMessage, isPending, isStreaming } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (message: string) => {
    sendMessage({ message, sources: ['obsidian', 'document'] });
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="h-14 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h1 className="font-serif font-medium text-foreground">Research Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {messages.length} messages
          </span>
        </div>
      </motion.div>

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-2">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ChatMessage message={message} />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isPending || isStreaming} />
    </div>
  );
}
