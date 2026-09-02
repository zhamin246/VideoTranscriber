import re
from pathlib import Path

t = Path("src/components/face-rating/data.ts").read_text(encoding="utf-8")
start = t.find("body: `") + 7
end = t.find("`,\n  },\n\n  // Legacy")
a = t[start:end]
w = re.findall(r"[A-Za-z0-9']+", a)
vt = len(re.findall(r"Video Transcriber", a))
Path("tmp-count.txt").write_text(
    f"words {len(w)} VT {vt} dens {round(100 * vt / max(len(w),1), 2)} chars {len(a)}",
    encoding="utf-8",
)
