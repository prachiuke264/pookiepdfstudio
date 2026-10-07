const BASE_URL = "https://pookiepdfstudio.lovable.app";

export function toolHead(path: string, name: string, action: string) {
  const title = `${name} - 100% Free Online | PookiePDF Studio`;
  const description = `${action} with PookiePDF Studio. No signup, no ads, completely unlimited file conversion. Free online tools with files processed on your device.`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: BASE_URL + path },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: BASE_URL + path }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@type": "WebApplication", name,
      url: BASE_URL + path, applicationCategory: "UtilityApplication", operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    }) }],
  };
}