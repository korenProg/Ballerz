// Kept import-free so `npm run check` can load it with plain Node.

// "Daniel Cohen" → "DC", like an iOS Contacts avatar: the first letter of the
// first and last words. A blank name gives "".
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  return (first + last).toUpperCase();
}
