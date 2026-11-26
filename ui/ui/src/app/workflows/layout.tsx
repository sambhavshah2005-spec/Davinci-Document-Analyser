import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflows - Davinci",
  description: "Create step-by-step workflows and actionable processes from your notes",
};

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 