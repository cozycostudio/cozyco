import seedRandom from "seed-random";
import SimplexNoise from "simplex-noise";

export type WeightedSet<T> = {
  value: T;
  weight: number;
}[];

export function createRandom(seed?: string) {
  let rng = Math.random;
  let noiseGenerator: SimplexNoise | undefined;
  let currentSeed = seed || getRandomSeed();
  setSeed(currentSeed);

  function setSeed(seed: string) {
    rng = seedRandom(seed);
    noiseGenerator = new SimplexNoise(rng);
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

  function shuffle<T>(arr: Array<T>) {
    let tmpArray = [...arr];
    for (let i = tmpArray.length - 1; i; i--) {
      let randomIndex = valueInt(i + 1);
      [tmpArray[i], tmpArray[randomIndex]] = [
        tmpArray[randomIndex],
        tmpArray[i],
      ];
    }
    return tmpArray;
  }

  function pick<T>(arr: Array<T>) {
    return arr[valueInt(0, arr.length - 1)];
  }

  function noise1D(x: number, frequency = 1, amplitude = 1) {
    if (!noiseGenerator) {
      return value();
    }
    return amplitude * noiseGenerator.noise2D(x * frequency, 0);
  }

  function noise2D(x: number, y: number, frequency = 1, amplitude = 1) {
    if (!noiseGenerator) {
      return value();
    }
    return amplitude * noiseGenerator.noise2D(x * frequency, y * frequency);
  }

  function noise3D(
    x: number,
    y: number,
    z: number,
    frequency = 1,
    amplitude = 1
  ) {
    if (!noiseGenerator) {
      return value();
    }
    return (
      amplitude *
      noiseGenerator.noise3D(x * frequency, y * frequency, z * frequency)
    );
  }

  function noise4D(
    x: number,
    y: number,
    z: number,
    w: number,
    frequency = 1,
    amplitude = 1
  ) {
    if (!noiseGenerator) {
      return value();
    }
    return (
      amplitude *
      noiseGenerator.noise4D(
        x * frequency,
        y * frequency,
        z * frequency,
        w * frequency
      )
    );
  }

  function weightedSet<T>(set: WeightedSet<T> = []) {
    if (set.length === 0) return null;
    return set[weightedSetIndex(set)].value;
  }

  function weightedSetIndex<T>(set: WeightedSet<T> = []): number {
    if (set.length === 0) return -1;
    return weighted(set.map((s) => s.weight));
  }

  function weighted(weights: number[] = []) {
    if (weights.length === 0) return -1;
    let totalWeight = 0;

    for (let i = 0; i < weights.length; i++) {
      totalWeight += weights[i];
    }

    if (totalWeight <= 0) throw new Error("Weights must sum to > 0");

    let random = value() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return i;
      }
      random -= weights[i];
    }
    return 0;
  }

  return {
    seed,
    setSeed,
    getSeed,
    getRandomSeed,
    value,
    valueInt,
    boolean,
    shuffle,
    pick,
    noise1D,
    noise2D,
    noise3D,
    noise4D,
    weighted,
    weightedSet,
    weightedSetIndex,
  };
}
