"""Tiny HTTP wrapper around yt-dlp. One extract at a time."""

from __future__ import annotations

import os
import re
import subprocess
import tempfile
import threading
from pathlib import Path

from flask import Flask, request, send_file
from io import BytesIO

app = Flask(__name__)
LOCK = threading.Lock()
MAX_BYTES = 80 * 1024 * 1024
TIMEOUT = 180
COOKIE_PATH = os.environ.get("COOKIE_PATH", "").strip()
TOKEN = os.environ.get("YTDLP_TOKEN", "").strip()

URL_OK = re.compile(r"^https://", re.I)


def _authorized() -> bool:
    if not TOKEN:
        return True
    got = request.headers.get("Authorization", "")
    return got == f"Bearer {TOKEN}"


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/extract")
def extract():
    if not _authorized():
        return {"error": "unauthorized"}, 401
    body = request.get_json(silent=True) or {}
    url = str(body.get("url") or "").strip()
    if not URL_OK.match(url) or len(url) > 2048:
        return {"error": "Paste a full https URL."}, 400

    if not LOCK.acquire(blocking=False):
        return {"error": "Worker is busy. Try again in a moment."}, 429

    tmp = tempfile.mkdtemp(prefix="ytdlp-")
    out_tpl = str(Path(tmp) / "audio.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--no-progress",
        "-f",
        "ba/b",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "5",
        "--max-filesize",
        "80m",
        "-o",
        out_tpl,
        "--restrict-filenames",
        url,
    ]
    if COOKIE_PATH and Path(COOKIE_PATH).is_file():
        cmd[1:1] = ["--cookies", COOKIE_PATH]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
            check=False,
        )
        err = (proc.stderr or "") + (proc.stdout or "")
        if proc.returncode != 0:
            return {"error": _friendly(err), "detail": err[-1200:]}, 422

        files = list(Path(tmp).glob("audio.*"))
        if not files:
            return {"error": "yt-dlp finished but produced no file.", "detail": err[-1200:]}, 500
        audio = files[0]
        size = audio.stat().st_size
        if size > MAX_BYTES:
            return {"error": "That file is too large to process here."}, 413
        payload = BytesIO(audio.read_bytes())
        payload.seek(0)
        return send_file(
            payload,
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name=audio.name,
        )
    except subprocess.TimeoutExpired:
        return {"error": "Timed out fetching that link."}, 504
    finally:
        LOCK.release()
        for p in Path(tmp).glob("*"):
            try:
                p.unlink()
            except OSError:
                pass
        try:
            Path(tmp).rmdir()
        except OSError:
            pass


def _friendly(log: str) -> str:
    low = log.lower()
    if "sign in" in low or "login" in low or "not a bot" in low:
        return "YouTube asked for login. Add cookies.txt on the worker and retry."
    if "private" in low or "unavailable" in low:
        return "This video is private or unavailable."
    if "unsupported url" in low:
        return "This platform is not supported. Upload the file instead."
    return "Could not fetch audio from that link."


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
