import { formatTimestamp } from "@/lib/media/workspace-mock";
import type { TranscriptSentence } from "@/lib/media/workspace-mock";
import type { ChapterItem } from "@/lib/media/chapters";
import type { TranscriptBlock } from "@/lib/media/workspace-mock";

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/** SRT / VTT clock: HH:MM:SS,mmm or HH:MM:SS.mmm */
function formatSrtTime(seconds: number, fracSep: "," | ".") {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}${fracSep}${String(ms).padStart(3, "0")}`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsv(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export type ExportCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

/** Flatten transcript blocks into timed cues for export. */
export function cuesFromBlocks(blocks: TranscriptBlock[]): ExportCue[] {
  const out: ExportCue[] = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]!;
    for (let si = 0; si < b.sentences.length; si++) {
      const s = b.sentences[si]!;
      const next =
        b.sentences[si + 1]?.startSeconds ??
        blocks[bi + 1]?.startSeconds ??
        s.endSeconds ??
        s.startSeconds + 3;
      out.push({
        startSeconds: s.startSeconds,
        endSeconds: Math.max(next, s.startSeconds + 0.4),
        text: s.text,
      });
    }
  }
  return out;
}

export function cuesFromSentences(cues: TranscriptSentence[]): ExportCue[] {
  return cues.map((c) => ({
    startSeconds: c.startSeconds,
    endSeconds: Math.max(c.endSeconds || c.startSeconds + 2, c.startSeconds + 0.4),
    text: c.text,
  }));
}

export function buildTxtFromCues(cues: ExportCue[], withTimestamps: boolean) {
  if (withTimestamps) {
    return cues
      .map((c) => `${formatTimestamp(c.startSeconds)}\n${c.text}`)
      .join("\n\n");
  }
  return cues.map((c) => c.text).join("\n");
}

export function buildChaptersTxt(
  chapters: ChapterItem[],
  withTimestamps: boolean,
) {
  return chapters
    .map((c) => {
      const body = `${c.title}\n${c.summary || ""}`.trim();
      return withTimestamps
        ? `${formatTimestamp(c.startSeconds)}\n${body}`
        : body;
    })
    .join("\n\n");
}

export function buildSrt(cues: ExportCue[]) {
  return cues
    .map((c, i) => {
      return `${i + 1}\n${formatSrtTime(c.startSeconds, ",")} --> ${formatSrtTime(c.endSeconds, ",")}\n${c.text}\n`;
    })
    .join("\n");
}

export function buildVtt(cues: ExportCue[]) {
  const body = cues
    .map((c) => {
      return `${formatSrtTime(c.startSeconds, ".")} --> ${formatSrtTime(c.endSeconds, ".")}\n${c.text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function buildCsv(cues: ExportCue[], withTimestamps: boolean) {
  if (withTimestamps) {
    const rows = [
      "start,end,text",
      ...cues.map(
        (c) =>
          `${formatTimestamp(c.startSeconds)},${formatTimestamp(c.endSeconds)},${escapeCsv(c.text)}`,
      ),
    ];
    return rows.join("\n");
  }
  const rows = ["text", ...cues.map((c) => escapeCsv(c.text))];
  return rows.join("\n");
}

/** Minimal DOCX (ZIP store) — opens in Word / Google Docs / LibreOffice. */
export function buildDocxBuffer(plainText: string): Uint8Array {
  const paragraphs = plainText.split(/\n/).map((line) => {
    if (!line) return `<w:p/>`;
    return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
  });
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("")}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  const enc = new TextEncoder();
  return zipStore([
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rels) },
    { name: "word/document.xml", data: enc.encode(documentXml) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(docRels) },
  ]);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8",
) {
  const blob = new Blob([content], { type: mime });
  triggerDownload(blob, filename);
}

export function downloadBytes(
  filename: string,
  bytes: Uint8Array,
  mime: string,
) {
  // Copy into a fresh ArrayBuffer-backed Uint8Array for BlobPart typing
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mime });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function safeDownloadBase(title: string) {
  const base = (title || "transcript")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return base || "transcript";
}

/* ---- minimal ZIP (store only) ---- */

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}
function u32(n: number) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.data,
    ]);
    const central = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralDir = concatBytes(centrals);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);

  return concatBytes([...locals, centralDir, end]);
}

/** @deprecated kept for older call sites */
export function buildTranscriptTxt(blocks: TranscriptBlock[]) {
  return buildTxtFromCues(cuesFromBlocks(blocks), true);
}

/** @deprecated */
export function buildSubtitlesTxt(cues: TranscriptSentence[]) {
  return buildTxtFromCues(cuesFromSentences(cues), true);
}
