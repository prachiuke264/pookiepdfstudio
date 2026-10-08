import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/pdf-to-word")({
  head: () => toolHead("/pdf-to-word", "Free PDF to Word Converter Online - 100% Free | PookiePDF Studio", "Convert PDF files into fully editable Microsoft Word documents instantly. No sign-up required, no catch."),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="pdf-to-word" initialTool="pdf-to-word" dedicated />;
}
