import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ResearchTask, ResearchStartRequest, ResearchDepth, WebSource } from '@/types';

// Mock research task
const mockStartResearch = async (request: ResearchStartRequest): Promise<ResearchTask> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    id: crypto.randomUUID(),
    topic: request.topic,
    depth: request.depth,
    status: 'crawling',
    progress: 0,
    sources: [],
    createdAt: new Date(),
  };
};

const mockGetResearchStatus = async (taskId: string): Promise<ResearchTask> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const mockSources: WebSource[] = [
    {
      id: '1',
      url: 'https://arxiv.org/papers/ai-research',
      title: 'Recent Advances in AI Research',
      domain: 'arxiv.org',
      credibilityScore: 0.95,
      snippet: 'This paper presents a comprehensive overview of recent advances in artificial intelligence...',
      crawledAt: new Date(),
    },
    {
      id: '2',
      url: 'https://blog.openai.com/research-updates',
      title: 'OpenAI Research Updates',
      domain: 'openai.com',
      credibilityScore: 0.92,
      snippet: 'Our latest research focuses on improving the safety and capabilities of AI systems...',
      crawledAt: new Date(),
    },
    {
      id: '3',
      url: 'https://deepmind.com/blog/article/alphafold',
      title: 'AlphaFold: AI for Protein Structure',
      domain: 'deepmind.com',
      credibilityScore: 0.94,
      snippet: 'AlphaFold represents a significant breakthrough in computational biology...',
      crawledAt: new Date(),
    },
  ];

  return {
    id: taskId,
    topic: 'AI Research',
    depth: 'deep',
    status: 'complete',
    progress: 100,
    sources: mockSources,
    summary: 'Based on comprehensive web research, the current landscape of AI research shows significant advances in large language models, multimodal understanding, and AI safety. Key players including OpenAI, DeepMind, and academic institutions continue to push boundaries in both capabilities and responsible development.',
    createdAt: new Date(),
  };
};

export function useResearch() {
  const [activeTask, setActiveTask] = useState<ResearchTask | null>(null);

  const startResearch = useMutation({
    mutationFn: mockStartResearch,
    onSuccess: (task) => {
      setActiveTask(task);
    },
  });

  const { data: taskStatus, isLoading: isPolling } = useQuery({
    queryKey: ['research-status', activeTask?.id],
    queryFn: () => mockGetResearchStatus(activeTask!.id),
    enabled: !!activeTask && activeTask.status !== 'complete',
    refetchInterval: 2000,
  });

  return {
    activeTask: taskStatus || activeTask,
    startResearch: startResearch.mutate,
    isStarting: startResearch.isPending,
    isPolling,
    clearTask: () => setActiveTask(null),
  };
}
