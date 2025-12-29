import lengthToMM from "./lengthToMM";

export const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function sortLengths(a: string, b: string) {
  const da = lengthToMM(a);
  const db = lengthToMM(b);
  if (da !== db) return da - db;
  return collator.compare(a, b);
}