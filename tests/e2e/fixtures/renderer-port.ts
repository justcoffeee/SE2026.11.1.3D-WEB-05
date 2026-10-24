import '../../../src/ui/styles/main.css';
import '../../../src/ui/styles/tokens.css';
import { mountLabUI } from '../../../src/ui/app.ts';
import { FakeRenderer } from '../../support/fakeRenderer.ts';
import type { RendererStatus } from '../../../src/core/renderer/RendererPort.ts';

declare global {
  interface Window {
    initialRendererApplyFailure?: boolean;
    uiTest: {
      port: FakeRenderer; unmount: () => void; finishImport?: () => void;
      setStatus: (status: Partial<RendererStatus>) => void;
      setFailure: (failed: boolean) => void;
    };
  }
}

class ControlledRenderer extends FakeRenderer {
  statusPatch: Partial<RendererStatus> = {};
  failed = false;

  override getStatus(): RendererStatus {
    if (this.failed) throw new Error('internal test failure');
    return { ...super.getStatus(), ...this.statusPatch };
  }

  override applyConfig(...args: Parameters<FakeRenderer['applyConfig']>): void {
    if (window.initialRendererApplyFailure) throw new Error('internal apply failure');
    super.applyConfig(...args);
  }
}

const port = new ControlledRenderer({
  actual: 'webgpu', requested: 'auto', running: true, gpuTimingAvailable: false,
});
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing test root');
window.uiTest = {
  port, unmount: mountLabUI(root, port),
  setStatus: (status) => { port.statusPatch = { ...port.statusPatch, ...status }; },
  setFailure: (failed) => { port.failed = failed; },
};
