"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Maximize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { toast } from "sonner";
import {
  downloadMindMapJson,
  downloadMindMapMarkdown,
  downloadMindMapPng,
  downloadMindMapSvg,
  downloadMindMapTxt,
  type AiMindMap,
} from "@/lib/media/mindmap";

const transformer = new Transformer();

const btnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50";

export default function MindMapPanel({
  mindmap,
  loading,
  error,
  onGenerate,
}: {
  mindmap: AiMindMap | null;
  loading: boolean;
  error?: string;
  onGenerate: (force?: boolean) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mmRef = useRef<Markmap | null>(null);
  const downloadRef = useRef<HTMLDivElement | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !mindmap?.markdown) return;

    const { root } = transformer.transform(mindmap.markdown);
    if (!mmRef.current) {
      mmRef.current = Markmap.create(svg, {
        duration: 300,
        maxWidth: 280,
        paddingX: 12,
      });
    }
    const mm = mmRef.current;
    void mm.setData(root).then(() => {
      mm.fit();
    });
  }, [mindmap?.markdown, mindmap?.createdAt]);

  useEffect(() => {
    return () => {
      mmRef.current?.destroy();
      mmRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!downloadOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = downloadRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [downloadOpen]);

  const zoom = (factor: number) => {
    void mmRef.current?.rescale(factor);
  };

  const fit = () => {
    void mmRef.current?.fit();
  };

  const runExport = async (
    kind: "png" | "svg" | "md" | "txt" | "json",
  ) => {
    if (!mindmap) return;
    setExporting(true);
    setDownloadOpen(false);
    try {
      if (kind === "md") downloadMindMapMarkdown(mindmap);
      else if (kind === "txt") downloadMindMapTxt(mindmap);
      else if (kind === "json") downloadMindMapJson(mindmap);
      else if (kind === "svg") {
        const svg = svgRef.current;
        if (!svg) throw new Error("Mind map not ready");
        downloadMindMapSvg(svg, mindmap.title);
      } else {
        const stage = stageRef.current;
        if (!stage) throw new Error("Mind map not ready");
        await downloadMindMapPng(stage, mindmap.title);
      }
      toast.success("Downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !mindmap) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
        <p className="text-sm text-slate-500">Generating mind map…</p>
      </div>
    );
  }

  if (error && !mindmap) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          onClick={() => onGenerate(true)}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!mindmap) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="max-w-sm text-sm text-slate-500">
          Turn this transcript into a topic mind map — branches show how ideas
          relate, not just the timeline.
        </p>
        <button
          type="button"
          className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          onClick={() => onGenerate(true)}
        >
          Generate MindMap
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {loading ? (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
          Refreshing…
        </div>
      ) : null}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-slate-200">
        <button
          type="button"
          aria-label="Zoom in"
          className={btnClass}
          onClick={() => zoom(1.25)}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className={btnClass}
          onClick={() => zoom(0.8)}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Fit to view"
          className={btnClass}
          onClick={fit}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <div ref={downloadRef} className="relative">
          <button
            type="button"
            aria-label="Download"
            aria-expanded={downloadOpen}
            disabled={exporting}
            className={btnClass}
            onClick={() => setDownloadOpen((o) => !o)}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
          {downloadOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-200">
              {(
                [
                  { id: "png" as const, label: "PNG image" },
                  { id: "svg" as const, label: "SVG" },
                  { id: "md" as const, label: "Markdown" },
                  { id: "txt" as const, label: "TXT" },
                  { id: "json" as const, label: "JSON" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => void runExport(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Regenerate"
          disabled={loading}
          className={btnClass}
          onClick={() => onGenerate(true)}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div
        ref={stageRef}
        className="h-full min-h-[320px] w-full flex-1 bg-[#FAFBFC]"
      >
        <svg
          ref={svgRef}
          className="h-full w-full"
          role="img"
          aria-label={mindmap.title || "Mind map"}
        />
      </div>
    </div>
  );
}
