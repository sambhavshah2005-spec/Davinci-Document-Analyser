import { motion } from 'framer-motion';
import { User, Bot, FileText, FolderOpen, Globe, ChevronDown, ChevronUp, Sparkles, Quote } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Message, SourceReference, KnowledgeSourceType } from '@/types';

const SourceBadge = ({ type }: { type: KnowledgeSourceType }) => {
  const config = {
    obsidian: { icon: FolderOpen, label: 'Obsidian', className: 'bg-primary/15 text-primary border-primary/20' },
    document: { icon: FileText, label: 'Document', className: 'bg-accent/15 text-accent border-accent/20' },
    web: { icon: Globe, label: 'Web', className: 'bg-warning/15 text-warning border-warning/20' },
  };
  
  const { icon: Icon, label, className } = config[type];
  
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border', className)}>
      <Icon size={11} strokeWidth={1.5} />
      {label}
    </span>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2 py-3">
    <Quote size={14} className="text-primary/50" />
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-primary rounded-full"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground italic">Researching...</span>
  </div>
);

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-4 p-5 rounded-xl',
        isUser ? 'bg-transparent' : 'glass-card'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
          isUser
            ? 'bg-secondary border border-border'
            : 'bg-gradient-to-br from-primary to-primary/70'
        )}
      >
        {isUser ? (
          <User size={16} className="text-foreground" strokeWidth={1.5} />
        ) : (
          <Bot size={16} className="text-primary-foreground" strokeWidth={1.5} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'You' : 'Research Assistant'}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {message.isStreaming && !message.content ? (
          <TypingIndicator />
        ) : (
          <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Sparkles size={11} className="text-primary" />
              <span className="link-underline">
                View {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
              </span>
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <motion.div
              initial={false}
              animate={{ height: showSources ? 'auto' : 0, opacity: showSources ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-2">
                {message.sources.map((source) => (
                  <SourceBadge key={source.id} type={source.type} />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
