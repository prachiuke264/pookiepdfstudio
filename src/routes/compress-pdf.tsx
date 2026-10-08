import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/compress-pdf")({
  head: () => toolHead("/compress-pdf", "Compress PDF Size Online - Reduce PDF File Size | PookiePDF Studio", "Shrink massive PDF files up to 90% without visible quality loss. Free, fast cloud optimization tool."),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="compress-pdf" initialTool="compress-pdf" dedicated />;
}
