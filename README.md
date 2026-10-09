# 3D-WEB-05 — GPU Particle Lab

> **Scaffold tuần 1 + UI prototype của TV4**, chưa phải sản phẩm GPU cuối cùng. README này là bản tạm, TV1 nên tiếp quản để bổ sung thông tin chung.

## Mục tiêu đề tài

Ứng dụng web trình diễn hàng chục nghìn particle với GPU simulation trên WebGPU, fallback WebGL2, tối thiểu hai simulation modes, bảng điều khiển, FPS / GPU timing (nếu khả dụng), export/import preset JSON và benchmark giữa hai backend.

## Chạy UI prototype

Cần **Node.js >=22.16** và npm. Dùng terminal ở thư mục repo:

```bash
npm install
npm run dev
```

Truy cập đường dẫn do Vite hiển thị (thường là `http://localhost:5173`). Các lệnh khác:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

### Phần đã làm được

- Giao diện responsive và prototype Canvas 2D, có chọn **Attractor/Vortex** để mô phỏng trực quan.
- Controls: particle count, speed, size, color, strength, backend preference (chỉ là lựa chọn UI).
- Tạm dừng / tiếp tục / reset preview, khôi phục cấu hình mặc định.
- Export/import preset JSON có validation + unit tests.
- Hiển thị **backend thật hiện tại là Canvas 2D mock**, FPS của **Canvas 2D preview**, GPU timing = "Không khả dụng".

### Chưa triển khai — trách nhiệm của TV1/TV2/TV3/TV5

- **KHÔNG** có WebGPU/Three.js/TSL, compute shader hoặc WebGL2 fallback thật.
- **KHÔNG** có GPU FPS/GPU timing hay benchmark WebGPU vs WebGL2.
- Slider particle count lưu cấu hình mục tiêu nhưng preview Canvas2D có giới hạn tối đa 600 chấm để không gây hiểu nhầm.
- **KHÔNG** có simulation physics đúng theo engine sản xuất.

Không được báo cáo đây là phần WebGPU/WebGL2 đã hoàn thành.

## Quyền sở hữu module (đề xuất, chờ nhóm xác nhận)

| Thành viên | Code | Tài liệu chính |
|---|---|---|
| TV1 | `src/core/`, bootstrap / integration | `docs/01-requirements/SRS.md`, `docs/02-design/architecture.md`, quản lý |
| TV2 | `src/simulations/webgpu/`, `src/simulations/shared/` cùng TV3 | thiết kế và nghiên cứu WebGPU |
| TV3 | `src/simulations/webgl2/`, shared cùng TV2 | fallback và tương thích |
| **TV4** | `src/ui/`, `src/presets/` | use cases, UI requirements, wireframe, interaction spec |
| TV5 | `src/perf/`, `tests/` (testing tổng thể) | test plan, test environments, benchmark |

Các thư mục trống có `.gitkeep` để Git theo dõi. **Không có nghĩa là phần việc tương ứng đã được triển khai**.

## Tài liệu TV4

- [`docs/01-requirements/use-cases.md`](docs/01-requirements/use-cases.md)
- [`docs/01-requirements/ui-requirements.md`](docs/01-requirements/ui-requirements.md)
- [`docs/02-design/ui-wireframes.md`](docs/02-design/ui-wireframes.md)
- [`docs/02-design/ui-description.md`](docs/02-design/ui-description.md)
- [`docs/02-design/ui-interaction-spec.md`](docs/02-design/ui-interaction-spec.md)
- [`docs/05-management/TV4-week1-handover.md`](docs/05-management/TV4-week1-handover.md)
- [`docs/04-testing/TV4-week1-test-report.md`](docs/04-testing/TV4-week1-test-report.md)

## Lưu ý tích hợp

`src/main.ts` là bootstrap tạm cho việc demo tuần 1. `src/presets/preset.ts` đề xuất contract `LabConfig`, cần **TV1 + TV2 + TV3 review** trước khi nối renderer thật. Giao diện không tự suy đoán trạng thái WebGPU; chỉ dùng dữ liệu thực tế từ engine sau khi tích hợp.

## Nhánh đề xuất

`feat/tv4-week1-ui-ux` → PR vào nhánh tích hợp của nhóm (hoặc `main` nếu TV1 xác nhận). Không push trực tiếp lên `main`.
