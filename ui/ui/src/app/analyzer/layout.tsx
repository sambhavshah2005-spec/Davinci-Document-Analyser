import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyzer - Davinci",
  description: "Upload documents and get AI-powered answers based on their content",
};

export default function AnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

