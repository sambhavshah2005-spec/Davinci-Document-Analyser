import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research - Davinci",
  description: "Comprehensive research and analysis of your personal notes using AI",
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 