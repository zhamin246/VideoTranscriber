import re
from pathlib import Path

s = Path("src/lib/convert/youtube-subtitle-downloader-content.ts").read_text(encoding="utf-8")
chunks = re.findall(r'"([^"]+)"', s)
chunks = [
    c
    for c in chunks
    if not c.startswith("#")
    and c not in ("1", "2", "3")
    and not c.startswith("/")
    and not c.startswith("http")
]
text = " ".join(chunks)
words = [w for w in text.split() if w]
kw = "YouTube Subtitle Downloader"
matches = re.findall(kw, text)
print(
    {
        "seoWords": len(words),
        "phrase": len(matches),
        "seoDensity": round(len(matches) * 3 / len(words) * 100, 2) if words else 0,
    }
)
print("If chrome adds ~600 words at 13 phrases:", round(13 * 3 / (len(words) + 600) * 100, 2))
print("If total 1500 with this phrase count:", round(len(matches) * 3 / 1500 * 100, 2))
for c in chunks:
    if kw in c:
        print("-", c[:100])
