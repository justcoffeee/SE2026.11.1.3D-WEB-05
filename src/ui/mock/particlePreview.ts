import type { LabConfig } from '../../presets/preset.ts';

interface PreviewParticle { angle: number; radius: number; phase: number; opacity: number; size: number; }

/**
 * Canvas 2D mô phỏng hình ảnh CHỈ CHO UI DEMO, KHÔNG phải mô phỏng WebGPU/WebGL2.
 * TV2/TV3 sẽ thay module này bằng renderer và state thực khi tích hợp.
 */
export function createParticlePreview(canvas: HTMLCanvasElement, getConfig: () => LabConfig) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');
  const ctx: CanvasRenderingContext2D = context;
  let running = true;
  let frameId = 0;
  let previousTime = 0;
  let fpsTime = 0;
  let fpsFrames = 0;
  let fpsValue: number | null = null;
  let particles: PreviewParticle[] = [];
  let logicalWidth = 1;
  let logicalHeight = 1;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    logicalWidth = Math.max(1, bounds.width);
    logicalHeight = Math.max(1, bounds.height);
    canvas.width = Math.round(logicalWidth * ratio);
    canvas.height = Math.round(logicalHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#080e1d';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  };

  const reset = () => {
    // Số điểm demo luôn giới hạn thấp để không giả vờ benchmark 50.000 GPU particle.
    const previewCount = Math.min(600, Math.max(100, Math.round(getConfig().particleCount / 75)));
    particles = Array.from({ length: previewCount }, (_, i) => ({
      angle: (i * 2.399963229728653) + Math.random() * 0.2,
      radius: Math.sqrt((i + 1) / previewCount) * 0.46,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.2 + Math.random() * 0.8,
      size: 0.5 + Math.random() * 0.9,
    }));
    ctx.fillStyle = '#080e1d';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  };

  function tick(time: number): void {
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.06) : 0;
    previousTime = time;
    if (running) {
      const config = getConfig();
      const minSide = Math.min(logicalWidth, logicalHeight);
      const cx = logicalWidth * 0.5;
      const cy = logicalHeight * 0.5;
      ctx.fillStyle = 'rgba(8, 14, 29, 0.22)';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, minSide * .55);
      glow.addColorStop(0, 'rgba(35, 93, 135, 0.09)');
      glow.addColorStop(1, 'rgba(4, 8, 20, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      ctx.fillStyle = config.particleColor;
      for (const p of particles) {
        p.angle += dt * config.speed * (config.mode === 'vortex' ? 1.1 : .4) * (0.4 + config.strength * .4);
        const radius = (config.mode === 'vortex' ?
          p.radius * (0.83 + 0.12 * Math.sin(p.angle * 2 + p.phase)) :
          p.radius * (0.75 + 0.12 * Math.sin(p.angle + p.phase)));
        const x = cx + Math.cos(p.angle + p.phase * .15) * radius * minSide;
        const y = cy + Math.sin(p.angle + p.phase * .15) * radius * minSide * .72;
        ctx.globalAlpha = p.opacity * .85;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(.55, config.particleSize * p.size * .36), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      fpsFrames++;
      if (time - fpsTime >= 1000) {
        fpsValue = Math.round(fpsFrames * 1000 / (time - fpsTime || 1000));
        fpsFrames = 0;
        fpsTime = time;
      }
    }
    frameId = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  reset();
  frameId = requestAnimationFrame(tick);

  return {
    reset,
    getFps: () => fpsValue,
    isRunning: () => running,
    toggle: () => { running = !running; previousTime = 0; return running; },
    dispose: () => { cancelAnimationFrame(frameId); observer.disconnect(); },
  };
}
