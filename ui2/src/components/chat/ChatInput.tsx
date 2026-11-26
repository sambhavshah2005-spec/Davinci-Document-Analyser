import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Sparkles, FolderOpen, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import type { KnowledgeSourceType } from '@/types';

interface SourceToggleProps {
  type: KnowledgeSourceType;
  active: boolean;
  onClick: () => void;
}

const SourceToggle = ({ type, active, onClick }: SourceToggleProps) => {
  const config = {
    obsidian: { icon: FolderOpen, label: 'Obsidian', activeClass: 'bg-primary/15 text-primary border-primary/30' },
    document: { icon: FileText, label: 'Docs', activeClass: 'bg-accent/15 text-accent border-accent/30' },
    web: { icon: Globe, label: 'Web', activeClass: 'bg-warning/15 text-warning border-warning/30' },
  };
  
  const { icon: Icon, label, activeClass } = config[type];
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border',
        active
          ? activeClass
          : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50'
      )}
    >
      <Icon size={12} strokeWidth={1.5} />
      {label}
    </motion.button>
  );
};

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeKnowledgeSources, toggleKnowledgeSource } = useAppStore();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-4 border-t border-border bg-background/80 backdrop-blur-sm"
    >
      {/* Source Toggles */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Search:</span>
        <SourceToggle
          type="obsidian"
          active={activeKnowledgeSources.includes('obsidian')}
          onClick={() => toggleKnowledgeSource('obsidian')}
        />
        <SourceToggle
          type="document"
          active={activeKnowledgeSources.includes('document')}
          onClick={() => toggleKnowledgeSource('document')}
        />
        <SourceToggle
          type="web"
          active={activeKnowledgeSources.includes('web')}
          onClick={() => toggleKnowledgeSource('web')}
        />
      </div>

      {/* Input Area */}
      <div className="relative flex items-end gap-3">
        <div className="flex-1 glass-card p-3 flex items-end gap-3">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Paperclip size={16} strokeWidth={1.5} />
          </motion.button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your research..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/70 scrollbar-thin"
          />
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading}
              size="icon"
              className={cn(
                'rounded-lg h-9 w-9 transition-all duration-200',
                message.trim()
                  ? 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isLoading ? (
                <Sparkles size={16} className="animate-pulse" strokeWidth={1.5} />
              ) : (
                <Send size={16} strokeWidth={1.5} />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="flex justify-end mt-2">
        <span className="text-[10px] text-muted-foreground/70">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono mr-1">Enter</kbd>
          to send
        </span>
      </div>
    </motion.div>
  );
}
