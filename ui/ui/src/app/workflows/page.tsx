import Chat from "../../components/Chat";
import Layout from "../../components/Layout";

export default function WorkflowsPage() {
  return (
    <Layout>
      <Chat 
        mode="workflows"
        title="Workflows"
        placeholder="What workflow would you like help with?"
        initialMessage="I can help you create step-by-step workflows based on your notes."
      />
    </Layout>
  );
} 