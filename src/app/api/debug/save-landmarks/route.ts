import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Dev-only helper to persist MediaPipe landmarks from the browser extract page. */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const body = await req.json();
  if (!body?.points?.length) {
    return NextResponse.json({ error: "invalid landmarks" }, { status: 400 });
  }
  const json = JSON.stringify(body);
  const targets = [
    path.join(process.cwd(), "src/components/face-rating/data/hero-landmarks.json"),
    path.join(process.cwd(), "public/face-rating/hero-landmarks.json"),
  ];
  for (const t of targets) {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.writeFileSync(t, json);
  }
  return NextResponse.json({
    ok: true,
    points: body.points.length,
    imageWidth: body.imageWidth,
    imageHeight: body.imageHeight,
  });
}
