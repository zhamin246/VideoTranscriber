const HISTORY_MAX = 30;

export function floodFillMask(
  image: ImageData,
  mask: Uint8Array,
  sx: number,
  sy: number,
  tol: number
) {
  const w = image.width;
  const h = image.height;
  const data = image.data;
  const seedP = sy * w + sx;
  const s = seedP * 4;
  const sr = data[s];
  const sg = data[s + 1];
  const sb = data[s + 2];
  const visited = new Uint8Array(w * h);
  const stack = [seedP];
  visited[seedP] = 1;
  while (stack.length) {
    const p = stack.pop()!;
    const q = p * 4;
    const dr = Math.abs(data[q] - sr);
    const dg = Math.abs(data[q + 1] - sg);
    const db = Math.abs(data[q + 2] - sb);
    if (Math.max(dr, dg, db) > tol) continue;
    mask[p] = 1;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0 && !visited[p - 1]) {
      visited[p - 1] = 1;
      stack.push(p - 1);
    }
    if (x < w - 1 && !visited[p + 1]) {
      visited[p + 1] = 1;
      stack.push(p + 1);
    }
    if (y > 0 && !visited[p - w]) {
      visited[p - w] = 1;
      stack.push(p - w);
    }
    if (y < h - 1 && !visited[p + w]) {
      visited[p + w] = 1;
      stack.push(p + w);
    }
  }
}

export function paintMagicPreview(image: ImageData, mask: Uint8Array) {
  const out = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
  const d = out.data;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const j = i * 4;
    d[j] = 255;
    d[j + 1] = 90;
    d[j + 2] = 90;
    d[j + 3] = 255;
  }
  return out;
}

export function pushMaskHistory(stack: Uint8Array[], mask: Uint8Array) {
  stack.push(mask.slice());
  if (stack.length > HISTORY_MAX) stack.shift();
}
