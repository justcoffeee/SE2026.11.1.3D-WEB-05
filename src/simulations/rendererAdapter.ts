import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
} from 'three/webgpu';
import { PointsNodeMaterial, WebGPURenderer } from 'three/webgpu';
import { WebGLRenderer } from 'three';
import type { ActualBackend } from '../core/types/backend.ts';
import type { RendererPort, RendererStatus, RendererTarget } from '../core/renderer/RendererPort.ts';
import type { LabConfig } from '../presets/preset.ts';
import { DEFAULT_ATTRACTOR_DAMPING, DEFAULT_ATTRACTOR_RADIUS, DEFAULT_VORTEX_DAMPING } from './simulation.ts';
import { createAttractorKernel } from './shared/attractorKernel.ts';
import { createVortexKernel } from './shared/vortexKernel.ts';
import { createParticleBuffers, type ParticleBuffers } from './shared/particleBuffers.ts';
import { createState } from './shared/attributes.ts';
import type { ParticleState } from './shared/attributes.ts';
import { step } from './simulation.ts';
import { forceWebGLFromSearch, startBackend } from './backend/fallback.ts';

const MAX_FRAME_DELTA = 0.05;

/** Three.js implementation of the app-facing renderer contract. */
export class ThreeRendererAdapter implements RendererPort {
  #canvas: HTMLCanvasElement;
  #renderer: WebGPURenderer | WebGLRenderer | null = null;
  #scene: Scene | null = null;
  #camera: PerspectiveCamera | null = null;
  #material: PointsNodeMaterial | PointsMaterial | null = null;
  #points: Points | null = null;
  #buffers: ParticleBuffers | null = null;
  #cpuState: ParticleState | null = null;
  #computeKernel: ReturnType<typeof createAttractorKernel> | ReturnType<typeof createVortexKernel> | null = null;
  #config: Readonly<LabConfig>;
  #actual: ActualBackend = 'unavailable';
  #running = false;
  #disposed = false;
  #fps = 0;
  #fpsFrames = 0;
  #fpsStartedAt = 0;
  #lastFrameAt = 0;
  #target: RendererTarget = { width: 1, height: 1, pixelRatio: 1 };
  #gpuTimingAvailable = false;
  #gpuTimeMs: number | null = null;
  #unavailableNotice: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement, initialConfig: Readonly<LabConfig>) {
    this.#canvas = canvas;
    this.#config = { ...initialConfig };
  }

  async init(target: RendererTarget): Promise<ActualBackend> {
    if (this.#disposed) return 'unavailable';
    if (this.#renderer) this.#releaseRenderer();
    this.#unavailableNotice?.remove();
    this.#unavailableNotice = null;
    this.#actual = 'unavailable';
    this.#target = target;

    const started = await startBackend<WebGPURenderer | WebGLRenderer>(
      this.#config.backendPreference,
      forceWebGLFromSearch(window.location.search),
      {
        webgpu: async () => {
          const renderer = new WebGPURenderer({ canvas: this.#canvas, antialias: true, trackTimestamp: true });
          try {
            await renderer.init();
            await this.#initializeRenderer(renderer, 'webgpu');
            return renderer;
          } catch (error) {
            if (this.#renderer === renderer) this.#releaseRenderer();
            else renderer.dispose();
            if (!this.#disposed) this.#replaceCanvasForWebGLFallback();
            throw error;
          }
        },
        webgl2: async () => {
          const renderer = new WebGLRenderer({ canvas: this.#canvas, antialias: true });
          try {
            await this.#initializeRenderer(renderer, 'webgl2');
            return renderer;
          } catch (error) {
            if (this.#renderer === renderer) this.#releaseRenderer();
            else renderer.dispose();
            throw error;
          }
        },
      },
    );
    if (this.#disposed) {
      started.instance?.dispose();
      return 'unavailable';
    }
    this.#actual = started.actual;
    this.#renderer = started.instance;
    if (!this.#renderer) this.#showUnavailableNotice();

    return this.#actual;
  }

  applyConfig(config: Readonly<LabConfig>): void {
    const countChanged = config.particleCount !== this.#config.particleCount;
    const modeChanged = config.mode !== this.#config.mode;
    this.#config = { ...config };
    this.#updateUniforms();
    if (this.#material) {
      this.#material.color = new Color(config.particleColor);
      this.#material.size = config.particleSize;
    }

    if (this.#renderer && (countChanged || modeChanged)) {
      if (countChanged) this.#createPipeline(config.particleCount);
      this.#updateUniforms();
      if (modeChanged && this.#buffers) this.#selectComputeKernel();
      if (countChanged && this.#buffers && this.#renderer instanceof WebGPURenderer) {
        void this.#renderer.compute(this.#buffers.initKernel);
      }
    }
  }

  start(): void {
    if (this.#disposed || this.#actual === 'unavailable') return;
    this.#running = true;
    this.#lastFrameAt = 0;
    this.#fpsFrames = 0;
    this.#fpsStartedAt = performance.now();
  }

  pause(): void {
    this.#running = false;
  }

  resize(target: RendererTarget): void {
    this.#target = target;
    this.#resize();
  }

  reset(): void {
    if (!this.#renderer || this.#disposed) return;
    if (this.#renderer instanceof WebGPURenderer && this.#buffers) {
      void this.#renderer.compute(this.#buffers.initKernel);
    } else if (this.#actual === 'webgl2') {
      this.#createPipeline(this.#config.particleCount);
    }
  }

  getStatus(): RendererStatus {
    const gpuTimingAvailable = this.#gpuTimingAvailable && this.#gpuTimeMs !== null;
    return {
      requested: this.#config.backendPreference,
      actual: this.#actual,
      running: this.#running,
      gpuTimingAvailable,
      fps: this.#fps > 0 ? this.#fps : null,
      gpuTimeMs: gpuTimingAvailable ? this.#gpuTimeMs : null,
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#running = false;
    this.#releaseRenderer();
    this.#unavailableNotice?.remove();
    this.#unavailableNotice = null;
  }

  #createScene(): void {
    const renderer = this.#renderer;
    if (!renderer) return;

    const scene = new Scene();
    scene.background = new Color('#071018');
    const camera = new PerspectiveCamera(55, this.#target.width / this.#target.height, 0.1, 200);
    camera.position.set(0, 0, 30);
    camera.lookAt(new Vector3(0, 0, 0));
    this.#scene = scene;
    this.#camera = camera;
    renderer.setPixelRatio(this.#target.pixelRatio);
    renderer.setSize(this.#target.width, this.#target.height, false);
  }

  async #initializeRenderer(renderer: WebGPURenderer | WebGLRenderer, actual: 'webgpu' | 'webgl2'): Promise<void> {
    if (this.#disposed) {
      renderer.dispose();
      throw new Error('Renderer adapter was disposed during initialization.');
    }
    this.#renderer = renderer;
    this.#actual = actual;
    try {
      this.#createScene();
      this.#createPipeline(this.#config.particleCount);
      if (actual === 'webgpu' && renderer instanceof WebGPURenderer && this.#buffers) {
        await renderer.compute(this.#buffers.initKernel);
        if (this.#disposed) throw new Error('Renderer adapter was disposed during initialization.');
        this.#gpuTimingAvailable = renderer.hasFeature('timestamp-query');
      }
      await renderer.setAnimationLoop(this.#onFrame);
      if (this.#disposed) throw new Error('Renderer adapter was disposed during initialization.');
    } catch (error) {
      this.#releaseRenderer();
      throw error;
    }
  }

  #createPipeline(count: number): void {
    const renderer = this.#renderer;
    if (!renderer || count <= 0) return;

    if (this.#points) this.#scene?.remove(this.#points);
    this.#geometryAndMaterialDispose();

    const geometry = new BufferGeometry();
    let material: PointsNodeMaterial | PointsMaterial;
    if (this.#actual === 'webgpu') {
      const buffers = createParticleBuffers(count);
      geometry.setAttribute('position', buffers.positions.value);
      material = new PointsNodeMaterial({ color: this.#config.particleColor, size: this.#config.particleSize });
      this.#buffers = buffers;
      this.#cpuState = null;
    } else {
      this.#cpuState = createState({
        mode: this.#config.mode,
        particleCount: count,
        speed: this.#config.speed,
        strength: this.#config.strength,
      });
      geometry.setAttribute('position', new Float32BufferAttribute(this.#cpuState.positions, 3));
      material = new PointsMaterial({ color: this.#config.particleColor, size: this.#config.particleSize });
      this.#buffers = null;
    }
    const points = new Points(geometry, material);
    this.#scene?.add(points);

    this.#material = material;
    this.#points = points;
    this.#updateUniforms();
    this.#selectComputeKernel();
  }

  #updateUniforms(): void {
    if (!this.#buffers) return;
    const { uniforms } = this.#buffers;
    uniforms.strength.value = this.#config.strength;
    uniforms.delta.value = 0;
    // Both kernels are compiled once with their respective mode uniform values.
    uniforms.radius.value = DEFAULT_ATTRACTOR_RADIUS;
    uniforms.damping.value = DEFAULT_ATTRACTOR_DAMPING;
    uniforms.vortexDamping.value = DEFAULT_VORTEX_DAMPING;
  }

  #selectComputeKernel(): void {
    if (!this.#buffers) {
      this.#computeKernel = null;
      return;
    }
    this.#computeKernel = this.#config.mode === 'attractor'
      ? createAttractorKernel(this.#buffers)
      : createVortexKernel(this.#buffers);
  }

  #onFrame = (time: number): void => {
    const renderer = this.#renderer;
    const scene = this.#scene;
    const camera = this.#camera;
    const buffers = this.#buffers;
    if (!renderer || !scene || !camera || this.#disposed) return;

    if (this.#running) {
      const rawDelta = this.#lastFrameAt === 0 ? 0 : (time - this.#lastFrameAt) / 1000;
      const delta = Math.min(MAX_FRAME_DELTA, Math.max(0, rawDelta));
      if (this.#actual === 'webgpu' && renderer instanceof WebGPURenderer && buffers) {
        buffers.uniforms.delta.value = delta * this.#config.speed;
        if (this.#computeKernel) {
          renderer.compute(this.#computeKernel);
          if (this.#gpuTimingAvailable) {
            void renderer.resolveTimestampsAsync('compute').then((durationMs) => {
              if (this.#disposed) return;
              this.#gpuTimeMs = durationMs !== undefined && Number.isFinite(durationMs) && durationMs > 0
                ? durationMs
                : null;
              if (this.#gpuTimeMs === null) this.#gpuTimingAvailable = false;
            }).catch(() => {
              if (this.#disposed) return;
              this.#gpuTimingAvailable = false;
              this.#gpuTimeMs = null;
            });
          }
        }
      } else if (this.#actual === 'webgl2' && this.#cpuState) {
        step(this.#cpuState, delta, {
          mode: this.#config.mode,
          particleCount: this.#config.particleCount,
          speed: this.#config.speed,
          strength: this.#config.strength,
        });
        const position = this.#points?.geometry.getAttribute('position');
        if (position) position.needsUpdate = true;
      }
      this.#fpsFrames += 1;
      const elapsed = time - this.#fpsStartedAt;
      if (elapsed >= 500) {
        this.#fps = (this.#fpsFrames * 1000) / elapsed;
        this.#fpsFrames = 0;
        this.#fpsStartedAt = time;
      }
    }

    this.#lastFrameAt = time;
    renderer.render(scene, camera);
  };

  #resize(): void {
    this.#renderer?.setPixelRatio(this.#target.pixelRatio);
    this.#renderer?.setSize(this.#target.width, this.#target.height, false);
    if (this.#camera) {
      this.#camera.aspect = this.#target.width / this.#target.height;
      this.#camera.updateProjectionMatrix();
    }
  }

  #geometryAndMaterialDispose(): void {
    this.#points?.geometry.dispose();
    this.#material?.dispose();
    this.#points = null;
    this.#material = null;
  }

  #releaseRenderer(): void {
    const renderer = this.#renderer;
    if (renderer) void Promise.resolve(renderer.setAnimationLoop(null)).catch(() => undefined);
    this.#geometryAndMaterialDispose();
    renderer?.dispose();
    this.#renderer = null;
    this.#scene = null;
    this.#camera = null;
    this.#buffers = null;
    this.#cpuState = null;
    this.#computeKernel = null;
    this.#gpuTimingAvailable = false;
    this.#gpuTimeMs = null;
  }

  #showUnavailableNotice(): void {
    const notice = document.createElement('div');
    notice.className = 'renderer-unavailable';
    notice.setAttribute('role', 'status');
    notice.textContent = 'WebGPU and WebGL2 are unavailable in this browser.';
    this.#canvas.insertAdjacentElement('afterend', notice);
    this.#unavailableNotice = notice;
  }

  #replaceCanvasForWebGLFallback(): void {
    const replacement = this.#canvas.cloneNode(false) as HTMLCanvasElement;
    this.#canvas.replaceWith(replacement);
    this.#canvas = replacement;
  }
}
