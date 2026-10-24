import { Fn, If, instanceIndex, vec3 } from 'three/tsl';
import type { ParticleBuffers } from './particleBuffers.ts';

/**
 * Attractor compute kernel. The CPU reference for the same formula is
 * `step()` in `../simulation.ts`; `delta` must already be `dt * speed`.
 */
export function createAttractorKernel(system: ParticleBuffers) {
  const { positions, velocities, ages, uniforms, count } = system;

  return Fn(() => {
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);
    const age = ages.element(instanceIndex);

    // Guard giống reference step: hạt đúng tâm thì không chuyển động (tránh 0/0),
    // nhưng age vẫn tăng ở ngoài guard.
    const distance = position.length();
    If(distance.greaterThan(1e-6), () => {
      const toCenter = position.negate().normalize();
      const tangent = toCenter.cross(vec3(0, 1, 0));

      velocity.addAssign(tangent.mul(uniforms.strength).mul(uniforms.delta));
      If(distance.greaterThan(uniforms.radius), () => {
        velocity.assign(velocity.mul(uniforms.damping));
      });
      position.addAssign(velocity.mul(uniforms.delta));
    });
    age.addAssign(uniforms.delta);
  })()
    .compute(count)
    .setName('Attractor');
}
