import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/pdf-to-word")({
  head: () => toolHead("/pdf-to-word", "PDF to Word Converter", "Convert selectable PDF text to editable Word documents"),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="pdf-to-word" initialTool="pdf-to-word" dedicated />;
}
