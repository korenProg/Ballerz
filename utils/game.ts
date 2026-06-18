// Date strings throughout the app are DD/MM/YYYY.
export function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export function parseGameDate(date?: string): number {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
