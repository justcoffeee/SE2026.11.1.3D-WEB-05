import '../../../src/ui/styles/main.css';
import '../../../src/ui/styles/tokens.css';
import { composeLab } from '../../../src/composition.ts';
import { mountLabUI } from '../../../src/ui/app.ts';
import { FakeRenderer } from '../../support/fakeRenderer.ts';

declare global {
  interface Window {
    uiTest: { port: FakeRenderer; unmount: () => void; finishImport?: () => void };
  }
}

const TARGET = { width: 800, height: 600, pixelRatio: 1 };

const fixture = new URLSearchParams(window.location.search).get('uiState');
class ErrorRenderer extends FakeRenderer {
  override getStatus(): never { throw new Error('internal fixture failure'); }
}
class ApplyErrorRenderer extends FakeRenderer {
  override applyConfig(): never { throw new Error('internal apply failure'); }
}
const port = fixture === 'error' ? new ErrorRenderer() : fixture === 'apply-error'
  ? new ApplyErrorRenderer({ actual: 'webgpu', running: true }) : new FakeRenderer({
  actual: fixture === 'unsupported' ? 'unavailable' : fixture === 'fallback-webgl2' ? 'webgl2' : 'webgpu',
  requested: 'auto', running: true, gpuTimingAvailable: false,
});
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing test root');
const unmount = await composeLab({
  createPort: () => port,
  createTarget: () => TARGET,
  mountUI: (injected) => mountLabUI(root, injected),
});
window.uiTest = { port, unmount };
