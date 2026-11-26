import Chat from "../../components/Chat";
import Layout from "../../components/Layout";

export default function AnalyzerPage() {
  return (
    <Layout>
      <Chat 
        mode="analyzer"
        title="Analyzer"
        placeholder="Ask questions about your uploaded document..."
        initialMessage="Upload a PDF or Word document to get started. I'll analyze it and answer your questions."
      />
    </Layout>
  );
}

