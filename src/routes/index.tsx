import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  FileText,
  FileDown,
  Minimize2,
  Files,
  Image,
  X,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import logoAsset from "../assets/aeropdf-logo.png.asset.json";
import {
  compressPdf,
  downloadBytes,
  imagesToPdf,
  mergePdfs,
  normalizePdf,
  pdfToText,
  textToRtfBytes,
  type CompressionLevel,
} from "@/lib/pdf-tools";

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
  component: AeroPDFStudio,
});

const TOOLS = [
  {
    id: "pdf-to-word",
    icon: FileText,
    title: "PDF to Word",
    desc: "Turn any PDF into an editable .docx document in seconds.",
    tag: "Popular",
    workspaceTitle: "PDF to Word Converter",
    workspaceDesc: "Upload a PDF and get a fully editable Word document back.",
    dropText: "Drag & drop your PDF here",
    dropHint: "PDF files up to 100 MB",
    accept: ".pdf",
    multiple: false,
  },
  {
    id: "compress-pdf",
    icon: Minimize2,
    title: "Compress PDF",
    desc: "Shrink file size up to 90% without visible quality loss.",
    tag: "Fast",
    workspaceTitle: "Compress PDF",
    workspaceDesc: "Upload a PDF and we'll shrink it while keeping it crisp.",
    dropText: "Drag & drop the PDF to compress",
    dropHint: "PDF files up to 100 MB",
    accept: ".pdf",
    multiple: false,
  },
  {
    id: "merge-pdf",
    icon: Files,
    title: "Merge PDF",
    desc: "Combine multiple PDFs into one clean, ordered document.",
    tag: "Easy",
    workspaceTitle: "Merge PDF Tools — Upload Multiple Files",
    workspaceDesc: "Drop two or more PDFs and we'll combine them into one file.",
    dropText: "Drag & drop multiple PDFs here",
    dropHint: "Select several PDF files at once",
    accept: ".pdf",
    multiple: true,
  },
  {
    id: "image-to-pdf",
    icon: Image,
    title: "Image to PDF",
    desc: "Convert JPG, PNG, and WebP images into polished PDFs.",
    tag: "New",
    workspaceTitle: "Image to PDF Converter",
    workspaceDesc: "Upload images and turn them into a clean, shareable PDF.",
    dropText: "Drag & drop your images here",
    dropHint: "JPG, PNG, or WebP — multiple allowed",
    accept: ".jpg,.jpeg,.png,.webp",
    multiple: true,
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AeroPDFStudio() {
  const [activeTool, setActiveTool] = useState<(typeof TOOLS)[number]>(TOOLS[0]!);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);

  const selectTool = useCallback((tool: (typeof TOOLS)[number]) => {
    setActiveTool(tool);
    setFiles([]);
    setDone(false);
    setError(null);
    setResult(null);
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const acceptFiles = useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      if (!incoming || incoming.length === 0) return;
      const list = Array.from(incoming);
      setFiles((prev) => (activeTool.multiple ? [...prev, ...list] : list.slice(0, 1)));
      if (activeTool.id === "compress-pdf" && list[0]) {
        const halfSize = list[0].size / 2;
        if (halfSize >= 1024 * 1024) {
          setTargetUnit("MB");
          setTargetSize((halfSize / (1024 * 1024)).toFixed(2));
        } else {
          setTargetUnit("KB");
          setTargetSize(Math.max(1, Math.round(halfSize / 1024)).toString());
        }
      }
      setDone(false);
      setError(null);
      setResult(null);
    },
    [activeTool]
  );

  const handleConvert = useCallback(async () => {
    if (files.length === 0 || converting) return;
    setConverting(true);
    setDone(false);
    setError(null);
    setResult(null);
    const base = files[0]!.name.replace(/\.[^.]+$/, "");
    try {
      if (activeTool.id === "compress-pdf") {
        const before = files[0]!.size;
        const numericTarget = Number(targetSize);
        const targetBytes = Math.round(
          numericTarget * (targetUnit === "MB" ? 1024 * 1024 : 1024)
        );
        if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
          throw new Error("Invalid target size");
        }
        const bytes = await compressPdf(files[0]!, level, targetBytes);
        downloadBytes(bytes, `${base}-compressed.pdf`, "application/pdf");
        setResult({ before, after: bytes.byteLength });
      } else if (activeTool.id === "merge-pdf") {
        const bytes = await mergePdfs(files);
        downloadBytes(bytes, `merged.pdf`, "application/pdf");
      } else if (activeTool.id === "image-to-pdf") {
        const bytes = await imagesToPdf(files);
        downloadBytes(bytes, `${base}.pdf`, "application/pdf");
      } else {
        const text = await pdfToText(files[0]!);
        downloadBytes(
          textToRtfBytes(text || "(No selectable text found in this PDF.)"),
          `${base}.doc`,
          "application/msword"
        );
        await normalizePdf(files[0]!);
      }
      setDone(true);
    } catch {
      setError(
        "We couldn't process that file — it may be password-protected or damaged."
      );
    } finally {
      setConverting(false);
    }
  }, [files, converting, activeTool, level, targetSize, targetUnit]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient floating orbs */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-[-10rem] top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[#BCD4EE] opacity-25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[-14rem] right-[-12rem] h-[42rem] w-[42rem] rounded-full bg-[#F3DEDE] opacity-25 blur-[120px]"
      />
      {/* Minimalist dot-matrix mesh */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.03] [background-image:radial-gradient(#2C2524_1px,transparent_1px)] [background-size:22px_22px]"
      />

      {/* 3D claymorphism ambient accent tokens */}
      <div
        aria-hidden
        className="clay-float-a pointer-events-none fixed left-[8%] top-[22%] h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_25%,#FFEFF0,#F3DEDE_60%,#E9C9C9)] opacity-80 [filter:drop-shadow(4px_6px_8px_rgba(0,0,0,0.06))]"
      />
      <div
        aria-hidden
        className="clay-float-b pointer-events-none fixed right-[12%] top-[34%] h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_25%,#FFEFF0,#F3DEDE_60%,#E9C9C9)] opacity-75 [filter:drop-shadow(4px_6px_8px_rgba(0,0,0,0.06))]"
      />
      <div
        aria-hidden
        className="clay-float-c pointer-events-none fixed left-[18%] bottom-[16%] h-9 w-16 rounded-[2rem] bg-[linear-gradient(180deg,#FCF3E6,#F0E2CB_55%,#E2D2B5)] opacity-80 [filter:drop-shadow(4px_6px_8px_rgba(0,0,0,0.06))]"
      />
      <div
        aria-hidden
        className="clay-float-a pointer-events-none fixed right-[20%] bottom-[24%] h-7 w-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#FFEFF0,#F3DEDE_60%,#E9C9C9)] opacity-70 [filter:drop-shadow(4px_6px_8px_rgba(0,0,0,0.06))]"
      />
      <div
        aria-hidden
        className="clay-float-b pointer-events-none fixed left-[44%] top-[12%] h-6 w-12 rounded-[1.5rem] bg-[linear-gradient(180deg,#FCF3E6,#F0E2CB_55%,#E2D2B5)] opacity-75 [filter:drop-shadow(4px_6px_8px_rgba(0,0,0,0.06))]"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#BCD4EE]/40 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="PookiePDF Studio logo"
            className="h-12 w-12 object-contain [filter:drop-shadow(0px_8px_24px_rgba(243,222,222,0.95))]"
          />
          <div>
            <p className="text-lg font-bold tracking-tight">PookiePDF Studio</p>
            <p className="text-xs text-muted-foreground">Free PDF Workspace</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground sm:flex">
          <Lock className="h-3.5 w-3.5" />
          No sign-up · No paywall
        </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {/* Hero */}
        <section className="pt-10 pb-12 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-primary/60 px-4 py-1.5 text-xs font-semibold text-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
            100% Free Forever
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Free Online PDF Tools
            <br />
            <span className="text-muted-foreground">Convert PDFs instantly. Beautifully simple.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            No sign-up · No paywall · 100% Free Forever
          </p>
        </section>

        {/* Converter workspace */}
        <section
          ref={workspaceRef}
          aria-label="PDF converter"
          className="relative mx-auto max-w-3xl scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-20px_oklch(0.24_0.03_245/0.15)] sm:p-10"
        >
          <div key={activeTool.id} className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {activeTool.workspaceTitle}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {activeTool.workspaceDesc}
            </p>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label={`Upload files for ${activeTool.title}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center backdrop-blur-md transition-all duration-200 ${
              dragging
                ? "border-primary bg-primary/40 scale-[1.01]"
                : "border-primary/70 bg-primary/15 hover:bg-primary/25"
            }`}
          >
            <img
              src={logoAsset.url}
              alt="PookiePDF document with pink bow"
              className="mb-5 h-20 w-20 object-contain drop-shadow-sm sm:h-24 sm:w-24"
            />
            <p className="text-lg font-semibold">{activeTool.dropText}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              or <span className="font-medium underline underline-offset-2">browse your device</span> — {activeTool.dropHint}
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={activeTool.accept}
              multiple={activeTool.multiple}
              onChange={(e) => {
                acceptFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* File indicators */}
          {files.length > 0 && (
            <div className="mt-5 space-y-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-secondary-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(f.size)} · Ready to convert
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, j) => j !== i));
                      setDone(false);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Compression controls */}
          {activeTool.id === "compress-pdf" && (
            <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-5">
              <p className="text-sm font-bold text-[#2C2524]">Compression level</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: "low", label: "Low", hint: "High quality" },
                    { id: "medium", label: "Medium", hint: "Recommended" },
                    { id: "high", label: "High", hint: "Smallest size" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLevel(opt.id)}
                    aria-pressed={level === opt.id}
                    className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                      level === opt.id
                        ? "border-primary bg-primary/40"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span className="block text-sm font-bold text-[#2C2524]">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {opt.hint}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="target-file-size"
                  className="text-sm font-bold text-[#2C2524]"
                >
                  Target File Size
                </label>
                <div className="mt-2 flex min-w-0 items-stretch rounded-xl border border-border bg-card p-1 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                  <input
                    id="target-file-size"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step={targetUnit === "MB" ? "0.01" : "1"}
                    value={targetSize}
                    onChange={(e) => setTargetSize(e.target.value)}
                    aria-describedby="target-file-size-hint"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-lg font-extrabold text-[#2C2524] outline-none"
                  />
                  <div className="grid shrink-0 grid-cols-2 rounded-lg bg-secondary p-1" aria-label="File size unit">
                    {(["KB", "MB"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setTargetUnit(unit)}
                        aria-pressed={targetUnit === unit}
                        className={`min-w-12 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                          targetUnit === unit
                            ? "bg-card text-[#2C2524] shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
                <p id="target-file-size-hint" className="mt-2 text-xs text-muted-foreground">
                  Enter the final size you need. Actual output may vary slightly by document.
                </p>
              </div>
            </div>
          )}

          {/* Action */}
          <button
            onClick={handleConvert}
            disabled={files.length === 0 || converting}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-[0_0_35px_-5px_oklch(0.82_0.05_235/0.9)] transition-all duration-200 hover:shadow-[0_0_45px_-5px_oklch(0.82_0.05_235)] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {converting ? "Converting…" : "⚡ Convert Instantly (100% Free)"}
          </button>

          {done && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground/80">
              <ShieldCheck className="h-4 w-4" />
              {result
                ? `Done — ${formatSize(result.before)} → ${formatSize(result.after)} (${Math.max(
                    0,
                    Math.round((1 - result.after / result.before) * 100)
                  )}% smaller). Your PDF has downloaded.`
                : "Done — your converted file has downloaded."}
            </p>
          )}

          {error && (
            <p className="mt-4 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </section>

        {/* Trust strip */}
        <section className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Files never stored
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Instant processing
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> No email required
          </span>
        </section>

        {/* Tool grid */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            More free tools
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Every tool is unlocked. No trials, no credit cards.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => selectTool(tool)}
                aria-pressed={activeTool.id === tool.id}
                className={`group rounded-2xl border p-6 text-left shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 ${
                  activeTool.id === tool.id
                    ? "border-primary bg-primary/25"
                    : "border-border bg-card hover:border-primary hover:bg-primary/20"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-card">
                    <tool.icon className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    {tool.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold">{tool.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {tool.desc}
                </p>
              </button>
            ))}
          </div>
        </section>
        {/* SEO feature highlights */}
        <section
          aria-label="PDF tool highlights"
          className="mt-20 grid gap-8 sm:grid-cols-3"
        >
          <div>
            <h2 className="text-xl font-bold tracking-tight">Merge PDF Files Free</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Combine multiple PDFs into one clean, ordered document in seconds — completely free, with no sign-up or registration.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Compress PDF Size</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Shrink PDF file size up to 90% without visible quality loss. Pick Low, Medium, or High compression and download instantly.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Convert PDF to Word</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Turn any PDF into an editable Word document instantly. Extract selectable text and keep your workflow moving.
            </p>
          </div>
        </section>
      </main>

      {/* Loader overlay */}
      {converting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-10 py-8 shadow-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-foreground" />
            <p className="text-sm font-semibold">Converting your file…</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        PookiePDF Studio — free PDF tools, no strings attached.
      </footer>
    </div>
  );
}
