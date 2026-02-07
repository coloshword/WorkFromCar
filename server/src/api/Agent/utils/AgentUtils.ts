export function normalizeNullStrings(
  obj: Record<string, string>
): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "null" ? null : v])
  );
}
