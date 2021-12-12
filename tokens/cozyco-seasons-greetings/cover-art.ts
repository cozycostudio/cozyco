import {
  createRandom,
  lerpVector,
  lerp,
  map,
  Path,
  polylinesToSVG,
  translatePaths,
  vector,
  Vector,
} from "./utils";

export function makeCoverArt(seed: string) {
  const rng = createRandom(seed);

  const background = "#F6E6D5";
  const foreground = "#1A1F1A";

  const width = 500;
  const height = 500;

  const marginX = width * 0.1;
  const marginY = height * 0.1;

  const layouts = [
    [2, 2, 10],
    [3, 2, 10],
    [3, 3, 5],
    [4, 3, 5],
    [4, 4, 5],
    [5, 5, 5],
  ];
  const [columns, rows, gap] = layouts[rng.valueInt(0, layouts.length - 1)];

  const treeW = (width - marginX * 2) / columns - gap * columns - 1;
  const treeH = (height - marginY * 2) / rows - gap * rows - 1;

  function makeTree(w: number, h: number, lineWidth: number): Path[] {
    const trunks: Path[] = [];
    const branches: Path[] = [];

    const treeWidth = rng.value(w * 0.5, w);
    const treeHeight = rng.value(h * 0.5, h);
    const cx = w / 2;
    const rotation = rng.value(2, 20);
    const branchVerticalLevels = rng.valueInt(30, 40);
    const branchUpwardsRotation = rng.boolean()
      ? 120 - rotation
      : 100 + rotation;
    const maxBranchWidth = treeWidth * rng.value(0.2, 0.5);
    const minBranchWidth = treeWidth / rng.value(20, 100);

    // make trunks
    const trunkThickness = rng.valueInt(2, 5);
    const trunkStartY = rng.value(0, treeHeight * 0.02);
    for (let i = 0; i < trunkThickness; i++) {
      const offset = i * lineWidth;
      const xAngle = rng.value(lineWidth * 3 * -1, lineWidth * 3);
      trunks.push([
        vector(cx + offset / 3, trunkStartY),
        vector(cx + offset + xAngle, rng.value(treeHeight * 0.98, treeHeight)),
      ]);
    }

    // make branches
    const bottomPadding = rng.value(treeHeight * 0.05, treeHeight * 0.3);
    const branchVertInc = (treeHeight - bottomPadding) / branchVerticalLevels;

    function makeBranch(p1: Vector, p2: Vector) {
      const x1 = p1.x;
      const y1 = p1.y;
      const x2 = p2.x;
      const y2 = (rng.value(100, 110) * p1.y) / branchUpwardsRotation;
      const numSubBranches = rng.valueInt(5, 10);

      for (let i = 0; i < numSubBranches; i++) {
        const startPos = rng.value(0, 0.5);
        const len = rng.value(0.1, 0.3);
        const v1 = vector(x1, y1);
        const v2 = vector(x2, y2);
        const start = lerpVector(v1, v2, startPos);
        const end = lerpVector(v1, v2, startPos + len);

        const size = Math.hypot(x2 - x1, y2 - y1);
        const maxRotation = map(size, minBranchWidth, maxBranchWidth, 1, 2);

        const startX = start.x;
        const startY = start.y;
        const endX = end.x;
        const endY = end.y + rng.value(maxRotation * -0.5, maxRotation);

        branches.push([vector(startX, startY), vector(endX, endY)]);
      }
    }

    for (let i = 0; i < branchVerticalLevels; i++) {
      const branchWidth = map(
        i,
        0,
        branchVerticalLevels - 1,
        maxBranchWidth,
        minBranchWidth
      );

      const yPos = treeHeight - bottomPadding - branchVertInc * i;
      // left side
      makeBranch(vector(cx, yPos), vector(cx - branchWidth, yPos));
      // right side
      makeBranch(vector(cx, yPos), vector(cx + branchWidth, yPos));
    }

    return translatePaths(
      [...trunks, ...branches],
      vector(0, (h - treeHeight) / 2)
    );
  }

  let polylines: Path[] = [];

  for (let row = 0; row < rows; row++) {
    const rIndex = rows <= 1 ? 0.5 : row / (rows - 1);
    for (let column = 0; column < columns; column++) {
      const cIndex = columns <= 1 ? 0.5 : column / (columns - 1);
      const tree = makeTree(treeW, treeH, 1);
      const treeCx = treeW / 2;
      const treeCy = treeH / 2;

      const translateX =
        lerp(treeCx + marginX, width - treeCx - marginX, cIndex) - treeCx;
      const translateY =
        lerp(treeCy + marginY, height - treeCy - marginY, rIndex) - treeCy;

      const treeLines = translatePaths(tree, vector(translateX, translateY));

      polylines.push(...treeLines);
    }
  }

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${background}" />
    ${polylinesToSVG(polylines, {
      strokeColor: foreground,
      lineCap: "round",
      lineWidth: `${2 / rows}`,
    })}
  </svg>`;
}
