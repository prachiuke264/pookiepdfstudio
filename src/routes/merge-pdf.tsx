import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/merge-pdf")({
  head: () => toolHead("/merge-pdf", "Merge PDF Files Free - Combine PDFs Online | PookiePDF Studio", "Combine multiple PDF files into one clean, ordered document in seconds. Completely free with no paywalls."),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="merge-pdf" initialTool="merge-pdf" dedicated />;
}
