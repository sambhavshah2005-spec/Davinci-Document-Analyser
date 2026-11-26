import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask - Davinci",
  description: "Ask questions about your personal notes and get instant AI-powered answers",
};

export default function AskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 