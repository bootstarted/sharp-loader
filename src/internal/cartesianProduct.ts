/**
 * Compute the cartesian product from a set of sets. Roughly this generates
 * a new set of sets where each member is a set containing one unique
 * combination of elements from each of the input sets.
 * See: https://stackoverflow.com/a/42873141
 * @param {any} elements The set of sets.
 * @returns {any} The cartesian product of `elements`.
 */
export function cartesianProduct<T>(
  elements: readonly (readonly T[])[],
): T[][] {
  const end = elements.length - 1;
  const result: T[][] = [];

  function addTo(curr: T[], start: number): void {
    const first = elements[start];
    const last = start === end;

    for (const item of first) {
      const copy = curr.slice();

      copy.push(item);

      if (last) {
        result.push(copy);
      } else {
        addTo(copy, start + 1);
      }
    }
  }

  if (elements.length > 0) {
    addTo([], 0);
  } else {
    result.push([]);
  }

  return result;
}
