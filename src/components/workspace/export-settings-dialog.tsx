"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { ChapterItem } from "@/lib/media/chapters";
import type { TranscriptBlock, TranscriptSentence } from "@/lib/media/workspace-mock";
import {
  buildChaptersTxt,
  buildCsv,
  buildDocxBuffer,
  buildSrt,
  buildTxtFromCues,
  buildVtt,
  cuesFromBlocks,
  cuesFromSentences,
  downloadBytes,
  downloadTextFile,
  safeDownloadBase,
  type ExportCue,
} from "@/lib/media/transcript-export";

type LeftTab = "transcript" | "subtitles" | "chapter";

/** Exact Hugeicons bodies from videotranscriber.ai (Iconify `i-hugeicons:*`). */
const HUGE = {
  cancel01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 6L6 18m12 0L6 6"/>',
  txt01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13v-2.343c0-.818 0-1.226-.152-1.594c-.152-.367-.441-.657-1.02-1.235l-4.736-4.736c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C12.514 2 12.161 2 11.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.603C4 4.59 4 6.211 4 9.456V13m9-10.5V3c0 2.828 0 4.243.879 5.121C14.757 9 16.172 9 19 9h.5M10 16l2 3m0 0l2 3m-2-3l2-3m-2 3l-2 3m6.5-6h1.75m0 0H20m-1.75 0v6M4 16h1.75m0 0H7.5m-1.75 0v6"/>',
  doc01:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M20 13v-2.343c0-.818 0-1.226-.152-1.594c-.152-.367-.441-.657-1.02-1.235l-4.736-4.736c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C12.514 2 12.161 2 11.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.603C4 4.59 4 6.211 4 9.456V13m9-10.5V3c0 2.828 0 4.243.879 5.121C14.757 9 16.172 9 19 9h.5"/><path d="M20.5 17.22c-.051-1.19-.826-1.22-1.877-1.22c-1.619 0-1.887.406-1.887 2v2c0 1.594.268 2 1.887 2c1.051 0 1.826-.03 1.878-1.22M7.266 19c0 1.657-1.264 3-2.824 3c-.352 0-.528 0-.659-.08c-.313-.193-.282-.582-.282-.92v-4c0-.338-.031-.727.282-.92c.131-.08.307-.08.66-.08c1.559 0 2.823 1.343 2.823 3ZM12 22c-.888 0-1.331 0-1.607-.293s-.276-.764-.276-1.707v-2c0-.943 0-1.414.276-1.707S11.113 16 12 16s1.33 0 1.606.293s.276.764.276 1.707v2c0 .943 0 1.414-.276 1.707C13.331 22 12.887 22 12 22Z"/></g>',
  googleDoc:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M15 2.5V4c0 1.414 0 2.121.44 2.56C15.878 7 16.585 7 18 7h1.5"/><path d="M4 16V8c0-2.828 0-4.243.879-5.121C5.757 2 7.172 2 10 2h4.172c.408 0 .613 0 .797.076c.183.076.328.22.617.51l3.828 3.828c.29.29.434.434.51.618c.076.183.076.388.076.796V16c0 2.828 0 4.243-.879 5.121C18.243 22 16.828 22 14 22h-4c-2.828 0-4.243 0-5.121-.879C4 20.243 4 18.828 4 16m4-5h8m-8 3h8m-8 3h4.17"/></g>',
  csv01:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M7.5 17.22C7.445 16.03 6.622 16 5.505 16c-1.72 0-2.005.406-2.005 2v2c0 1.594.285 2 2.005 2c1.117 0 1.94-.03 1.995-1.22m13-4.78l-1.777 4.695c-.33.87-.494 1.305-.755 1.305c-.26 0-.426-.435-.755-1.305L15.436 16m-2.56 0h-1.18c-.473 0-.709 0-.895.076c-.634.26-.625.869-.625 1.424s-.009 1.165.625 1.424c.186.076.422.076.894.076s.708 0 .894.076c.634.26.625.869.625 1.424s.009 1.165-.625 1.424c-.186.076-.422.076-.894.076H10.41"/><path stroke-linejoin="round" d="M20 13v-2.343c0-.818 0-1.226-.152-1.594c-.152-.367-.441-.657-1.02-1.235l-4.736-4.736c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C12.514 2 12.161 2 11.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.603C4 4.59 4 6.211 4 9.456V13m9-10.5V3c0 2.828 0 4.243.879 5.121C14.757 9 16.172 9 19 9h.5"/></g>',
} as const;

