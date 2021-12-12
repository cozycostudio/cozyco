import { vector, Vector } from "./geometry";

export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const goldenRatio = (1 + Math.sqrt(5)) / 2;

export function array(n: number) {
  return new Array(n).fill(0).map((_, i) => i);
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

export function lerpArray(input: number[], output: number[], progress: number) {
  if (input.length !== output.length) {
    throw Error("Lengths of input and output don't match");
  }
  return input.map((_, i) => lerp(input[i], output[i], progress));
}

export function damp(a: number, b: number, lambda: number, dt: number) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export function radToDeg(angle: number) {
  return (angle / TAU) * 360;
}

export function degToRad(angle: number) {
  return (angle / 360) * TAU;
}

export function modAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU;
}

export function lerpAngle(input: number, output: number, progress: number) {
  let diff = modAngle(output - input);
  if (diff > PI) {
    diff = -modAngle(input - output);
  }
  return input + diff * progress;
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

export function modularDist(value: number, mod: number) {
  return Math.min(value % mod, Math.abs(mod - (value % mod)));
}

export function fibonacci(num: number) {
  let a = 1;
  let b = 0;
  let temp: number;

  while (num >= 0) {
    temp = a;
    a = a + b;
    b = temp;
    num--;
  }

  return b;
}

export function reverseNumber(num: number, min: number, max: number) {
  return max + min - num;
}
