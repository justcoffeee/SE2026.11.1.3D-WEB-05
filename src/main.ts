// Bootstrap TẠM dành cho prototype UI tuần 1; TV1 có thể thay thế tại lúc tích hợp.
import './ui/styles/main.css';
import { mountLabUI } from './ui/app.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Không tìm thấy phần tử #app');
mountLabUI(app);
