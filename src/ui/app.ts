import { DEFAULT_CONFIG, downloadPreset, parsePreset } from '../presets/preset.ts';
import type { LabConfig } from '../presets/preset.ts';
import { createParticlePreview } from './mock/particlePreview.ts';

const number = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);
const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Thiếu phần tử UI: ${id}`);
  return el as T;
};

export function mountLabUI(root: HTMLElement): void {
  let config: LabConfig = { ...DEFAULT_CONFIG };
  root.innerHTML = `
    <div class="lab-shell">
      <aside class="rail" aria-label="Điều hướng">
        <div class="rail-brand" title="GPU Particle Lab">P<span>•</span></div>
        <div class="rail-icons"><div class="rail-icon selected" title="Particle Lab" aria-label="Particle Lab">✦</div><div class="rail-icon" title="Tài liệu">▤</div><div class="rail-icon" title="Thí nghiệm">⌁</div></div>
        <div class="rail-bottom"><span class="rail-avatar">04</span></div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="breadcrumbs"><span>WORKSPACE</span><span class="slash">/</span><strong>GPU PARTICLE LAB</strong></div>
          <div class="top-actions"><span class="pill small"><span class="status-dot"></span> UI PROTOTYPE · WEEK 01</span><span class="top-version">3D-WEB-05</span></div>
        </header>
        <div class="workspace-body">
          <main class="scene-column">
            <div class="scene-heading"><div><div class="eyebrow">INTERACTIVE PARTICLE SYSTEM</div><h1>Make motion <em>visible.</em></h1><p>Khám phá chuyển động của các hạt qua một giao diện trực quan.</p></div><span class="chapter">01 / LAB VIEW</span></div>
            <section class="scene-card" aria-label="Khu vực xem trước particle">
              <div class="grid-layer" aria-hidden="true"></div>
              <canvas id="preview-canvas" aria-label="Bản xem trước particle bằng Canvas 2D"></canvas>
              <div class="scene-upper"><span class="pill green">● PREVIEW ACTIVE</span><span class="render-tag">CANVAS 2D DEMO · NOT GPU</span></div>
              <div class="crosshair" aria-hidden="true">+</div>
              <div class="scene-bottom"><div><span class="scene-kicker">SIMULATION MODE</span><strong id="scene-mode">ATTRACTOR FIELD</strong></div><div class="playback"><button id="toggle-preview" type="button" aria-label="Tạm dừng xem trước">Ⅱ</button><button id="reset-preview" type="button" aria-label="Khởi tạo lại xem trước">↻</button></div></div>
            </section>
            <div class="scene-info"><div class="info-card"><span>BACKEND THỰC TẾ</span><strong>Canvas 2D (mockup)</strong><small>Chưa kết nối Three.js / GPU</small></div><div class="info-card"><span>FPS XEM TRƯỚC</span><strong id="preview-fps">—</strong><small>Chỉ đo Canvas 2D, không phải benchmark</small></div><div class="info-card"><span>GPU TIMING</span><strong>Không khả dụng</strong><small>Chờ TV5 tích hợp</small></div></div>
            <div class="integration-hint">ⓘ Đây là bản <strong>UI prototype tuần 1</strong>. Các lựa chọn backend, số lượng particle và simulation mode đang phục vụ thiết kế tương tác. Chưa có WebGPU/WebGL2 thực tế.</div>
          </main>
          <aside class="settings" aria-label="Bảng điều khiển particle">
            <div class="settings-head"><div><div class="eyebrow">EXPERIMENT SETTINGS</div><h2>Control panel</h2></div><span class="tool-icon">⚙</span></div>
            <div class="panel-scroll">
              <section class="control-section"><div class="section-title"><span>01</span><h3>Simulation mode</h3></div><div class="mode-switch" role="group" aria-label="Simulation mode"><button class="mode-btn active" id="mode-attractor" type="button" aria-pressed="true"><span>◎</span> Attractor</button><button class="mode-btn" id="mode-vortex" type="button" aria-pressed="false"><span>◉</span> Vortex</button></div><p class="field-hint" id="mode-description">Particle chịu tác động của trường hút (minh họa).</p></section>
              <section class="control-section"><div class="section-title"><span>02</span><h3>Particle properties</h3></div>
                <label for="particle-count" class="field-label"><span>Particle count</span><output id="particle-count-value">20.000</output></label><input id="particle-count" type="range" min="1000" max="50000" step="1000" value="20000" /><div class="scale"><span>1K</span><span>50K</span></div>
                <label for="speed" class="field-label"><span>Velocity / Speed</span><output id="speed-value">1,2×</output></label><input id="speed" type="range" min="0.1" max="3" step="0.1" value="1.2" /><div class="scale"><span>0.1×</span><span>3.0×</span></div>
                <label for="particle-size" class="field-label"><span>Particle size</span><output id="particle-size-value">2,5 px</output></label><input id="particle-size" type="range" min="1" max="8" step="0.5" value="2.5" /><div class="scale"><span>1</span><span>8</span></div>
                <label for="particle-color" class="field-label color-label"><span>Particle color</span><span class="color-row"><input id="particle-color" type="color" value="#6ce6ff" /><output id="particle-color-value">#6CE6FF</output></span></label>
              </section>
              <section class="control-section"><div class="section-title"><span>03</span><h3>Force controls</h3></div><label for="strength" class="field-label"><span id="strength-label">Attraction strength</span><output id="strength-value">1,5</output></label><input id="strength" type="range" min="0.2" max="4" step="0.1" value="1.5" /><div class="scale"><span>0.2</span><span>4.0</span></div></section>
              <section class="control-section"><div class="section-title"><span>04</span><h3>Rendering preference</h3></div><label for="backend" class="field-label">Backend được yêu cầu</label><select id="backend"><option value="auto">Auto (ưu tiên WebGPU)</option><option value="webgpu">WebGPU</option><option value="webgl2">WebGL2</option></select><p class="field-hint">Lựa chọn này chưa đổi backend thật. TV1 và TV3 sẽ tích hợp.</p></section>
              <section class="control-section preset-section"><div class="section-title"><span>05</span><h3>Preset configuration</h3></div><div class="preset-actions"><button type="button" id="export-preset" class="button primary">↓ Export JSON</button><button type="button" id="import-preset" class="button secondary">↑ Import</button></div><input type="file" id="preset-file" accept=".json,application/json" hidden /><button type="button" id="restore-defaults" class="link-button">↻ Khôi phục mặc định</button></section>
            </div>
            <div class="settings-foot"><span class="status-dot"></span><span>LOCAL PREVIEW · TV4</span><span class="muted">v0.1</span></div>
          </aside>
        </div>
      </div>
    </div>
    <div id="toast" role="status" aria-live="polite" class="toast" hidden></div>
  `;

  const preview = createParticlePreview(byId<HTMLCanvasElement>('preview-canvas'), () => config);
  const formatOne = (n: number) => number(n);
  let toastTimer: number | undefined;
  const notify = (message: string, isError = false) => {
    const toast = byId<HTMLDivElement>('toast');
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4500);
  };

  const syncControls = () => {
    byId<HTMLInputElement>('particle-count').value = String(config.particleCount);
    byId<HTMLInputElement>('speed').value = String(config.speed);
    byId<HTMLInputElement>('particle-size').value = String(config.particleSize);
    byId<HTMLInputElement>('particle-color').value = config.particleColor;
    byId<HTMLInputElement>('strength').value = String(config.strength);
    byId<HTMLSelectElement>('backend').value = config.backendPreference;
    byId<HTMLOutputElement>('particle-count-value').textContent = number(config.particleCount);
    byId<HTMLOutputElement>('speed-value').textContent = `${formatOne(config.speed)}×`;
    byId<HTMLOutputElement>('particle-size-value').textContent = `${formatOne(config.particleSize)} px`;
    byId<HTMLOutputElement>('particle-color-value').textContent = config.particleColor.toUpperCase();
    byId<HTMLOutputElement>('strength-value').textContent = formatOne(config.strength);
    byId<HTMLElement>('strength-label').textContent = config.mode === 'attractor' ? 'Attraction strength' : 'Vortex strength';
    byId<HTMLElement>('mode-description').textContent = config.mode === 'attractor'
      ? 'Particle chịu tác động của trường hút (minh họa).'
      : 'Particle xoáy quanh tâm (minh họa).';
    byId<HTMLElement>('scene-mode').textContent = config.mode === 'attractor' ? 'ATTRACTOR FIELD' : 'VORTEX FIELD';
    (['attractor', 'vortex'] as const).forEach(mode => {
      const button = byId<HTMLButtonElement>(`mode-${mode}`);
      button.classList.toggle('active', config.mode === mode);
      button.setAttribute('aria-pressed', String(config.mode === mode));
    });
  };

  const registerSlider = (id: string, key: 'particleCount' | 'speed' | 'particleSize' | 'strength') => {
    byId<HTMLInputElement>(id).addEventListener('input', event => {
      config = { ...config, [key]: Number((event.target as HTMLInputElement).value) };
      syncControls();
      if (key === 'particleCount') preview.reset();
    });
  };
  registerSlider('particle-count', 'particleCount');
  registerSlider('speed', 'speed');
  registerSlider('particle-size', 'particleSize');
  registerSlider('strength', 'strength');

  byId<HTMLInputElement>('particle-color').addEventListener('input', event => {
    config = { ...config, particleColor: (event.target as HTMLInputElement).value };
    syncControls();
  });
  byId<HTMLSelectElement>('backend').addEventListener('change', event => {
    config = { ...config, backendPreference: (event.target as HTMLSelectElement).value as LabConfig['backendPreference'] };
    syncControls();
    notify('Đã lưu lựa chọn backend vào UI. Engine thật chưa được kết nối.');
  });
  (['attractor', 'vortex'] as const).forEach(mode => {
    byId<HTMLButtonElement>(`mode-${mode}`).addEventListener('click', () => {
      config = { ...config, mode };
      syncControls();
      preview.reset();
    });
  });
  byId<HTMLButtonElement>('toggle-preview').addEventListener('click', () => {
    const running = preview.toggle();
    byId<HTMLButtonElement>('toggle-preview').textContent = running ? 'Ⅱ' : '▶';
    byId<HTMLButtonElement>('toggle-preview').setAttribute('aria-label', running ? 'Tạm dừng xem trước' : 'Tiếp tục xem trước');
  });
  byId<HTMLButtonElement>('reset-preview').addEventListener('click', () => preview.reset());
  byId<HTMLButtonElement>('export-preset').addEventListener('click', () => {
    try { downloadPreset(config); notify('Đã xuất preset JSON.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Không thể xuất preset.', true); }
  });
  byId<HTMLButtonElement>('import-preset').addEventListener('click', () => byId<HTMLInputElement>('preset-file').click());
  byId<HTMLInputElement>('preset-file').addEventListener('change', async event => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Tệp preset vượt quá 1 MB.');
      const imported = parsePreset(await file.text());
      config = imported;
      syncControls();
      preview.reset();
      notify('Import preset thành công.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể đọc preset.', true);
    } finally { input.value = ''; }
  });
  byId<HTMLButtonElement>('restore-defaults').addEventListener('click', () => {
    config = { ...DEFAULT_CONFIG };
    syncControls();
    preview.reset();
    notify('Đã khôi phục cấu hình mặc định.');
  });
  syncControls();
  window.setInterval(() => {
    const fps = preview.getFps();
    byId<HTMLElement>('preview-fps').textContent = fps === null ? '—' : `${fps} FPS`;
  }, 800);
}
