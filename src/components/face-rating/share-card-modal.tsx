"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type ShareCardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  score: number;
  tierName: string;
  tierColor: string;
  tierBlurb: string;
  scaleMax?: number;
  toolLabel?: string;
  toolPath?: string;
  siteHost?: string;
  brandName?: string;
};

/**
 * Competitor share card is 1080×1350 (4:5), not 9:16.
 * Layout constants measured from thefacereport attractiveness modal.
 */
const CARD_W = 1080;
const CARD_H = 1350;
const BAR_H = 12;
const FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/** Centered text with letter-spacing (canvas has no reliable letterSpacing). */
function fillTextSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number
) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, chars.length - 1);
  let x = cx - total / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + tracking;
  }
  ctx.textAlign = prev;
}

function drawCoverCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const size = r * 2;
  const ir = img.naturalWidth / Math.max(1, img.naturalHeight);
  let dw = size;
  let dh = size;
  let dx = cx - r;
  let dy = cy - r;
  if (ir > 1) {
    dw = size * ir;
    dx = cx - dw / 2;
  } else {
    dh = size / ir;
    dy = cy - dh / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  // thin white ring (competitor ~3–4px at 1080)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 4;
  ctx.stroke();
}

async function loadQrImage(data: string, size: number): Promise<HTMLImageElement | null> {
  const url =
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}` +
    `&data=${encodeURIComponent(data)}&margin=0&bgcolor=ffffff&color=000000`;
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderShareCardPng(opts: {
  previewUrl: string;
  score: number;
  tierName: string;
  tierColor: string;
  tierBlurb: string;
  scaleMax: number;
  toolLabel: string;
  displayUrl: string;
  fullUrl: string;
  brandName: string;
  mystery: boolean;
  hidePhoto: boolean;
}): Promise<Blob> {
  const {
    previewUrl,
    score,
    tierName,
    tierColor,
    tierBlurb,
    scaleMax,
    toolLabel,
    displayUrl,
    fullUrl,
    brandName,
    mystery,
    hidePhoto,
  } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  // Background — pure near-black
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Accent bars (measured ~12px, tier amber on Rising)
  ctx.fillStyle = tierColor;
  ctx.fillRect(0, 0, CARD_W, BAR_H);
  ctx.fillRect(0, CARD_H - BAR_H, CARD_W, BAR_H);

  const midX = CARD_W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Brand — measured y≈89, light, wide tracking
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `600 24px ${FONT}`;
  fillTextSpaced(ctx, brandName.toUpperCase(), midX, 78, 6);

  // Tool label
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.font = `600 22px ${FONT}`;
  fillTextSpaced(ctx, toolLabel.toUpperCase(), midX, 122, 5);

  // Avatar — measured diameter ~318 → r≈159, center ~ y 300
  const avatarR = 158;
  const avatarCy = hidePhoto ? 0 : 300;
  if (!hidePhoto) {
    try {
      const img = await loadImage(previewUrl);
      drawCoverCircle(ctx, img, midX, avatarCy, avatarR);
    } catch {
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(midX, avatarCy, avatarR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  // Score block — measured white band y≈467–690 (h≈223)
  const scoreY = hidePhoto ? 300 : 458;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 228px ${FONT}`;
  ctx.textBaseline = "top";
  const scoreText = mystery ? "??" : String(score);
  ctx.fillText(scoreText, midX, scoreY);

  // / 100 — measured ~717
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(`/ ${scaleMax}`, midX, scoreY + 238);

  // Tier / mystery headline — measured amber ~776
  ctx.fillStyle = tierColor;
  ctx.font = `800 58px ${FONT}`;
  const headline = mystery ? "CAN YOU GUESS?" : tierName.toUpperCase();
  ctx.fillText(headline, midX, scoreY + 288);

  // Blurb
  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.font = `400 23px ${FONT}`;
  const blurb = mystery
    ? "I took the Attractiveness test — drop your guess"
    : tierBlurb;
  const blurbLines = wrapLines(ctx, blurb, CARD_W - 220);
  let ly = scoreY + 360;
  for (const line of blurbLines) {
    ctx.fillText(line, midX, ly);
    ly += 32;
  }

  if (mystery) {
    const ruleY = ly + 40;
    ctx.strokeStyle = tierColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(midX - 180, ruleY);
    ctx.lineTo(midX + 180, ruleY);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 30px ${FONT}`;
    fillTextSpaced(ctx, "GET YOUR OWN SCORE", midX, ruleY + 28, 2);

    ctx.fillStyle = tierColor;
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(displayUrl, midX, ruleY + 78);
  } else {
    // Pin CTA near measured competitor y≈1030 so bottom void matches
    const ctaY = Math.max(ly + 56, 1005);
    const ruleY = ctaY - 40;
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(midX - 170, ruleY);
    ctx.lineTo(midX + 170, ruleY);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 30px ${FONT}`;
    fillTextSpaced(ctx, "WHAT'S YOUR SCORE?", midX, ctaY, 1.2);
  }

  // QR — measured ~125×147 @ (883, 1142); 128 square
  const qrSize = 120;
  const qrX = CARD_W - 72 - qrSize;
  const qrY = CARD_H - BAR_H - 56 - qrSize;
  const qr = await loadQrImage(fullUrl, qrSize * 2);
  // flat white plate, tiny corner radius
  ctx.fillStyle = "#ffffff";
  const pad = 6;
  ctx.fillRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);
  if (qr) {
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  }

  // Bottom URL — left, muted, vertically centered with QR (competitor ~22px)
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = `400 20px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let urlLabel = displayUrl;
  const urlMax = qrX - 88;
  while (ctx.measureText(urlLabel).width > urlMax && urlLabel.length > 16) {
    urlLabel = urlLabel.slice(0, -1);
  }
  if (urlLabel !== displayUrl) urlLabel = `${urlLabel}…`;
  ctx.fillText(urlLabel, 56, qrY + qrSize / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode share card"));
      },
      "image/png",
      1
    );
  });
}

/**
 * Share card modal — thefacereport attractiveness parity:
 * 1080×1350 card, mystery/hide toggles, sharp Share / Download / Close.
 */
export default function ShareCardModal({
  open,
  onOpenChange,
  previewUrl,
  score,
  tierName,
  tierColor,
  tierBlurb,
  scaleMax = 100,
  toolLabel = "ATTRACTIVENESS",
  toolPath = "/tools/ai-attractiveness-test",
  siteHost = "facerating.com",
  brandName = "FACE RATING",
}: ShareCardProps) {
  const [mystery, setMystery] = useState(false);
  const [hidePhoto, setHidePhoto] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "share" | "render" | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const displayUrl = `${siteHost}${toolPath}`;
  const fullUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${toolPath}`;
    }
    return `https://${siteHost}${toolPath}`;
  }, [siteHost, toolPath]);

  const buildBlob = useCallback(async () => {
    return renderShareCardPng({
      previewUrl,
      score,
      tierName,
      tierColor,
      tierBlurb,
      scaleMax,
      toolLabel,
      displayUrl,
      fullUrl,
      brandName,
      mystery,
      hidePhoto,
    });
  }, [
    previewUrl,
    score,
    tierName,
    tierColor,
    tierBlurb,
    scaleMax,
    toolLabel,
    displayUrl,
    fullUrl,
    brandName,
    mystery,
    hidePhoto,
  ]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setBusy("render");
    void (async () => {
      try {
        const blob = await buildBlob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewSrc((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      } catch {
        if (!cancelled) setStatus("Could not render share card");
      } finally {
        if (!cancelled) setBusy((b) => (b === "render" ? null : b));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, buildBlob]);

  useEffect(() => {
    if (open) {
      setMystery(false);
      setHidePhoto(false);
      setStatus(null);
    }
  }, [open]);

  const onDownload = async () => {
    if (busy === "download" || busy === "share") return;
    setBusy("download");
    setStatus(null);
    try {
      const blob = await buildBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `face-rating-share-${mystery ? "mystery" : score}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Saved to your device");
    } catch {
      setStatus("Could not download — try again");
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    if (busy === "download" || busy === "share") return;
    setBusy("share");
    setStatus(null);
    const text = mystery
      ? `I took the Face Rating Attractiveness test — can you guess my score? ${fullUrl}`
      : `My Face Rating attractiveness score: ${score}/${scaleMax} — ${tierName}. ${fullUrl}`;
    try {
      const blob = await buildBlob();
      const file = new File([blob], `face-rating-share-${score}.png`, {
        type: "image/png",
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Face Rating",
          text,
          files: [file],
          url: fullUrl,
        });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Face Rating", text, url: fullUrl });
        return;
      }
      try {
        await navigator.clipboard?.writeText(text);
      } catch {
        /* ignore */
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `face-rating-share-${score}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Image downloaded — link copied when possible");
    } catch {
      setStatus("Could not share — try Download card");
    } finally {
      setBusy(null);
    }
  };

  /** Competitor: ~28px, 12.8px, radius ~10, weight 500, muted border */
  const toggleClass = (on: boolean) =>
    `inline-flex h-7 items-center rounded-[10px] border px-2.5 text-[12.8px] font-medium transition-colors ${
      on
        ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
        : "border-[#e5e5e5] bg-transparent text-[#0a0a0a] hover:bg-[#fafafa]"
    }`;

  /** Competitor: 36px tall, radius 0, font-bold 14px, single-line labels */
  const actionClass =
    "inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap px-3 text-sm font-bold transition-colors disabled:opacity-60";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex w-[min(100vw-1.5rem,28rem)] max-w-[448px] flex-col gap-0 overflow-hidden border-0 bg-white p-4 shadow-xl sm:rounded-[17px]"
        aria-describedby="share-card-desc"
      >
        <DialogTitle className="pr-8 text-left text-base font-medium leading-none tracking-tight text-[#0a0a0a]">
          Your share card
        </DialogTitle>
        <DialogDescription
          id="share-card-desc"
          className="mt-2 max-w-[34ch] text-left text-sm font-normal leading-5 text-[#3f3f46]"
        >
          Choose how much to reveal, then share the image and its direct test
          link.
        </DialogDescription>

        {/* Card — nearly full dialog width, 12px radius like competitor */}
        <div className="mt-4">
          <div className="overflow-hidden rounded-xl bg-[#0a0a0a]">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Your shareable result card"
                className="block h-auto w-full"
              />
            ) : (
              <div className="flex aspect-[1080/1350] items-center justify-center text-sm text-[#a3a3a3]">
                {busy === "render" ? "Preparing card…" : "—"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={mystery}
            aria-label="Hide my score and ask friends to guess"
            className={toggleClass(mystery)}
            onClick={() => setMystery((v) => !v)}
          >
            Mystery score
          </button>
          <button
            type="button"
            aria-pressed={hidePhoto}
            aria-label="Hide my photo from the share card"
            className={toggleClass(hidePhoto)}
            onClick={() => setHidePhoto((v) => !v)}
          >
            Hide my photo
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void onShare()}
            disabled={!!busy && busy !== "render"}
            className={`${actionClass} bg-[#9F1239] text-white hover:bg-[#881337]`}
          >
            {busy === "share" ? "…" : "Share"}
          </button>
          <button
            type="button"
            onClick={() => void onDownload()}
            disabled={!!busy && busy !== "render"}
            className={`${actionClass} border border-[#e5e5e5] bg-transparent text-[#0a0a0a] hover:bg-[#fafafa]`}
          >
            {busy === "download" ? "…" : "Download card"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${actionClass} border border-[#e5e5e5] bg-transparent text-[#0a0a0a] hover:bg-[#fafafa]`}
          >
            Close
          </button>
        </div>

        {status ? (
          <p className="mt-2 text-center text-xs font-medium text-[#9F1239]" role="status">
            {status}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
