import { Sidebar } from '@/components/layout/Sidebar';
import { ContextPanel } from '@/components/layout/ContextPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DocumentAnalyzer } from '@/components/document/DocumentAnalyzer';
import { WebResearch } from '@/components/research/WebResearch';
import { KnowledgeExplorer } from '@/components/explorer/KnowledgeExplorer';
import { useAppStore } from '@/store/appStore';

const Index = () => {
  const { mode, contextPanelOpen } = useAppStore();

  const renderMainContent = () => {
    switch (mode) {
      case 'chat':
        return <ChatPanel />;
      case 'document':
        return <DocumentAnalyzer />;
      case 'research':
        return <WebResearch />;
      case 'explorer':
        return <KnowledgeExplorer />;
      default:
        return <ChatPanel />;
    }
  };

  const showContextPanel = mode === 'chat' && contextPanelOpen;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex overflow-hidden">
        {renderMainContent()}
      </main>

      {showContextPanel && <ContextPanel />}
    </div>
  );
};

export default Index;
