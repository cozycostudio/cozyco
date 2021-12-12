import { vec2array, Vector, VectorArray } from "./geometry";

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
