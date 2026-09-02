import l from "../src/components/face-rating/data/hero-landmarks.json" with { type: "json" };
import t from "../src/components/face-rating/data/face-mesh-tesselation.json" with { type: "json" };
console.log({
  points: l.points.length,
  tess: t.length,
  p468: l.points[468],
  p33: l.points[33],
  p234: l.points[234],
  maxTess: Math.max(...t.flat()),
});
