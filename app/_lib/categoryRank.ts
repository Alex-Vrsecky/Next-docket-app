export function categoryRank(name: string, CATEGORY_PRIORITY: string[]): number {
  const n = (name || "").toLowerCase();
  const exactIndex = CATEGORY_PRIORITY.indexOf(n);
  if (exactIndex !== -1) return exactIndex;

  for (let i = 0; i < CATEGORY_PRIORITY.length; i++) {
    if (n.includes(CATEGORY_PRIORITY[i])) return i;
  }

  return Number.POSITIVE_INFINITY;
}