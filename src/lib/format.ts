export const kwd = (n: number) => `${Number(n).toFixed(3)} KWD`;

/** Parses a user-typed number; returns NaN for empty / invalid input. */
export function parseNum(x: string): number {
  const t = String(x).trim();
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? n : NaN;
}


/** Formats a timestamp from the database as Kuwait local time ("YYYY-MM-DD HH:mm:ss"). */
export function formatKuwait(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kuwait" });
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kuwait", hour12: false });
  return `${date} ${time}`;
}
