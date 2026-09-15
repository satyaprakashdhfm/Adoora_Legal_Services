"""
Slice a composite image — several photographs laid out in a grid with white
dividers drawn between them — into one file per frame.

    python scripts/slice-strip.py <composite> <cols> <rows> <name> [<name> ...]

Frames are written to apps/web/public/<name>.png in reading order (left to
right, then top to bottom). Cuts are made on the dividers, not at exact
fractions: an even split keeps a few pixels of the white gutter, and the edge
of the neighbouring photograph, at the side of every card.

    python scripts/slice-strip.py resources/insights-strip-2.png 3 1 \
        insight-dpdp insight-section-9 insight-cci

Needs Pillow (`pip install pillow`).
"""

import statistics
import sys
from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "apps" / "web" / "public"


def gutter_runs(im, axis):
    """Near-white, low-variation lines: the dividers. axis 0 scans columns."""
    w, h = im.size
    n, other = (w, h) if axis == 0 else (h, w)
    step = max(1, other // 40)
    flags = []
    for i in range(n):
        line = [
            im.getpixel((i, j) if axis == 0 else (j, i)) for j in range(0, other, step)
        ]
        lum = [sum(p) / 3 for p in line]
        flags.append(sum(lum) / len(lum) > 238 and statistics.pstdev(lum) < 12)

    runs, start = [], None
    for i, flag in enumerate(flags):
        if flag and start is None:
            start = i
        elif not flag and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, n))
    return runs


def segments(im, axis, expected):
    n = im.size[axis]
    runs = gutter_runs(im, axis)
    # A white margin around the whole composite is trimmed too.
    lead = next((r[1] for r in runs if r[0] == 0), 0)
    trail = next((r[0] for r in runs if r[1] == n), n)
    interior = [r for r in runs if r[0] > 0 and r[1] < n and r[1] - r[0] >= 2]

    if len(interior) != expected - 1:
        print(
            f"  axis {axis}: found {len(interior)} dividers, expected {expected - 1};"
            " splitting evenly"
        )
        size = (trail - lead) // expected
        return [(lead + i * size, lead + (i + 1) * size) for i in range(expected)]

    bounds, prev = [], lead
    for a, b in interior:
        bounds.append((prev, a))
        prev = b
    bounds.append((prev, trail))
    return bounds


def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    source, cols, rows, *names = sys.argv[1:]
    cols, rows = int(cols), int(rows)
    if len(names) != cols * rows:
        sys.exit(f"Expected {cols * rows} names, got {len(names)}")

    im = Image.open(source).convert("RGB")
    xs, ys = segments(im, 0, cols), segments(im, 1, rows)
    for r in range(rows):
        for c in range(cols):
            box = (xs[c][0], ys[r][0], xs[c][1], ys[r][1])
            dest = PUBLIC / f"{names[r * cols + c]}.png"
            im.crop(box).save(dest, optimize=True)
            print(f"  wrote {dest.relative_to(PUBLIC.parent.parent.parent)} {box[2] - box[0]}x{box[3] - box[1]}")


if __name__ == "__main__":
    main()
