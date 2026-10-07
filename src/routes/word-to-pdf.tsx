import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/word-to-pdf")({
  head: () => toolHead("/word-to-pdf", "Word to PDF Converter", "Convert Word DOCX documents to PDF online"),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="word-to-pdf" initialTool="word-to-pdf" dedicated />;
}
