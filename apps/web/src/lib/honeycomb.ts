/**
 * Positions for the "Our Partners" honeycomb, in units of one hexagon's
 * width (the component multiplies them by a CSS variable, so the whole
 * figure scales with the breakpoint).
 *
 * Hexagons are pointy-topped. Neighbours sit one `PITCH` apart, rows one
 * `ROW_PITCH` apart, and alternate rows shift by half a pitch, so every gap
 * in the figure is the same `GAP`.
 */

export const HEX_HEIGHT = 2 / Math.sqrt(3); // ≈ 1.1547 for a width of 1
export const GAP = 0.1;
export const PITCH = 1 + GAP;
export const ROW_PITCH = (Math.sqrt(3) / 2) * PITCH;

export type Slot = { x: number; y: number };
export type Cluster = { slots: Slot[]; width: number; height: number };

function bounds(slots: Slot[]): Cluster {
  if (slots.length === 0) return { slots, width: 0, height: 0 };
  const minX = Math.min(...slots.map((s) => s.x));
  const minY = Math.min(...slots.map((s) => s.y));
  const shifted = slots.map((s) => ({ x: s.x - minX, y: s.y - minY }));
  return {
    slots: shifted,
    width: Math.max(...shifted.map((s) => s.x)) + 1,
    height: Math.max(...shifted.map((s) => s.y)) + HEX_HEIGHT,
  };
}

/**
 * One side of the desktop figure, hugging the centre hexagon. Columns are
 * counted outwards from the centre and every other row steps outwards by
 * half a hexagon, as in the reference design; a short last row keeps to the
 * centre. One column up to 3 logos a side, two up to 8, then three.
 */
export function sideCluster(count: number, side: "left" | "right"): Cluster {
  const columns = count <= 3 ? 1 : count <= 8 ? 2 : 3;
  const slots: Slot[] = [];
  for (let index = 0; index < count; index++) {
    const row = Math.floor(index / columns);
    const fromCentre = index % columns;
    const outward = fromCentre * PITCH + (row % 2 === 1 ? PITCH / 2 : 0);
    slots.push({ x: side === "right" ? outward : -outward, y: row * ROW_PITCH });
  }
  return bounds(slots);
}

/** Lattice x positions for a row of three and for the offset row of two. */
const THREE = [0, PITCH, 2 * PITCH];
const TWO = [PITCH / 2, 1.5 * PITCH];

/** How tidy a figure's last row is: 0 is a full row, higher is worse. */
function lastRowScore(sizes: number[], count: number): number {
  const used = sizes.slice(0, -1).reduce((sum, size) => sum + size, 0);
  const last = sizes[sizes.length - 1]!;
  const left = count - used;
  if (left === last) return 0;
  if (last === 3 && left === 1) return 1; // one logo, centred under the gap
  if (last === 3 && left === 2) return 2; // the two outer slots
  return 3; // one logo in a row of two: off-centre
}

function rowSizes(count: number, first: 2 | 3): number[] {
  const sizes: number[] = [];
  let placed = 0;
  let size: number = first;
  while (placed < count) {
    sizes.push(size);
    placed += size;
    size = size === 3 ? 2 : 3;
  }
  return sizes;
}

/**
 * Phones and tablets: one honeycomb of alternating rows of three and two.
 * Starting with a row of three or of two, whichever leaves the tidier last
 * row, keeps every count, odd or even, symmetrical or nearly so.
 */
export function stackedCluster(count: number): Cluster {
  if (count === 0) return bounds([]);
  const fromThree = rowSizes(count, 3);
  const fromTwo = rowSizes(count, 2);
  const sizes = lastRowScore(fromTwo, count) < lastRowScore(fromThree, count) ? fromTwo : fromThree;

  const slots: Slot[] = [];
  let placed = 0;
  sizes.forEach((size, row) => {
    const left = Math.min(size, count - placed);
    let xs = size === 3 ? THREE : TWO;
    if (left < size) xs = size === 3 ? (left === 1 ? [PITCH] : [0, 2 * PITCH]) : [PITCH / 2];
    // A lone short row (two logos in all) has nothing to align with: close it up.
    if (sizes.length === 1 && left === 2) xs = TWO;
    for (const x of xs) slots.push({ x, y: row * ROW_PITCH });
    placed += left;
  });
  return bounds(slots);
}

/**
 * The desktop split: the first half of the logos to the left of the centre
 * hexagon, the second half to the right, and with an odd count the last one
 * centred beneath the centre hexagon, so the two sides always mirror.
 */
export function splitForDesktop<T>(items: T[]): { left: T[]; right: T[]; below: T | null } {
  const half = Math.floor(items.length / 2);
  return {
    left: items.slice(0, half),
    right: items.slice(half, half * 2),
    below: items.length % 2 === 1 ? items[items.length - 1]! : null,
  };
}
