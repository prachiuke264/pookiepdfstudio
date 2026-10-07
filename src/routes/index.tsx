import { createFileRoute } from "@tanstack/react-router";
import { ConverterWorkspace } from "@/components/ConverterWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "PookiePDF Studio - 100% Free Online PDF Converter & PDF Editor",
      },
      {
        name: "description",
        content:
          "PookiePDF Studio is a 100% free online PDF workspace. Compress PDF, Merge PDF, and Convert PDF to Word instantly with zero sign-ups, no registration, and no hidden paywalls.",
      },
      {
        name: "keywords",
        content:
          "free PDF converter, PDF editor, compress PDF, merge PDF, PDF to Word, online PDF tools, free PDF tools, convert PDF, PDF compressor, image to PDF",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      {
        property: "og:title",
        content: "PookiePDF Studio - 100% Free Online PDF Converter & PDF Editor",
      },
      {
        property: "og:description",
        content:
          "PookiePDF Studio is a 100% free online PDF workspace. Compress PDF, Merge PDF, and Convert PDF to Word instantly with zero sign-ups, no registration, and no hidden paywalls.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://pookiepdfstudio.lovable.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://pookiepdfstudio.lovable.app" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "PookiePDF Studio",
          applicationCategory: "UtilityApplication",
          operatingSystem: "Web",
          url: "https://pookiepdfstudio.lovable.app",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "Compress PDF",
            "Merge PDF",
            "Convert PDF to Word",
            "Image to PDF",
          ],
        }),
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tool?: "image-to-pdf" } =>
    search.tool === "image-to-pdf" ? { tool: "image-to-pdf" } : {},
  component: HomePage,
});

function HomePage() {
  const { tool } = Route.useSearch();
  return <ConverterWorkspace key={tool ?? "pdf-to-word"} initialTool={tool ?? "pdf-to-word"} />;
}
