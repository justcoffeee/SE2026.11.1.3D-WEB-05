// Browser composition root binds the canvas to the Three.js renderer adapter.
import './ui/styles/main.css';
import './ui/styles/tokens.css';
import { mountLabUI } from './ui/app.ts';
import { ThreeRendererAdapter } from './simulations/rendererAdapter.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Không tìm thấy phần tử #app');
mountLabUI(app, undefined, (canvas, config) => new ThreeRendererAdapter(canvas, config));
