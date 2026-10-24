import type { ActualBackend, BackendPreference } from '../../core/types/backend.ts';

/** Results of probing the backends available in the current environment. */
export interface BackendCapabilities {
  readonly webgpu: boolean;
  readonly webgl2: boolean;
}

/** A probe can be synchronous (for WebGL2) or asynchronous (for WebGPU). */
export type CapabilityProbe = () => boolean | Promise<boolean>;

/** Platform-specific checks are supplied by the caller, keeping this module DOM-free. */
export interface BackendCapabilityProbes {
  readonly webgpu: CapabilityProbe;
  readonly webgl2: CapabilityProbe;
}

/**
 * Runs both injected probes concurrently. A failed probe is treated as an
 * unavailable capability so one platform check cannot prevent the other
 * backend from being selected.
 */
export async function probeBackendCapabilities(
  probes: BackendCapabilityProbes,
): Promise<BackendCapabilities> {
  const safelyProbe = async (probe: CapabilityProbe): Promise<boolean> => {
    try {
      return await probe();
    } catch {
      return false;
    }
  };

  const [webgpu, webgl2] = await Promise.all([
    safelyProbe(probes.webgpu),
    safelyProbe(probes.webgl2),
  ]);

  return { webgpu, webgl2 };
}

/**
 * Resolves a user preference to the backend that can actually run.
 *
 * `auto` prefers WebGPU and falls back to WebGL2. An explicit WebGL2 choice
 * never selects WebGPU. An explicit WebGPU choice falls back to WebGL2 if the
 * WebGPU probe is unavailable.
 */
export function resolveBackend(
  preference: BackendPreference,
  capabilities: BackendCapabilities,
): ActualBackend {
  switch (preference) {
    case 'auto':
      if (capabilities.webgpu) return 'webgpu';
      return capabilities.webgl2 ? 'webgl2' : 'unavailable';

    case 'webgpu':
      if (capabilities.webgpu) return 'webgpu';
      return capabilities.webgl2 ? 'webgl2' : 'unavailable';

    case 'webgl2':
      return capabilities.webgl2 ? 'webgl2' : 'unavailable';
  }
}
