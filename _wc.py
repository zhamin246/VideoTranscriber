import re
from collections import Counter
from pathlib import Path

t = Path("src/lib/convert/tiktok-transcript-generator-content.ts").read_text(encoding="utf-8")
t = re.sub(r"https://[^\s\"]+", " ", t)
parts = re.findall(
    r"(?:title|description|h1|subtitle|lead|body|label|alt|q|a|button):\s*\"([^\"]*)\"",
    t,
)
text = " ".join(parts)
words = re.findall(r"[A-Za-z0-9']+", text)
low = " ".join(words).lower()
phrases = [
    "tiktok transcript",
    "tiktok to transcript",
    "tiktok video transcript",
    "tiktok to text",
    "tiktok transcript generator",
]
w = [x.lower() for x in words]
stop = {
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "this", "that",
    "with", "you", "your", "is", "are", "it", "as", "from", "then", "when",
    "can", "not", "do", "use",
}
c1 = Counter(x for x in w if x not in stop)
c2 = Counter(" ".join(w[i : i + 2]) for i in range(len(w) - 1))
c3 = Counter(" ".join(w[i : i + 3]) for i in range(len(w) - 2))
lines = [f"words {len(words)}"]
for p in phrases:
    n = len(re.findall(p, low))
    lines.append(f"{p}: {n} dens {round(n / max(len(words), 1) * 100, 2)}")
lines.append(f"top1 {c1.most_common(8)}")
lines.append(f"top2 {c2.most_common(6)}")
lines.append(f"top3 {c3.most_common(6)}")
Path("_wc.txt").write_text("\n".join(lines), encoding="utf-8")
