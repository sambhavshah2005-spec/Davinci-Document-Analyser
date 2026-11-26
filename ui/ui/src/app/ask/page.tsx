import Chat from "../../components/Chat";
import Layout from "../../components/Layout";

export default function AskPage() {
  return (
    <Layout>
      <Chat 
        mode="ask"
        title="Ask"
        placeholder="Ask me anything about your notes..."
        initialMessage="Hi! Ask me anything about your notes."
      />
    </Layout>
  );
} 