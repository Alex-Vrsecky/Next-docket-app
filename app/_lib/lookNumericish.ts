
export function looksNumericish(v: string) {
  return /\d/.test(v || "");
}
