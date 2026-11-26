import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Plus, Clock, Trash2, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

export function ContextPanel() {
  const { contextPanelOpen, toggleContextPanel, activeSessionId, setActiveSessionId } = useAppStore();
  const queryClient = useQueryClient();

  // Fetch Sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
  });

  const createSession = useMutation({
    mutationFn: (title: string) => api.createSession(title),
    onSuccess: (newSession) => {
      setActiveSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const deleteSession = useMutation({
    mutationFn: api.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      // If deleted active session, clear it
      // Logic is tricky if we don't have the ID here, but we can do it in the button handler
    }
  });

  const handleNewChat = () => {
    createSession.mutate('New Chat');
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this chat?")) {
      deleteSession.mutate(sessionId);
      if (activeSessionId === sessionId) setActiveSessionId(null);
    }
  };

  return (
    <AnimatePresence>
      {contextPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-screen bg-card/60 backdrop-blur-xl border-l border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-14 px-5 flex items-center justify-between border-b border-border"
          >
            <div className="flex items-center gap-2">
              <History size={15} className="text-primary" strokeWidth={1.5} />
              <h2 className="font-serif font-medium text-foreground">History</h2>
            </div>
            <motion.button
              onClick={toggleContextPanel}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={16} strokeWidth={1.5} />
            </motion.button>
          </motion.div>

          {/* Action Bar */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full gap-2 justify-start border-dashed border-primary/20 hover:border-primary/40 text-muted-foreground hover:text-primary"
              onClick={handleNewChat}
            >
              <Plus size={14} />
              New Chat
            </Button>
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1 px-4 pb-4">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {sessions?.map((session: any, index: number) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "group p-3 rounded-lg border cursor-pointer transition-all duration-200 relative",
                    activeSessionId === session.id
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-card border-border/50 hover:bg-accent/5 hover:border-accent/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-sm font-medium mb-1 truncate",
                        activeSessionId === session.id ? "text-primary" : "text-foreground"
                      )}>
                        {session.title || "Untitled Chat"}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={10} />
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {sessions?.length === 0 && (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No recent chats
                </div>
              )}
            </motion.div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
