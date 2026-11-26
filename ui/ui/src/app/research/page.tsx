import Chat from "../../components/Chat";
import Layout from "../../components/Layout";

export default function ResearchPage() {
  return (
    <Layout>
      <Chat 
        mode="research"
        title="Research"
        placeholder="What would you like to research in your notes?"
        initialMessage="I'm ready to help you research and analyze information from your notes."
      />
    </Layout>
  );
} 