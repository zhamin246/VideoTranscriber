from pathlib import Path

p = Path(r"d:\github\VideoTranscriber\src\components\face-rating\data.ts")
t = p.read_text(encoding="utf-8")
a = t.find("  _removeLongformStart:")
b = t.find("  // Legacy keys still imported by product-mocks")
if a < 0 or b < 0 or b <= a:
    raise SystemExit(f"markers missing a={a} b={b}")
p.write_text(t[:a] + t[b:], encoding="utf-8")
print("stripped", b - a)
