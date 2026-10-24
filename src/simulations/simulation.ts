import type { ParticleState, SimulationConfig } from './shared/attributes.ts';

const EPSILON = 1e-6;
export const DEFAULT_ATTRACTOR_RADIUS = 6;
export const DEFAULT_ATTRACTOR_DAMPING = 0.98;
export const DEFAULT_VORTEX_DAMPING = 0.99;

/**
 * CPU reference step for both modes. It is deterministic and mutates state in
 * place; the TSL kernels must reproduce this contract. The final attractor and
 * vortex formulas are confirmed by TV2 before the GPU kernels are ported.
 */
export function step(state: ParticleState, dt: number, config: SimulationConfig): ParticleState {
  if (!Number.isFinite(dt) || dt < 0) {
    throw new TypeError('dt must be a finite non-negative number');
  }
  if (!Number.isFinite(config.speed) || config.speed < 0) {
    throw new TypeError('speed must be a finite non-negative number');
  }

  const scaled = dt * config.speed;
  if (scaled === 0) return state;

  const radius = config.attractorRadius ?? DEFAULT_ATTRACTOR_RADIUS;
  const attractorDamping = config.attractorDamping ?? DEFAULT_ATTRACTOR_DAMPING;
  const vortexDamping = config.vortexDamping ?? DEFAULT_VORTEX_DAMPING;
  const { positions, velocities, ages, count } = state;
  const isAttractor = config.mode === 'attractor';

  for (let i = 0; i < count; i += 1) {
    const offset = i * 3;
    const x = positions[offset];
    const y = positions[offset + 1];
    const z = positions[offset + 2];
    // sqrt thay vì Math.hypot: kết quả IEEE ổn định giữa các engine/CPU,
    // cần cho golden test và đối chiếu số với kernel TSL (#10/#11).
    const r = Math.sqrt(x * x + y * y + z * z);

    if (r > EPSILON) {
      let vx = velocities[offset];
      let vy = velocities[offset + 1];
      let vz = velocities[offset + 2];

      // Tangent around +Y: normalize(-position) × (0, 1, 0) = (z/r, 0, -x/r).
      const tx = z / r;
      const tz = -x / r;
      vx += tx * config.strength * scaled;
      vz += tz * config.strength * scaled;

      if (isAttractor) {
        if (r > radius) {
          vx *= attractorDamping;
          vy *= attractorDamping;
          vz *= attractorDamping;
        }
      } else {
        vx *= vortexDamping;
        vy *= vortexDamping;
        vz *= vortexDamping;
      }

      positions[offset] = x + vx * scaled;
      positions[offset + 1] = y + vy * scaled;
      positions[offset + 2] = z + vz * scaled;
      velocities[offset] = vx;
      velocities[offset + 1] = vy;
      velocities[offset + 2] = vz;
    }

    ages[i] += scaled;
  }

  return state;
}
