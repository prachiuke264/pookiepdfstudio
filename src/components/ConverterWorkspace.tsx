import { Link, useNavigate } from "@tanstack/react-router";
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
import { PinkBubbleCanvas } from "@/components/PinkBubbleCanvas";
import { PookieDoll } from "@/components/PookieDoll";
import {
  compressPdf,
  downloadBytes,
  imagesToPdf,
  mergePdfs,
  type CompressionLevel,
} from "@/lib/pdf-tools";

import { pdfToWord, wordToPdf } from "@/lib/word-tools";
import { Button } from "@/components/ui/button";

export const TOOLS = [
  {
    id: "pdf-to-word",
    icon: FileText,
    title: "PDF to Word",
    desc: "Turn selectable PDF text into an editable .docx document.",
    tag: "Popular",
    workspaceTitle: "PDF to Word Converter",
    workspaceDesc: "Extract selectable PDF text into an editable Word document. Scanned PDFs require OCR.",
    dropText: "Drag & drop your PDF here",
    dropHint: "PDF files up to 100 MB",
    accept: ".pdf",
    multiple: false,
  },
  {
    id: "word-to-pdf",
    icon: FileDown,
    title: "Word to PDF",
    desc: "Convert Word documents into shareable PDFs.",
    tag: "Free",
    workspaceTitle: "Word to PDF Converter",
    workspaceDesc: "Upload a DOCX document and download a PDF. Complex layouts may differ.",
    dropText: "Drag & drop your Word document here",
    dropHint: "Word .docx files up to 100 MB",
    accept: ".docx",
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
] as const;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ToolId = (typeof TOOLS)[number]["id"];
const ROUTE_PATHS = {
  "pdf-to-word": "/pdf-to-word",
  "word-to-pdf": "/word-to-pdf",
  "merge-pdf": "/merge-pdf",
  "compress-pdf": "/compress-pdf",
} as const;

export function ConverterWorkspace({ initialTool = "pdf-to-word", dedicated = false }: { initialTool?: ToolId; dedicated?: boolean }) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<(typeof TOOLS)[number]>(() => TOOLS.find((tool) => tool.id === initialTool) ?? TOOLS[0]);
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
    if (tool.id !== "image-to-pdf") {
      void navigate({ to: ROUTE_PATHS[tool.id] });
      return;
    }
    if (dedicated) {
      void navigate({ to: "/", search: { tool: "image-to-pdf" } });
      return;
    }
    setActiveTool(tool);
    setFiles([]);
    setDone(false);
    setError(null);
    setResult(null);
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [navigate, dedicated]);

  const acceptFiles = useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      if (!incoming || incoming.length === 0) return;
      const list = Array.from(incoming);
      const allowed = activeTool.accept.split(",");
      if (list.some((file) => !allowed.some((extension) => file.name.toLowerCase().endsWith(extension)))) {
        setError(`Please upload ${activeTool.accept} files for ${activeTool.title}.`);
        return;
      }
      if (list.some((file) => file.size > 100 * 1024 * 1024)) {
        setError("Please choose files smaller than 100 MB each.");
        return;
      }
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
    const firstFile = files[0];
    if (!firstFile || converting) return;
    if (activeTool.id === "merge-pdf" && files.length < 2) {
      setError("Please upload at least two PDFs to merge.");
      return;
    }
    setConverting(true);
    setDone(false);
    setError(null);
    setResult(null);
    const base = firstFile.name.replace(/\.[^.]+$/, "");
    try {
      if (activeTool.id === "compress-pdf") {
        const before = firstFile.size;
        const numericTarget = Number(targetSize);
        const targetBytes = Math.round(
          numericTarget * (targetUnit === "MB" ? 1024 * 1024 : 1024)
        );
        if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
          throw new Error("Invalid target size");
        }
        const bytes = await compressPdf(firstFile, level, targetBytes);
        downloadBytes(bytes, `${base}-compressed.pdf`, "application/pdf");
        setResult({ before, after: bytes.byteLength });
      } else if (activeTool.id === "merge-pdf") {
        const bytes = await mergePdfs(files);
        downloadBytes(bytes, `merged.pdf`, "application/pdf");
      } else if (activeTool.id === "image-to-pdf") {
        const bytes = await imagesToPdf(files);
        downloadBytes(bytes, `${base}.pdf`, "application/pdf");
      } else if (activeTool.id === "word-to-pdf") {
        downloadBytes(await wordToPdf(firstFile), `${base}.pdf`, "application/pdf");
      } else {
        downloadBytes(await pdfToWord(firstFile), `${base}.docx`,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      }
      setDone(true);
      window.dispatchEvent(new Event("pookie:conversion-complete"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't process that file — it may be password-protected or damaged.");
    } finally {
      setConverting(false);
    }
  }, [files, converting, activeTool, level, targetSize, targetUnit]);

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      {/* Minimalist dot-matrix mesh */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] [background-image:radial-gradient(#2C2524_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <PinkBubbleCanvas />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#BCD4EE]/40 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PookiePDF Studio logo"
            className="h-12 w-12 object-contain [filter:drop-shadow(0px_8px_24px_rgba(247,177,193,0.9))]"
          />
          <div>
            <p className="text-lg font-bold tracking-tight">PookiePDF Studio</p>
            <p className="text-xs text-muted-foreground">Free PDF Workspace</p>
          </div>
        </Link>
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
            {dedicated ? activeTool.title + (activeTool.id === "compress-pdf" || activeTool.id === "merge-pdf" ? " Online" : " Converter") : "Free Online PDF Tools"}
            {!dedicated && <><br /><span className="text-muted-foreground">Convert PDFs instantly. Beautifully simple.</span></>}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            No sign-up · No paywall · 100% Free Forever
          </p>
        </section>

        {/* Converter workspace */}
        <section
          ref={workspaceRef}
          aria-label="PDF converter"
          className="relative mx-auto mt-32 max-w-3xl scroll-mt-48 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-20px_oklch(0.24_0.03_245/0.15)] sm:mt-44 sm:p-10"
        >
          <PookieDoll toolId={activeTool.id} anchored={dedicated} />
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
            data-pookie-upload
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
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center backdrop-blur-md transition-all duration-200 ${
              dragging
                ? "border-primary bg-primary/40 scale-[1.01]"
                : "border-primary/70 bg-primary/15 hover:bg-primary/25"
            }`}
          >
            <img
              src="/document-bow.png"
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
                  <Button variant="workspace" size="workspace"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, j) => j !== i));
                      setDone(false);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                  <Button variant="workspace" size="workspace"
                    key={opt.id}
                    onClick={() => setLevel(opt.id)}
                    aria-pressed={level === opt.id}
                    className={`block rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
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
                  </Button>
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
                      <Button variant="workspace" size="workspace"
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
                      </Button>
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
          <Button variant="workspace" size="workspace"
            onClick={handleConvert}
            disabled={files.length === 0 || converting}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-[0_0_35px_-5px_oklch(0.82_0.05_235/0.9)] transition-all duration-200 hover:shadow-[0_0_45px_-5px_oklch(0.82_0.05_235)] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {converting ? "Converting…" : "⚡ Convert Instantly (100% Free)"}
          </Button>

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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.id}
                to={tool.id === "image-to-pdf" ? "/" : ROUTE_PATHS[tool.id]}
                search={tool.id === "image-to-pdf" ? { tool: "image-to-pdf" } : {}}
                onClick={tool.id === "image-to-pdf" && !dedicated ? (event) => { event.preventDefault(); selectTool(tool); } : undefined}
                aria-current={activeTool.id === tool.id ? "page" : undefined}
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
              </Link>
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
      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
        PookiePDF Studio — free PDF tools, no strings attached.
      </footer>
    </div>
  );
}
