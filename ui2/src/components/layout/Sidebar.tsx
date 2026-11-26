import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Globe,
  Compass,
  Settings,
  FolderOpen,
  History,
  Activity,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import type { AppMode, SyncStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useDocuments } from '@/hooks/useDocuments';

interface NavItem {
  id: AppMode;
  label: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { id: 'chat', label: 'Research Chat', icon: MessageSquare },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'research', label: 'Web Research', icon: Globe },
  { id: 'explorer', label: 'Knowledge Base', icon: Compass },
];

const StatusIndicator = ({ status }: { status: SyncStatus }) => {
  const statusStyles = {
    synced: 'status-dot-success',
    indexing: 'status-dot-warning animate-pulse',
    error: 'status-dot-error',
    disconnected: 'bg-muted-foreground/50',
  };

  const statusLabels = {
    synced: 'Connected',
    indexing: 'Indexing...',
    error: 'Error',
    disconnected: 'Offline',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('status-dot', statusStyles[status])} />
      <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
    </div>
  );
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export function Sidebar() {
  const { mode, setMode, sidebarCollapsed, toggleSidebar, systemHealth, documents, setDocuments } = useAppStore();

  const { fetchDocumentsFn } = useDocuments();
  const { data: fetchedDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocumentsFn,
  });

  // Sync fetched documents to store so we can combine with optimistic updates
  useEffect(() => {
    if (fetchedDocuments) {
      setDocuments(fetchedDocuments);
    }
  }, [fetchedDocuments, setDocuments]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center glow-primary">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-serif font-semibold text-foreground text-lg tracking-tight">ResearchAI</span>
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Personal Assistant</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.button>
      </div>

      {/* Main Navigation */}
      <motion.nav
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex-1 p-3 space-y-1"
      >
        {mainNavItems.map((item) => (
          <motion.button
            key={item.id}
            variants={staggerItem}
            onClick={() => setMode(item.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              mode === item.id
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent'
            )}
          >
            <item.icon size={18} strokeWidth={mode === item.id ? 2 : 1.5} />
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </motion.nav>

      {/* Knowledge Sources */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-3 pb-3"
          >
            <div className="glass-card p-4 space-y-4">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Sources
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FolderOpen size={14} className="text-primary" />
                    <span className="text-foreground/80">Obsidian Vault</span>
                  </div>
                  <StatusIndicator status={systemHealth.obsidian} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-accent" />
                    <span className="text-foreground/80">Documents</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{documents?.length || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <History size={14} className="text-muted-foreground" />
                    <span className="text-foreground/80">Web Sources</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">12</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Health */}
      <div className="p-3 border-t border-sidebar-border">
        <AnimatePresence mode="wait">
          {sidebarCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <Activity
                size={16}
                className={cn(
                  systemHealth.ollama === 'online' && systemHealth.chromadb === 'online'
                    ? 'text-success'
                    : 'text-warning'
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">System</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">Ollama</span>
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    systemHealth.ollama === 'online' ? 'bg-success' : 'bg-destructive'
                  )}
                />
                <span className="text-[10px] text-muted-foreground font-mono">Chroma</span>
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    systemHealth.chromadb === 'online' ? 'bg-success' : 'bg-destructive'
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <motion.button
          whileHover={{ x: 4 }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings size={18} strokeWidth={1.5} />
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
