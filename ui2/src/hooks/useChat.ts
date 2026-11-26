import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import type { Message, ChatRequest, ChatResponse, SourceReference } from '@/types';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';

export function useChat() {
  const queryClient = useQueryClient();
  const { activeSessionId, setActiveSessionId } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch Chat History
  const { data: history } = useQuery({
    queryKey: ['chatHistory', activeSessionId],
    queryFn: () => activeSessionId ? api.getSessionHistory(activeSessionId) : Promise.resolve([]),
    enabled: !!activeSessionId,
  });

  // Sync history to local state when activeSessionId changes or history loads
  useEffect(() => {
    if (history) {
      // Check if history is different from current messages to avoid loops/resets while streaming
      // Simple check: if history has more messages, or if we just switched session
      // For now, simple sync: if not streaming, set messages.
      if (!isStreaming) {
        setMessages(history);
      }
    } else if (!activeSessionId && !isStreaming) {
      setMessages([]);
    }
  }, [history, activeSessionId, isStreaming]);

  const sendMessage = useMutation({
    mutationFn: async (request: ChatRequest) => {
      let currentSessionId = activeSessionId;

      // 1. Create Session if needed
      if (!currentSessionId) {
        const newSession = await api.createSession(request.message.slice(0, 30) + "...");
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        // Note: Setting state here won't update 'activeSessionId' in this closure immediately
      }

      // 2. Send Message
      const response = await api.ask(request.message, currentSessionId!);

      return {
        id: crypto.randomUUID(),
        content: response.answer,
        sources: [],
        sessionId: currentSessionId
      };
    },
    onMutate: async (request) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: request.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantPlaceholder: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);
    },
    onSuccess: (response: any) => { // Type 'any' because we added sessionId to return
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: response.content,
          sources: response.sources,
          isStreaming: false,
        };
        return updated;
      });
      setIsStreaming(false);

      // Invalidate queries to refresh sidebar lists and history
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatHistory', response.sessionId] });
    },
    onError: () => {
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        updated.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Sorry, I encountered an error communicating with the server.",
          timestamp: new Date(),
          isStreaming: false
        });
        return updated;
      });
      setIsStreaming(false);
    },
  });

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
  }, [setActiveSessionId]);

  return {
    messages,
    isStreaming,
    sendMessage: sendMessage.mutate,
    isPending: sendMessage.isPending,
    clearMessages,
  };
}
