"""Generate Face Rating favicon / PWA icon set from the brand mesh mark."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

BG = (159, 18, 57, 255)  # #9F1239
FG = (255, 255, 255, 255)


def draw_mark(size: int) -> Image.Image:
    """Draw mesh-face mark on burgundy circle (design space 512)."""
    # Draw at higher res then downscale for small sizes (cleaner AA)
    src = max(size, 512)
    scale = src / 512.0
    img = Image.new("RGBA", (src, src), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, src - 1, src - 1], fill=BG)

    def xy(x: float, y: float) -> tuple[float, float]:
        return (x * scale, y * scale)

    def line(pts: list[tuple[float, float]], width: float) -> None:
        w = max(1, int(round(width * scale)))
        coords = [xy(x, y) for x, y in pts]
        d.line(coords, fill=FG, width=w)
        # round caps via end dots
        r = w / 2
        for cx, cy in (coords[0], coords[-1]):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=FG)

    def node(x: float, y: float, r: float = 9) -> None:
        cx, cy = xy(x, y)
        rr = r * scale
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=FG)

    # Outer face contour
    line(
        [
            (168, 196),
            (180, 150),
            (220, 122),
            (256, 118),
            (292, 122),
            (332, 150),
            (344, 196),
            (344, 248),
            (332, 300),
            (312, 340),
            (292, 380),
            (268, 404),
            (256, 404),
            (244, 404),
            (220, 380),
            (200, 340),
            (180, 300),
            (168, 248),
            (168, 196),
        ],
        14,
    )
    line([(188, 214), (210, 200), (230, 194), (256, 192), (282, 194), (302, 200), (324, 214)], 12)
    line([(256, 214), (256, 292)], 12)
    line([(232, 300), (244, 310), (268, 310), (280, 300)], 12)
    line([(210, 248), (228, 236), (246, 248), (228, 260), (210, 248)], 11)
    line([(266, 248), (284, 236), (302, 248), (284, 260), (266, 248)], 11)
    line([(214, 338), (232, 354), (256, 360), (280, 354), (298, 338)], 12)
    line([(188, 250), (210, 292), (228, 340)], 11)
    line([(324, 250), (302, 292), (284, 340)], 11)
    line([(210, 292), (256, 312), (302, 292)], 11)
    line([(228, 340), (256, 360), (284, 340)], 11)
    line([(210, 176), (256, 158), (302, 176)], 11)
    line([(210, 176), (228, 214)], 11)
    line([(302, 176), (284, 214)], 11)
    line([(256, 158), (256, 192)], 11)

    for x, y in [
        (210, 176),
        (256, 158),
        (302, 176),
        (188, 250),
        (324, 250),
        (228, 248),
        (284, 248),
        (256, 292),
        (210, 292),
        (302, 292),
        (228, 340),
        (284, 340),
        (256, 360),
        (256, 404),
    ]:
        node(x, y, 9)

    if size != src:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    targets = {
        "favicon-32x32.png": 32,
        "favicon-96x96.png": 96,
        "apple-touch-icon.png": 180,
        "web-app-manifest-192x192.png": 192,
        "web-app-manifest-512x512.png": 512,
    }
    for name, size in targets.items():
        path = PUBLIC / name
        draw_mark(size).save(path, format="PNG", optimize=True)
        print("wrote", path, path.stat().st_size)

    # Multi-size ICO: provide a large master; Pillow generates requested sizes
    master = draw_mark(256)
    ico_path = PUBLIC / "favicon.ico"
    master.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("wrote", ico_path, ico_path.stat().st_size)


if __name__ == "__main__":
    main()
