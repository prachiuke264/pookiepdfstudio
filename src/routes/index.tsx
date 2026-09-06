import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  FileText,
  FileDown,
  Minimize2,
  Files,
  Image,
  CloudUpload,
  X,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AeroPDF Studio — Free PDF Converter & Tools" },
      {
        name: "description",
        content:
          "AeroPDF Studio is a free, frictionless PDF workspace. Convert, compress, merge, and transform files instantly — no sign-up, no paywalls.",
      },
      { property: "og:title", content: "AeroPDF Studio — Free PDF Converter & Tools" },
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
    icon: FileText,
    title: "PDF to Word",
    desc: "Turn any PDF into an editable .docx document in seconds.",
    tag: "Popular",
  },
  {
    icon: Minimize2,
    title: "Compress PDF",
    desc: "Shrink file size up to 90% without visible quality loss.",
    tag: "Fast",
  },
  {
    icon: Files,
    title: "Merge PDF",
    desc: "Combine multiple PDFs into one clean, ordered document.",
    tag: "Easy",
  },
  {
    icon: Image,
    title: "Image to PDF",
    desc: "Convert JPG, PNG, and WebP images into polished PDFs.",
    tag: "New",
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AeroPDFStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setDone(false);
  }, []);

  const handleConvert = useCallback(() => {
    if (!file || converting) return;
    setConverting(true);
    setDone(false);
    window.setTimeout(() => {
      setConverting(false);
      setDone(true);
      // Simulated instant download of the converted file.
      const blob = new Blob([`AeroPDF Studio — converted output for ${file.name}`], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^.]+$/, "") + "-converted.pdf";
      a.click();
      URL.revokeObjectURL(url);
    }, 500);
  }, [file, converting]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
            <FileDown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">AeroPDF Studio</p>
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
            Drop a file, click once, done. No accounts, no email walls, no
            subscriptions — just fast, clean conversions.
          </p>
        </section>

        {/* Converter workspace */}
        <section
          aria-label="PDF converter"
          className="relative mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-20px_oklch(0.24_0.03_245/0.15)] sm:p-10"
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a file to convert"
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
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center backdrop-blur-md transition-all duration-200 ${
              dragging
                ? "border-primary bg-primary/40 scale-[1.01]"
                : "border-primary/70 bg-primary/15 hover:bg-primary/25"
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
              <CloudUpload className="h-7 w-7 text-foreground/70" />
            </div>
            <p className="text-lg font-semibold">
              Drag &amp; drop your file here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or <span className="font-medium underline underline-offset-2">browse your device</span> — PDF, DOCX, JPG, PNG up to 100&nbsp;MB
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>

          {/* File indicator */}
          {file && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-secondary-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)} · Ready to convert
                  </p>
                </div>
              </div>
              <button
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  setDone(false);
                }}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Action */}
          <button
            onClick={handleConvert}
            disabled={!file || converting}
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
                key={tool.title}
                onClick={() => inputRef.current?.click()}
                className="group rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:bg-primary/20 hover:shadow-md"
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
        AeroPDF Studio — free PDF tools, no strings attached.
      </footer>
    </div>
  );
}
