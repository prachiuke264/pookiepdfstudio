import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/word-to-pdf")({
  head: () => toolHead("/word-to-pdf", "Convert Word to PDF Online Free - Quick & Secure | PookiePDF Studio", "Convert your docx and Word files into professional, shareable PDFs in one click. Fully secure, no email required."),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="word-to-pdf" initialTool="word-to-pdf" dedicated />;
}
