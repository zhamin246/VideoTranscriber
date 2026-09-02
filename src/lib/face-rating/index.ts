export * from "./indices";
export * from "./geometry";
export * from "./score";
// Landmarker is browser-only and should be imported dynamically from
// "@/lib/face-rating/landmarker" so Next does not pull MediaPipe into
// the critical client bundle for pages that only need pure scoring math.
