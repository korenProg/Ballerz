// Colour band for an OVR or rating number. The top band matches T.accent;
// kept as literals because this file must stay import-free for `npm run check`.
const BANDS = [
  { min: 80, color: "#2FD47A" },
  { min: 70, color: "#A3E635" },
  { min: 60, color: "#F5C518" },
] as const;

const LOWEST = "#F97316";

export function ratingColor(value: number): string {
  for (const band of BANDS) {
    if (value >= band.min) return band.color;
  }
  return LOWEST;
}
