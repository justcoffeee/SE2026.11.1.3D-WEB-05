import type { RendererPort, RendererTarget } from './core/renderer/RendererPort.ts';

export interface LabComposition {
  readonly createPort: () => RendererPort;
  readonly createTarget: () => RendererTarget;
  readonly mountUI: (port: RendererPort) => () => void;
}

/**
 * Composition root: initialize the renderer before the UI reads its status,
 * then mount the UI with the port it must drive.
 *
 * A failed init is not rethrown — `getStatus()` still reports `unavailable` and
 * `mountLabUI` renders the unsupported screen. The returned disposer is the
 * UI's idempotent one, so `beforeunload` disposes the port exactly once.
 */
export async function composeLab({
  createPort,
  createTarget,
  mountUI,
}: LabComposition): Promise<() => void> {
  const port = createPort();
  try {
    await port.init(createTarget());
  } catch {
    // Availability is read back from getStatus(); never surface init errors in the page.
  }
  return mountUI(port);
}
