import type { Preset } from "../types/index.js";

export const PRESETS: Preset[] = [
  {
    id: "preset-demo",
    name: "Premium 3D",
    mainPrompt:
      "premium minimal 3D visual, studio light, smooth render, highly detailed, photorealistic",
    negativePrompt: "clutter, noisy background, low quality",
    references: ["/references/ref-1.png", "/references/ref-2.png"],
  },
];
