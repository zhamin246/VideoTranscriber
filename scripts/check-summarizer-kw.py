import re
from pathlib import Path

s = Path("src/lib/convert/ai-video-summarizer-content.ts").read_text(encoding="utf-8")
s2 = re.sub(r"meta:\s*\{.*?\},", "", s, count=1, flags=re.S)
chunks = re.findall(r'"([^"]+)"', s2)
chunks = [
    c
    for c in chunks
    if not c.startswith("#")
    and c not in ("1", "2", "3")
    and not c.startswith("/")
    and not c.endswith(".webp")
]
text = " ".join(chunks)
words = [w for w in text.split() if w]
matches = re.findall("AI Video Summarizer", text)
print(
    {
        "words": len(words),
        "phrase": len(matches),
        "density": round(len(matches) * 3 / len(words) * 100, 2),
    }
)
