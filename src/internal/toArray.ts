export function toArray<T>(
  x: T | T[] | null | undefined,
  defaultValue: T[],
): T[] {
  if (x === null || x === undefined) {
    return defaultValue;
  } else if (Array.isArray(x)) {
    return x;
  }
  return [x];
}
