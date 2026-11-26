import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Folder, FileText, ChevronRight, ChevronDown, Hash, Search, Sparkles, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'note';
  children?: FolderNode[];
  tags?: string[];
  similarity?: number;
}

const mockFolderStructure: FolderNode[] = [
  {
    id: '1',
    name: 'AI Research',
    type: 'folder',
    children: [
      { id: '1-1', name: 'LLM Fundamentals', type: 'note', tags: ['ai', 'llm'], similarity: 0.92 },
      { id: '1-2', name: 'Prompt Engineering', type: 'note', tags: ['ai', 'prompts'], similarity: 0.88 },
      { id: '1-3', name: 'RAG Systems', type: 'note', tags: ['ai', 'rag', 'vectors'], similarity: 0.95 },
    ],
  },
  {
    id: '2',
    name: 'Projects',
    type: 'folder',
    children: [
      { id: '2-1', name: 'Personal Assistant', type: 'note', tags: ['project', 'ai'], similarity: 0.78 },
      { id: '2-2', name: 'Knowledge Graph', type: 'note', tags: ['project', 'data'], similarity: 0.65 },
    ],
  },
  {
    id: '3',
    name: 'Daily Notes',
    type: 'folder',
    children: [
      { id: '3-1', name: '2024-01-15', type: 'note', tags: ['daily'], similarity: 0.45 },
      { id: '3-2', name: '2024-01-16', type: 'note', tags: ['daily'], similarity: 0.52 },
    ],
  },
];

const SimilarityBadge = ({ similarity }: { similarity?: number }) => {
  if (!similarity) return null;
  
  const color =
    similarity >= 0.9
      ? 'bg-success/15 text-success border-success/20'
      : similarity >= 0.7
      ? 'bg-primary/15 text-primary border-primary/20'
      : similarity >= 0.5
      ? 'bg-warning/15 text-warning border-warning/20'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-mono border', color)}>
      {Math.round(similarity * 100)}%
    </span>
  );
};

const FolderItem = ({
  node,
  depth = 0,
  onSelect,
  selected,
}: {
  node: FolderNode;
  depth?: number;
  onSelect: (node: FolderNode) => void;
  selected?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder';
  const isSelected = selected === node.id;

  return (
    <div>
      <motion.button
        onClick={() => (isFolder ? setIsOpen(!isOpen) : onSelect(node))}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        whileHover={{ x: 2 }}
      >
        {isFolder ? (
          <>
            {isOpen ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
            <Folder size={14} className="text-accent" strokeWidth={1.5} />
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText size={14} strokeWidth={1.5} />
          </>
        )}
        <span className="flex-1 text-left truncate">{node.name}</span>
        <SimilarityBadge similarity={node.similarity} />
      </motion.button>

      {isFolder && isOpen && node.children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {node.children.map((child) => (
            <FolderItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

const NotePreview = ({ note }: { note: FolderNode | null }) => {
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" strokeWidth={1} />
          <p className="text-sm">Select a note to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-medium text-foreground">{note.name}</h3>
        <SimilarityBadge similarity={note.similarity} />
      </div>

      {note.tags && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted border border-border rounded-full text-xs text-muted-foreground"
            >
              <Hash size={9} strokeWidth={1.5} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 bg-muted/30 rounded-lg p-5 border border-border/50 overflow-auto">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            This is a preview of the note content. In production, this would display
            the actual Markdown content from your Obsidian vault with proper syntax
            highlighting and formatting.
          </p>
          <h2 className="text-foreground font-serif">Key Concepts</h2>
          <ul className="text-muted-foreground">
            <li>Vector embeddings for semantic search</li>
            <li>RAG pipeline architecture</li>
            <li>Local LLM inference with Ollama</li>
          </ul>
          <blockquote className="border-l-primary/50 italic">
            <p>
              "The key to effective RAG systems is finding the right balance between
              retrieval precision and response generation quality."
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

const RelatedNotesGraph = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="glass-card p-4"
  >
    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
      <Network size={11} strokeWidth={1.5} />
      Related Notes
    </h4>
    <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden border border-border/30">
      {/* Simplified graph visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Connections */}
          <line x1="100" y1="100" x2="60" y2="60" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="100" y1="100" x2="140" y2="50" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="100" y1="100" x2="150" y2="120" stroke="hsl(var(--accent))" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="100" y1="100" x2="50" y2="140" stroke="hsl(var(--accent))" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="100" y1="100" x2="120" y2="160" stroke="hsl(var(--warning))" strokeOpacity="0.4" strokeWidth="1" />

          {/* Center node */}
          <circle cx="100" cy="100" r="10" fill="hsl(var(--primary))" />

          {/* Related nodes */}
          <circle cx="60" cy="60" r="5" fill="hsl(var(--primary))" fillOpacity="0.7" />
          <circle cx="140" cy="50" r="7" fill="hsl(var(--primary))" fillOpacity="0.8" />
          <circle cx="150" cy="120" r="4" fill="hsl(var(--accent))" fillOpacity="0.6" />
          <circle cx="50" cy="140" r="6" fill="hsl(var(--accent))" fillOpacity="0.7" />
          <circle cx="120" cy="160" r="3" fill="hsl(var(--warning))" fillOpacity="0.5" />
        </svg>
      </div>
      <div className="z-10">
        <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
      </div>
    </div>
  </motion.div>
);

export function KnowledgeExplorer() {
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<FolderNode | null>(null);

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Folder Tree */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 border-r border-border flex flex-col bg-card/30"
      >
        <div className="h-14 px-4 flex items-center border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 h-9 bg-muted/50 border-transparent focus:border-primary text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          {mockFolderStructure.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FolderItem
                node={node}
                onSelect={setSelectedNote}
                selected={selectedNote?.id}
              />
            </motion.div>
          ))}
        </ScrollArea>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-14 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h1 className="font-serif font-medium text-foreground">Knowledge Explorer</h1>
          </div>
        </motion.div>

        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
          {/* Note Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 glass-panel p-6 flex flex-col"
          >
            <NotePreview note={selectedNote} />
          </motion.div>

          {/* Sidebar */}
          <div className="w-64 space-y-4">
            <RelatedNotesGraph />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4"
            >
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Similarity Legend
              </h4>
              <div className="space-y-2">
                {['High (90%+)', 'Medium (70-90%)', 'Low (50-70%)', 'Weak (<50%)'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-sm',
                        i === 0 ? 'bg-success' : i === 1 ? 'bg-primary' : i === 2 ? 'bg-warning' : 'bg-muted'
                      )}
                    />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
