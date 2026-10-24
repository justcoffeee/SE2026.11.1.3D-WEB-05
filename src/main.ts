// Composition root: the only place that creates a renderer and hands it to the UI.
// No `three` and no concrete backend module here (fitness-checked).
import './ui/styles/main.css';
import './ui/styles/tokens.css';
import { composeLab } from './composition.ts';
import type { BackendPreference } from './core/types/backend.ts';
import type { RendererPort, RendererStatus, RendererTarget } from './core/renderer/RendererPort.ts';
import { mountLabUI } from './ui/app.ts';

/**
 * Placeholder port until #12 supplies `ThreeRendererAdapter`.
 *
 * It reports `unavailable` honestly, so the UI renders the unsupported screen
 * instead of a blank canvas or a made-up backend. Swap `createPort` in
 * `composeLab` when the adapter lands; nothing else in this file changes.
 */
function createUnavailableRenderer(): RendererPort {
  let requested: BackendPreference = 'auto';
  return {
    init: async () => 'unavailable',
    applyConfig: (config) => { requested = config.backendPreference; },
    start: () => {},
    pause: () => {},
    reset: () => {},
    getStatus: (): RendererStatus => ({
      requested,
      actual: 'unavailable',
      running: false,
      gpuTimingAvailable: false,
      fps: null,
      gpuTimeMs: null,
    }),
    dispose: () => {},
  };
}

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Không tìm thấy phần tử #app');

// ponytail: viewport target until #12 binds the real canvas; the adapter may re-measure.
const target: RendererTarget = {
  width: Math.max(1, Math.round(window.innerWidth)),
  height: Math.max(1, Math.round(window.innerHeight)),
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
};

void composeLab({
  createPort: createUnavailableRenderer,
  createTarget: () => target,
  mountUI: (port) => mountLabUI(root, port),
}).then((dispose) => {
  window.addEventListener('beforeunload', dispose, { once: true });
});
