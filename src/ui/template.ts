export function createLabMarkup(): string {
  return `
    <div class="lab-shell" id="lab-shell" data-runtime-phase="initializing">
      <aside class="rail" aria-label="Điều hướng">
        <div class="rail-brand" title="GPU Particle Lab">P<span>•</span></div>
        <div class="rail-icons">
          <div class="rail-icon selected" title="Particle Lab" aria-label="Particle Lab">✦</div>
          <div class="rail-icon" title="Tài liệu" aria-disabled="true">▤</div>
          <div class="rail-icon" title="Thí nghiệm" aria-disabled="true">⌁</div>
        </div>
        <div class="rail-bottom"><span class="rail-avatar">04</span></div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="breadcrumbs"><span>WORKSPACE</span><span class="slash">/</span><strong>GPU PARTICLE LAB</strong></div>
          <div class="top-actions">
            <span class="pill small"><span class="status-dot" aria-hidden="true"></span><span id="runtime-phase-label">INITIALIZING</span></span>
            <span class="top-version">3D-WEB-05</span>
          </div>
        </header>
        <div class="workspace-body">
          <main class="scene-column">
            <div class="scene-heading">
              <div><div class="eyebrow">INTERACTIVE PARTICLE SYSTEM</div><h1>Make motion <em>visible.</em></h1><p>Khám phá chuyển động của các hạt qua một giao diện trực quan.</p></div>
              <span class="chapter">01 / LAB VIEW</span>
            </div>
            <section class="runtime-notice" id="runtime-notice" data-tone="info" role="status" aria-live="polite" hidden>
              <strong id="runtime-notice-title"></strong>
              <span id="runtime-notice-message"></span>
            </section>
            <section class="scene-card" aria-label="Khu vực xem trước particle">
              <div class="grid-layer" aria-hidden="true"></div>
              <canvas id="preview-canvas" aria-label="Vùng hiển thị mô phỏng particle">Renderer chưa được kết nối.</canvas>
              <div class="scene-upper"><span class="pill green">PARTICLE LAB</span><span class="render-tag">SIMULATION VIEW</span></div>
              <div class="crosshair" aria-hidden="true">+</div>
              <div class="scene-bottom">
                <div><span class="scene-kicker">SIMULATION MODE</span><strong id="scene-mode">ATTRACTOR FIELD</strong></div>
                <div class="playback">
                  <button id="toggle-preview" data-runtime-control type="button" aria-label="Tạm dừng xem trước">Ⅱ</button>
                  <button id="reset-preview" data-runtime-control type="button" aria-label="Khởi tạo lại xem trước">↻</button>
                </div>
              </div>
            </section>
            <div class="scene-info" aria-live="polite">
              <div class="info-card"><span>BACKEND THỰC TẾ</span><strong id="actual-backend">Đang khởi tạo</strong><small id="backend-detail">Chờ trạng thái UI.</small></div>
              <div class="info-card"><span>FPS</span><strong id="runtime-fps">—</strong><small id="runtime-fps-detail">Chưa có số liệu.</small></div>
              <div class="info-card"><span>GPU TIMING</span><strong id="gpu-timing">Không khả dụng</strong><small id="gpu-timing-detail">Chờ tích hợp.</small></div>
            </div>
            <div class="integration-hint">ⓘ Trạng thái và số đo lấy từ renderer được kết nối. Khi renderer chưa sẵn sàng, bạn vẫn có thể chuẩn bị preset.</div>
          </main>
          <aside class="settings" aria-label="Bảng điều khiển particle">
            <div class="settings-head"><div><div class="eyebrow">EXPERIMENT SETTINGS</div><h2>Control panel</h2></div><span class="tool-icon" aria-hidden="true">⚙</span></div>
            <div class="panel-scroll">
              <section class="control-section">
                <div class="section-title"><span>01</span><h3>Simulation mode</h3></div>
                <div class="mode-switch" role="group" aria-label="Simulation mode">
                  <button class="mode-btn active" id="mode-attractor" data-runtime-control type="button" aria-pressed="true"><span aria-hidden="true">◎</span> Attractor</button>
                  <button class="mode-btn" id="mode-vortex" data-runtime-control type="button" aria-pressed="false"><span aria-hidden="true">◉</span> Vortex</button>
                </div>
                <p class="field-hint" id="mode-description">Particle chịu tác động của trường hút (minh họa).</p>
              </section>
              <section class="control-section">
                <div class="section-title"><span>02</span><h3>Particle properties</h3></div>
                <label for="particle-count" class="field-label"><span>Particle count</span><output id="particle-count-value" for="particle-count">20.000</output></label>
                <input id="particle-count" data-runtime-control type="range" min="1000" max="50000" step="1000" value="20000"><div class="scale"><span>1K</span><span>50K</span></div>
                <label for="speed" class="field-label"><span>Velocity / Speed</span><output id="speed-value" for="speed">1,2×</output></label>
                <input id="speed" data-runtime-control type="range" min="0.1" max="3" step="0.1" value="1.2"><div class="scale"><span>0.1×</span><span>3.0×</span></div>
                <label for="particle-size" class="field-label"><span>Particle size</span><output id="particle-size-value" for="particle-size">2,5 px</output></label>
                <input id="particle-size" data-runtime-control type="range" min="1" max="8" step="0.5" value="2.5"><div class="scale"><span>1</span><span>8</span></div>
                <label for="particle-color" class="field-label color-label"><span>Particle color</span><span class="color-row"><input id="particle-color" data-runtime-control type="color" value="#6ce6ff"><output id="particle-color-value" for="particle-color">#6CE6FF</output></span></label>
              </section>
              <section class="control-section">
                <div class="section-title"><span>03</span><h3>Force controls</h3></div>
                <label for="strength" class="field-label"><span id="strength-label">Attraction strength</span><output id="strength-value" for="strength">1,5</output></label>
                <input id="strength" data-runtime-control type="range" min="0.2" max="4" step="0.1" value="1.5"><div class="scale"><span>0.2</span><span>4.0</span></div>
              </section>
              <section class="control-section">
                <div class="section-title"><span>04</span><h3>Rendering preference</h3></div>
                <label for="backend" class="field-label">Backend được yêu cầu</label>
                <select id="backend"><option value="auto">Auto (ưu tiên WebGPU)</option><option value="webgpu">WebGPU</option><option value="webgl2">WebGL2</option></select>
                <p class="field-hint">Lựa chọn backend có hiệu lực ở lần khởi tạo renderer tiếp theo.</p>
              </section>
              <section class="control-section preset-section">
                <div class="section-title"><span>05</span><h3>Preset configuration</h3></div>
                <div class="preset-actions"><button type="button" id="export-preset" class="button primary">↓ Export JSON</button><button type="button" id="import-preset" class="button secondary">↑ Import</button></div>
                <input type="file" id="preset-file" accept=".json,application/json" hidden>
                <button type="button" id="restore-defaults" class="link-button">↻ Khôi phục mặc định</button>
              </section>
            </div>
            <div class="settings-foot"><span class="status-dot" aria-hidden="true"></span><span>LOCAL PREVIEW · TV4</span><span class="muted">v0.2</span></div>
          </aside>
        </div>
      </div>
    </div>
    <div id="toast" role="status" aria-live="polite" class="toast" hidden></div>
  `;
}
