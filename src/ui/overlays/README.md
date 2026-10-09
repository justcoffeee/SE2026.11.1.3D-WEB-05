# Overlay — TV4

Tuần 1: giao diện status/FPS preview được dựng trong `src/ui/app.ts`. FPS hiển thị là **Canvas2D preview**, không phải FPS từ WebGPU/WebGL2. Sau khi TV5 định nghĩa `PerformanceSnapshot`, tách thành overlay module và không hiển thị số không được đo thực tế.
