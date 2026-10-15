// Kept import-free so `npm run check` can load it with plain Node.

const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

// Case- and spacing-insensitive "contains" match. A blank query matches all.
export function matchesSearch(text: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return normalize(text).includes(q);
}
