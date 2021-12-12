import seedRandom from "seed-random";

export function createRandom(seed?: string) {
  let rng = Math.random;
  let currentSeed = seed || getRandomSeed();
  setSeed(currentSeed);

  function setSeed(seed: string) {
    rng = seedRandom(seed);
    currentSeed = seed;
  }

  function getSeed() {
    return currentSeed;
  }

  function getRandomSeed() {
    const min = 1000000000;
    const max = 9999999999;
    const seed = String(Math.floor(Math.random() * (max - min + 1) + min));
    return seed;
  }

  function value(a?: number, b?: number) {
    if (!a && a !== 0) return rng();
    if (!b && b !== 0) return rng() * a;
    if (a > b) [a, b] = [b, a];
    return a + rng() * (b - a);
  }

  function valueInt(a?: number, b?: number) {
    return ~~value(a, b);
  }

  function boolean() {
    return value() > 0.5;
  }

  return {
    seed,
    setSeed,
    getSeed,
    getRandomSeed,
    value,
    valueInt,
    boolean,
  };
}

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

export function vector(x: number, y: number, z = 0): Vector {
  return { x, y, z };
}

export function vectorAdd(v1: Vector, v2: Vector): Vector {
  return vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
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

export function lerp(input: number, output: number, progress: number) {
  return input + (output - input) * progress;
}

export function lerpVector(input: Vector, output: Vector, progress: number) {
  const x = lerp(input.x, output.x, progress);
  const y = lerp(input.y, output.y, progress);
  const z = lerp(input.z, output.y, progress);
  return vector(x, y, z);
}

export function map(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
  clamped = false
) {
  if (clamped) {
    return clamp(
      lerp(
        outputStart,
        outputEnd,
        (value - inputStart) / (inputEnd - inputStart)
      ),
      outputStart,
      outputEnd
    );
  }

  return lerp(
    outputStart,
    outputEnd,
    (value - inputStart) / (inputEnd - inputStart)
  );
}

export function clamp(input: number, min: number, max: number) {
  if (input < min) {
    return min;
  }
  if (input > max) {
    return max;
  }
  return input;
}

function polylineToSVGPath(polyline: VectorArray[]) {
  var commands: string[] = [];
  polyline.forEach(function (point, j) {
    var type = j === 0 ? "M" : "L";
    var x = point[0].toString();
    var y = point[1].toString();
    commands.push(`${type}${x} ${y}`);
  });
  return commands.join(" ");
}

function toAttrList(args: any[]) {
  return args
    .filter(Boolean)
    .map((attr) => `${attr[0]}="${attr[1]}"`)
    .join(" ");
}

interface PolylinesToSVGOptions {
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: string;
  lineJoin?: string;
  lineCap?: string;
}

export function polylinesToSVG(
  inputs: Vector[][],
  options: PolylinesToSVGOptions = {}
) {
  const paths = inputs.map((line) => line.map(vec2array));
  const svgPaths = paths.map(polylineToSVGPath);

  const fillColor = options.fillColor || "none";
  const strokeColor = options.strokeColor || "black";
  const lineWidth = options.lineWidth || "1";
  const lineJoin = options.lineJoin;
  const lineCap = options.lineCap;

  const pathElements = svgPaths
    .map((d) => `<path ${toAttrList([["d", d]])} />`)
    .join("");

  const groupAttrs = toAttrList([
    ["fill", fillColor],
    ["stroke", strokeColor],
    ["stroke-width", `${lineWidth}px`],
    lineJoin ? ["stroke-linejoin", lineJoin] : false,
    lineCap ? ["stroke-linecap", lineCap] : false,
  ]);

  return `<g ${groupAttrs}>${pathElements}</g>`;
}
