export default function lengthToMM(raw: string): number {
  if (!raw) return Number.POSITIVE_INFINITY;
  const s = raw.toLowerCase().replace(/\s+/g, "");
  const m = s.match(/(\d*\.?\d+)/);
  if (!m) return Number.POSITIVE_INFINITY;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return Number.POSITIVE_INFINITY;
  if (s.includes("mm")) return num;
  if (s.includes("m")) return Math.round(num * 1000);
  if (Number.isInteger(num) && num >= 100) return num;
  return Math.round(num * 1000);
}