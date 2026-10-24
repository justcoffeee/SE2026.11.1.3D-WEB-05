import { byId } from '../dom.ts';
import { formatFps, formatGpuTiming } from '../state/runtimeState.ts';
import type { UiRuntimeState } from '../state/runtimeState.ts';

const phaseLabels: Record<UiRuntimeState['phase'], string> = {
  ready: 'READY', fallback: 'FALLBACK ACTIVE',
  unsupported: 'UNSUPPORTED', error: 'RENDERER ERROR',
};

export function renderRuntimeStatus(state: UiRuntimeState): void {
  const shell = byId<HTMLElement>('lab-shell');
  shell.dataset.runtimePhase = state.phase;
  byId<HTMLElement>('runtime-phase-label').textContent = phaseLabels[state.phase];
  byId<HTMLElement>('actual-backend').textContent = state.backendLabel;
  byId<HTMLElement>('backend-detail').textContent = state.backendDetail;
  byId<HTMLElement>('runtime-fps').textContent = formatFps(state);
  byId<HTMLElement>('runtime-fps-detail').textContent = state.fpsDetail;
  byId<HTMLElement>('gpu-timing').textContent = formatGpuTiming(state);
  byId<HTMLElement>('gpu-timing-detail').textContent = state.gpuTimingDetail;

  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('[data-runtime-control]').forEach(control => {
    control.disabled = state.controlsDisabled;
  });

  const notice = byId<HTMLElement>('runtime-notice');
  if (!state.notice) {
    notice.hidden = true;
    return;
  }
  notice.hidden = false;
  notice.dataset.tone = state.notice.tone;
  notice.setAttribute('role', state.notice.tone === 'error' ? 'alert' : 'status');
  byId<HTMLElement>('runtime-notice-title').textContent = state.notice.title;
  byId<HTMLElement>('runtime-notice-message').textContent = state.notice.message;
}
