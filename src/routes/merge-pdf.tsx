import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/merge-pdf")({
  head: () => toolHead("/merge-pdf", "PDF Merge Utility", "Merge multiple PDF files into one ordered document"),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="merge-pdf" initialTool="merge-pdf" dedicated />;
}