function HugeIcon({ body, className }: { body: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

export default function ExportSettingsDialog({
  open,
  onOpenChange,
  title,
  leftTab,
  transcriptBlocks,
  subtitleCues,
  chapters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  leftTab: LeftTab;
  transcriptBlocks: TranscriptBlock[];
  subtitleCues: TranscriptSentence[];
  chapters: ChapterItem[] | null;
}) {
  const [withTimestamps, setWithTimestamps] = useState(true);

  const cues: ExportCue[] = useMemo(() => {
    if (leftTab === "subtitles") return cuesFromSentences(subtitleCues);
    if (leftTab === "chapter") {
      return (chapters || []).map((c, i, arr) => ({
        startSeconds: c.startSeconds,
        endSeconds: arr[i + 1]?.startSeconds ?? c.startSeconds + 30,
        text: `${c.title}${c.summary ? ` — ${c.summary}` : ""}`,
      }));
    }
    return cuesFromBlocks(transcriptBlocks);
  }, [leftTab, transcriptBlocks, subtitleCues, chapters]);

  const download = (kind: "txt" | "docx" | "srt" | "vtt" | "csv") => {
    if (!cues.length) {
      toast.error("Nothing to export");
      return;
    }
    const base = safeDownloadBase(title);
    try {
      if (kind === "txt") {
        const text =
          leftTab === "chapter" && chapters?.length
            ? buildChaptersTxt(chapters, withTimestamps)
            : buildTxtFromCues(cues, withTimestamps);
        downloadTextFile(`${base}.txt`, text);
        toast.success("Downloaded TXT");
      } else if (kind === "docx") {
        const text =
          leftTab === "chapter" && chapters?.length
            ? buildChaptersTxt(chapters, withTimestamps)
            : buildTxtFromCues(cues, withTimestamps);
        downloadBytes(
          `${base}.docx`,
          buildDocxBuffer(text),
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        toast.success("Downloaded DOCX");
      } else if (kind === "srt") {
        downloadTextFile(
          `${base}.srt`,
          buildSrt(cues),
          "application/x-subrip;charset=utf-8",
        );
        toast.success("Downloaded SRT");
      } else if (kind === "vtt") {
        downloadTextFile(`${base}.vtt`, buildVtt(cues), "text/vtt;charset=utf-8");
        toast.success("Downloaded VTT");
      } else {
        downloadTextFile(
          `${base}.csv`,
          buildCsv(cues, withTimestamps),
          "text/csv;charset=utf-8",
        );
        toast.success("Downloaded CSV");
      }
      onOpenChange(false);
    } catch {
      toast.error("Export failed");
    }
  };

  const formats: {
    id: "txt" | "docx" | "srt" | "vtt" | "csv";
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "txt",
      label: "Download TXT",
      icon: <HugeIcon body={HUGE.txt01} className="size-5 shrink-0" />,
    },
    {
      id: "docx",
      label: "Download DOCX",
      icon: <HugeIcon body={HUGE.doc01} className="size-5 shrink-0" />,
    },
    {
      id: "srt",
      label: "Download SRT",
      icon: <HugeIcon body={HUGE.googleDoc} className="size-5 shrink-0" />,
    },
    {
      id: "vtt",
      label: "Download VTT",
      icon: <HugeIcon body={HUGE.googleDoc} className="size-5 shrink-0" />,
    },
    {
      id: "csv",
      label: "Download CSV",
      icon: <HugeIcon body={HUGE.csv01} className="size-5 shrink-0" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-lg ring-1 ring-slate-200 [&>button]:hidden">
        <div className="flex flex-col rounded-2xl bg-white p-4">
          <div className="relative mb-6 flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-black">
              Export settings
            </DialogTitle>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-800"
              onClick={() => onOpenChange(false)}
            >
              <HugeIcon body={HUGE.cancel01} className="size-5" />
            </button>
          </div>

          <div className="mb-6 w-full border-t border-slate-200" />

          <div className="mb-6 flex justify-center gap-6">
            <div className="flex items-center justify-center">
              <label className="mr-4 text-sm text-slate-900">With timestamps</label>
              <Switch
                checked={withTimestamps}
                onCheckedChange={setWithTimestamps}
                className="h-5 w-9 border-0 shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-[#1C6CFB] data-[state=unchecked]:bg-slate-300 [&>span]:h-4 [&>span]:w-4 [&>span]:border-0 [&>span]:bg-white [&>span]:shadow-md [&>span]:ring-0 [&>span]:data-[state=checked]:translate-x-4 [&>span]:data-[state=unchecked]:translate-x-0"
              />
            </div>
          </div>

          <div className="mb-6 mt-6 grid grid-cols-2 gap-4 px-10">
            {formats.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => download(f.id)}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[6px] bg-white px-2.5 py-1.5 text-sm font-medium text-slate-500 shadow-none ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
