import { create } from 'zustand';
import type { AppMode, KnowledgeSourceType, Document, SystemHealth } from '@/types';

interface AppState {
  // Navigation & Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Context Panel
  contextPanelOpen: boolean;
  toggleContextPanel: () => void;

  // Knowledge Sources
  activeKnowledgeSources: KnowledgeSourceType[];
  toggleKnowledgeSource: (source: KnowledgeSourceType) => void;

  // Documents
  documents: Document[];
  activeDocument: Document | null;
  setActiveDocument: (doc: Document | null) => void;
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;

  // System Health
  systemHealth: SystemHealth;
  setSystemHealth: (health: Partial<SystemHealth>) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Chat/Research Session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation & Mode
  mode: 'chat',
  setMode: (mode) => set({ mode }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Context Panel
  contextPanelOpen: true,
  toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),

  // Knowledge Sources
  activeKnowledgeSources: ['obsidian'],
  toggleKnowledgeSource: (source) => set((state) => ({
    activeKnowledgeSources: state.activeKnowledgeSources.includes(source)
      ? state.activeKnowledgeSources.filter((s) => s !== source)
      : [...state.activeKnowledgeSources, source],
  })),

  // Documents
  documents: [],
  activeDocument: null,
  setActiveDocument: (doc) => set({ activeDocument: doc }),
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
  })),

  // System Health
  systemHealth: {
    ollama: 'online',
    chromadb: 'online',
    obsidian: 'synced',
  },
  setSystemHealth: (health) => set((state) => ({
    systemHealth: { ...state.systemHealth, ...health },
  })),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Chat/Research Session
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
}));
