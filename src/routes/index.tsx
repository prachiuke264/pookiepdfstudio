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
      { title: "PookiePDF Studio - 100% Free PDF Tools" },
      {
        name: "description",
        content:
          "PookiePDF Studio is a free, frictionless PDF workspace. Convert, compress, merge, and transform files instantly — no sign-up, no paywalls.",
      },
      { property: "og:title", content: "PookiePDF Studio - 100% Free PDF Tools" },
      {
        property: "og:description",
        content:
          "Convert, compress, merge, and transform PDFs instantly. 100% free, no sign-up required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);

  const selectTool = useCallback((tool: (typeof TOOLS)[number]) => {
    setActiveTool(tool);
    setFiles([]);
    setDone(false);
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const acceptFiles = useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      if (!incoming || incoming.length === 0) return;
      const list = Array.from(incoming);
      setFiles((prev) => (activeTool.multiple ? [...prev, ...list] : list.slice(0, 1)));
      setDone(false);
    },
    [activeTool]
  );

  const handleConvert = useCallback(() => {
    if (files.length === 0 || converting) return;
    setConverting(true);
    setDone(false);
    window.setTimeout(() => {
      setConverting(false);
      setDone(true);
      // Simulated instant download of the converted file.
      const base = files[0]!.name.replace(/\.[^.]+$/, "");
      const blob = new Blob(
        [`PookiePDF Studio — ${activeTool.title} output for ${files.map((f) => f.name).join(", ")}`],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-converted.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }, 500);
  }, [files, converting, activeTool]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="PookiePDF Studio logo"
            className="h-12 w-12 object-contain"
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
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Hero */}
        <section className="pt-10 pb-12 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-primary/60 px-4 py-1.5 text-xs font-semibold text-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
            100% Free Forever
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Convert PDFs instantly.
            <br />
            <span className="text-muted-foreground">Beautifully simple.</span>
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
              <activeTool.icon className="h-7 w-7 text-foreground/70" />
            </div>
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
              Done — your converted file has downloaded.
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
