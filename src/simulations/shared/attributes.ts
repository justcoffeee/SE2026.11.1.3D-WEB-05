/**
 * Shared particle attribute layout and deterministic initial state.
 * The layout is backend-agnostic: the renderer adapter maps these arrays to
 * GPU storage buffers. No DOM and no `three` import belong here.
 */

export type SimulationMode = 'attractor' | 'vortex';

export interface SimulationConfig {
  readonly mode: SimulationMode;
  readonly particleCount: number;
  readonly speed: number;
  readonly strength: number;
  readonly spawnRadius?: number;
  readonly attractorRadius?: number;
  readonly attractorDamping?: number;
  readonly vortexDamping?: number;
}

export interface ParticleState {
  readonly count: number;
  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly ages: Float32Array;
  readonly seeds: Uint32Array;
}

/** One shared attribute set for both backends (architecture.md §4). */
export const PARTICLE_ATTRIBUTES = Object.freeze({
  position: { itemSize: 3, array: 'positions' },
  velocity: { itemSize: 3, array: 'velocities' },
  age: { itemSize: 1, array: 'ages' },
  seed: { itemSize: 1, array: 'seeds' },
} as const);

export const DEFAULT_SPAWN_RADIUS = 10;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 0x100000000;
  };
}

function assertConfig(config: SimulationConfig): void {
  if (!Number.isInteger(config.particleCount) || config.particleCount < 0) {
    throw new TypeError('particleCount must be a non-negative integer');
  }
  if (!Number.isFinite(config.speed) || config.speed <= 0) {
    throw new TypeError('speed must be a finite positive number');
  }
  if (!Number.isFinite(config.strength) || config.strength < 0) {
    throw new TypeError('strength must be a finite non-negative number');
  }
  if (config.spawnRadius !== undefined && (!Number.isFinite(config.spawnRadius) || config.spawnRadius < 0)) {
    throw new TypeError('spawnRadius must be a finite non-negative number');
  }
}

/** Deterministic initial state: the same (config, seed) always produces the same arrays. */
export function createState(config: SimulationConfig, seed = 1): ParticleState {
  assertConfig(config);
  const count = config.particleCount;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const ages = new Float32Array(count);
  const seeds = new Uint32Array(count);
  const random = mulberry32(seed);
  const spawnRadius = config.spawnRadius ?? DEFAULT_SPAWN_RADIUS;

  for (let i = 0; i < count; i += 1) {
    const theta = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const ring = Math.sqrt(1 - z * z);
    const radius = spawnRadius * Math.cbrt(random());
    const offset = i * 3;
    positions[offset] = Math.cos(theta) * ring * radius;
    positions[offset + 1] = z * radius;
    positions[offset + 2] = Math.sin(theta) * ring * radius;
    seeds[i] = Math.floor(random() * 0x100000000) >>> 0;
  }

  return { count, positions, velocities, ages, seeds };
}
