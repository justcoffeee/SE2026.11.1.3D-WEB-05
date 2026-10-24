# Overlay — TV4

Tuần 1: giao diện status/FPS preview được dựng trong `src/ui/app.ts`. FPS hiển thị là **Canvas2D preview**, không phải FPS từ WebGPU/WebGL2. Sau khi TV1 chốt contract `PerformanceSnapshot` (chủ: TV1, consumer: TV5 — `docs/architecture.md` §4.1), tách thành overlay module và không hiển thị số không được đo thực tế.
