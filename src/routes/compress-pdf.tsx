import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/compress-pdf")({
  head: () => toolHead("/compress-pdf", "PDF Size Reducer", "Compress PDF files with adjustable quality and target size"),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="compress-pdf" initialTool="compress-pdf" dedicated />;
}
