/**
 * GPT Image 2 i2i — generic contour line drawing for outline tracing.
 * Works for photos, products, drawings, and plans. Not a filled stencil.
 */
const LINEART_CORE = [
  "Redraw the input as a clean black-and-white line drawing of the same subject, shape, and layout.",
  "Pure black contour lines on a flat white background.",
  "Draw outlines of the main forms. Do not fill large areas with solid black.",
  "No gray, no color, no fills, no gradients, no hatching, no shading, no paper texture.",
  "Medium even line weight. Long continuous strokes. Avoid broken dashes and scratchy hairlines.",
  "Keep important edges, corners, holes, and structure. Drop noise, grain, and tiny texture.",
  "No watermark, no frame, no extra objects.",
].join(" ");

const LINEART_SIMPLE = [
  "Redraw the input as a simple black-and-white line drawing of the same subject and layout.",
  "Only major contours. Drop texture, grain, and minor detail.",
  "Pure black lines on flat white. Do not fill large areas with solid black.",
  "No gray, no hatching, no shading.",
  "No watermark, no frame, no extra objects.",
].join(" ");

const NO_BG = " Remove the original background completely; leave only the subject on white.";

export function lineartPrompt(opts: {
  removeBackground: boolean;
  detailed: boolean;
}) {
  const base = opts.detailed ? LINEART_CORE : LINEART_SIMPLE;
  return opts.removeBackground ? `${base}${NO_BG}` : base;
}
