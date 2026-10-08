import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";
import { toolHead } from "@/lib/tool-seo";

export const Route = createFileRoute("/image-to-pdf")({
  head: () => toolHead("/image-to-pdf", "Convert Image to PDF Free - JPG, PNG to PDF | PookiePDF Studio", "Transform JPG, PNG, and WebP images into polished PDF files instantly. Fast and borderless web conversion."),
  component: ToolPage,
});

function ToolPage() {
  return <ConverterWorkspace key="image-to-pdf" initialTool="image-to-pdf" dedicated />;
}
