import { degToRad } from "./math";

export type VectorArray = [number, number, number];

export interface Vector {
  x: number;
  y: number;
  z: number;
}

export type Path = Vector[];

export function vec2array(vec: Vector): VectorArray {
  return [vec.x, vec.y, vec.z];
}

export function array2vec(vec: VectorArray): Vector {
  return vector(vec[0], vec[1], vec[2] || 0);
}

export function vector(x: number, y: number, z = 0): Vector {
  return { x, y, z };
}

export function vectorAdd(v1: Vector, v2: Vector): Vector {
  return vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

export function vectorSubtract(v1: Vector, v2: Vector): Vector {
  return vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

export function vectorMultiply(v1: Vector, v2: Vector): Vector {
  return vector(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);
}

export function vectorDivide(v1: Vector, v2: Vector): Vector {
  return vector(v1.x / v2.x, v1.y / v2.y, v1.z / v2.z);
}

export function vectorDistance(v1: Vector, v2: Vector): number {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  const dz = v1.z - v2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function translateVector(v: Vector, t: Vector): Vector {
  return vectorAdd(v, t);
}

export function translatePath(line: Path, t: Vector): Path {
  return line.map((v) => translateVector(v, t));
}

export function translatePaths(lines: Path[], t: Vector): Path[] {
  return lines.map((line) => translatePath(line, t));
}

export function scaleVector(v: Vector, scale: number): Vector {
  return vectorMultiply(v, vector(scale, scale, scale));
}

export function scalePath(line: Path, scale: number): Path {
  return line.map((v) => scaleVector(v, scale));
}

export function scalePaths(lines: Path[], scale: number): Path[] {
  return lines.map((line) => scalePath(line, scale));
}

export type BoundingBox = [Vector, Vector];

export function makeBoundingBox(p1: Vector, p2: Vector): BoundingBox {
  return [p1, p2];
}

export function makeBoxPolylines(bbox: BoundingBox): Path {
  const [{ x: l, y: t }, { x: r, y: v2 }] = bbox;
  return [
    vector(l, t),
    vector(r, t),
    vector(r, v2),
    vector(l, v2),
    vector(l, t),
  ];
}

export function rotateVectorX(v: Vector, angle: number): Vector {
  const cos = Math.cos(degToRad(angle));
  const sin = Math.sin(degToRad(angle));
  const y = v.y * cos - v.z * sin;
  const z = v.z * cos + v.y * sin;
  return vector(v.x, y, z);
}

export function rotateVectorY(v: Vector, angle: number): Vector {
  const cos = Math.cos(degToRad(angle));
  const sin = Math.sin(degToRad(angle));
  const x = v.x * cos - v.z * sin;
  const z = v.z * cos + v.x * sin;
  return vector(x, v.y, z);
}

export function rotateVectorZ(v: Vector, angle: number): Vector {
  const cos = Math.cos(degToRad(angle));
  const sin = Math.sin(degToRad(angle));
  const x = v.x * cos - v.y * sin;
  const y = v.y * cos + v.x * sin;
  return vector(x, y, v.z);
}

export function rotateVector3D(v: Vector, angleVector: Vector): Vector {
  const zRotate = rotateVectorZ(v, angleVector.z);
  const yRotate = rotateVectorY(zRotate, angleVector.y);
  const xRotate = rotateVectorX(yRotate, angleVector.x);
  return xRotate;
}

export type GridMap = Map<string, Vector>;

export function gridMapKey(x: number, y: number) {
  return `${x},${y}`;
}

export function gridMapVectorFromKey(key: string) {
  const [x, y] = key.split(",");
  return vector(parseInt(x, 10), parseInt(y, 10));
}

export function gridMapToPaths(gridMap: GridMap): Path[] {
  const gridSize = Math.sqrt(gridMap.size);
  const paths: Path[] = [];
  for (let [key, tl] of gridMap) {
    const gridPos = gridMapVectorFromKey(key);
    if (gridPos.x < gridSize - 1 && gridPos.y < gridSize - 1) {
      const path: Path = [];
      const tr = gridMap.get(gridMapKey(gridPos.x + 1, gridPos.y));
      const br = gridMap.get(gridMapKey(gridPos.x + 1, gridPos.y + 1));
      const bl = gridMap.get(gridMapKey(gridPos.x, gridPos.y + 1));

      // Add left and top path for every grid coordinate.
      // If we're at the bottom, prepend the bottom line.
      // If we're at the right, append the right line.
      // This avoids duplicate paths.
      // Draw order: br -> bl -> tl -> tr -> br
      if (gridPos.y === gridSize - 2 && br) path.push(vector(br.x, br.y, br.z));
      if (bl) path.push(vector(bl.x, bl.y, bl.z));
      path.push(vector(tl.x, tl.y, tl.z));
      if (tr) path.push(vector(tr.x, tr.y, tr.z));
      if (gridPos.x === gridSize - 2 && br) path.push(vector(br.x, br.y, br.z));
      paths.push(path);
    }
  }
  return paths;
}

export function curvePath(
  path: Path,
  tension = 0.5,
  numOfSegments = 16,
  isClosed = false
): Path {
  const line = path.slice(0);
  const curve: Path = [];

  // If closed, copy end point to the start, and start point to the end
  // If open, copy start and end point in place
  if (isClosed) {
    line.unshift(path[path.length - 1]);
    line.unshift(path[path.length - 2]);
    line.push(path[0]);
  } else {
    line.unshift(path[0]);
    line.push(path[path.length - 1]);
  }

  for (let point = 1; point < line.length - 2; point++) {
    for (let seg = 0; seg <= numOfSegments; seg++) {
      const step = seg / numOfSegments;

      // tension vectors
      const t1 = vector(
        (line[point + 1].x - line[point - 1].x) * tension,
        (line[point + 1].y - line[point - 1].y) * tension
      );
      const t2 = vector(
        (line[point + 2].x - line[point].x) * tension,
        (line[point + 2].y - line[point].y) * tension
      );

      // calc cardinals
      const c1 = 2 * Math.pow(step, 3) - 3 * Math.pow(step, 2) + 1;
      const c2 = -(2 * Math.pow(step, 3)) + 3 * Math.pow(step, 2);
      const c3 = Math.pow(step, 3) - 2 * Math.pow(step, 2) + step;
      const c4 = Math.pow(step, 3) - Math.pow(step, 2);

      // calc x and y cords with control vectors
      const x =
        c1 * line[point].x + c2 * line[point + 1].x + c3 * t1.x + c4 * t2.x;
      const y =
        c1 * line[point].y + c2 * line[point + 1].y + c3 * t1.y + c4 * t2.y;

      //store points in array
      curve.push(vector(x, y));
    }
  }

  return curve;
}
