import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, Zap, Clock, ExternalLink, Check, Save, Loader2, TrendingUp, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResearch } from '@/hooks/useResearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ResearchDepth, WebSource } from '@/types';

const DepthSelector = ({
  value,
  onChange,
}: {
  value: ResearchDepth;
  onChange: (depth: ResearchDepth) => void;
}) => (
  <div className="flex gap-3">
    {(['quick', 'deep'] as ResearchDepth[]).map((depth) => (
      <motion.button
        key={depth}
        onClick={() => onChange(depth)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-lg border transition-all duration-200',
          value === depth
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
        )}
      >
        {depth === 'quick' ? <Zap size={16} strokeWidth={1.5} /> : <TrendingUp size={16} strokeWidth={1.5} />}
        <span className="text-sm font-medium capitalize">{depth}</span>
        <span className="text-xs text-muted-foreground font-mono">
          {depth === 'quick' ? '~30s' : '~2min'}
        </span>
      </motion.button>
    ))}
  </div>
);

const SourceCard = ({ source, index }: { source: WebSource; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ x: -4 }}
    className="glass-card p-4 group"
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <Globe size={12} className="text-warning flex-shrink-0" strokeWidth={1.5} />
        <span className="text-[10px] text-muted-foreground truncate font-mono">{source.domain}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            source.credibilityScore >= 0.9
              ? 'bg-success'
              : source.credibilityScore >= 0.7
              ? 'bg-warning'
              : 'bg-destructive'
          )}
        />
        <span className="text-[10px] text-muted-foreground font-mono">
          {Math.round(source.credibilityScore * 100)}%
        </span>
      </div>
    </div>
    
    <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-1">
      {source.title}
    </h4>
    
    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
      {source.snippet}
    </p>
    
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline link-underline"
    >
      View source
      <ExternalLink size={10} strokeWidth={1.5} />
    </a>
  </motion.div>
);

const ResearchProgress = ({ status, progress }: { status: string; progress: number }) => {
  const stages = ['crawling', 'analyzing', 'summarizing', 'complete'];
  const currentIndex = stages.indexOf(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Research Progress</span>
        <span className="text-xs font-mono text-foreground">{progress}%</span>
      </div>
      
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </div>

      <div className="flex justify-between">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className={cn(
              'flex flex-col items-center gap-1.5',
              index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <motion.div
              animate={{ scale: index === currentIndex ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: index === currentIndex ? Infinity : 0, duration: 1 }}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                index < currentIndex
                  ? 'bg-success'
                  : index === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            >
              {index < currentIndex ? (
                <Check size={10} className="text-success-foreground" strokeWidth={2} />
              ) : index === currentIndex ? (
                <Loader2 size={10} className="animate-spin" strokeWidth={2} />
              ) : (
                <span className="text-[9px] font-mono">{index + 1}</span>
              )}
            </motion.div>
            <span className="text-[9px] capitalize font-medium">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function WebResearch() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('quick');
  const { activeTask, startResearch, isStarting, clearTask } = useResearch();

  const handleStart = () => {
    if (topic.trim()) {
      startResearch({ topic: topic.trim(), depth });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-14 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-warning" strokeWidth={1.5} />
          <h1 className="font-serif font-medium text-foreground">Web Research</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden">
        {!activeTask ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto space-y-8"
          >
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center mx-auto mb-6 glow-primary"
              >
                <Telescope className="w-9 h-9 text-primary-foreground" strokeWidth={1.5} />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-serif font-semibold text-foreground mb-3"
              >
                AI-Powered Research
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground leading-relaxed"
              >
                Let AI crawl the web, analyze sources, and summarize findings for you.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a research topic..."
                className="h-12 text-base bg-muted/50"
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />

              <DepthSelector value={depth} onChange={setDepth} />

              <Button
                onClick={handleStart}
                disabled={isStarting || !topic.trim()}
                variant="gradient"
                className="w-full h-12 gap-2"
              >
                {isStarting ? (
                  <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />
                ) : (
                  <Search size={18} strokeWidth={1.5} />
                )}
                Start Research
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Progress & Sources */}
            <div className="flex flex-col">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 mb-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-medium text-foreground">{activeTask.topic}</h3>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock size={10} strokeWidth={1.5} />
                    {activeTask.depth === 'quick' ? 'Quick' : 'Deep'}
                  </span>
                </div>
                <ResearchProgress status={activeTask.status} progress={activeTask.progress} />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Sources Found ({activeTask.sources.length})
                </h4>
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="space-y-3 pr-2">
                    {activeTask.sources.map((source, index) => (
                      <SourceCard key={source.id} source={source} index={index} />
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </div>

            {/* Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 flex flex-col"
            >
              <h3 className="font-serif font-medium text-foreground mb-4">Research Summary</h3>
              
              <AnimatePresence mode="wait">
                {activeTask.status === 'complete' && activeTask.summary ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    <ScrollArea className="flex-1 mb-4">
                      <p className="text-sm text-foreground/85 leading-relaxed">
                        {activeTask.summary}
                      </p>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2" onClick={clearTask}>
                        New Research
                      </Button>
                      <Button variant="gradient" className="flex-1 gap-2">
                        <Save size={14} strokeWidth={1.5} />
                        Save to Obsidian
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-sm text-muted-foreground">
                        Generating summary...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
