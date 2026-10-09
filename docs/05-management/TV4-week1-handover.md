# Bàn giao tuần 1 — Thành viên TV4 (UI/UX + Presets)

**Tuần:** 12–18/10/2026

**Nhánh đề xuất:** `feat/tv4-week1-ui-ux`

**Trạng thái:** đã hoàn thiện tài liệu, kiểm thử và ảnh minh chứng; sẵn sàng gửi PR.

## 1. Công việc của TV4 được chuẩn bị

| Nhiệm vụ | Đường dẫn bằng chứng | Trạng thái |
|---|---|---|
| Phân tích yêu cầu UI | `docs/01-requirements/ui-requirements.md` | Có bản v0.1 |
| Danh sách và mô tả Use Case | `docs/01-requirements/use-cases.md` | Có bản v0.1 và Mermaid diagram |
| Thiết kế wireframe desktop/mobile | `docs/02-design/ui-wireframes.md` | Có ASCII wireframe |
| Mô tả giao diện và trạng thái | `docs/02-design/ui-description.md` | Có cấu trúc màn hình, controls, responsive, accessibility |
| Thiết kế giao tiếp với engine | `docs/02-design/ui-interaction-spec.md` | Đề xuất, chờ nhóm review |
| Dựng UI mockup có tương tác | `src/ui/app.ts`, `src/ui/styles/main.css` | Có code |
| Minh họa particle cho UI | `src/ui/mock/particlePreview.ts` | Canvas 2D mock, không phải GPU |
| Export/import preset JSON | `src/presets/preset.ts` | Có code + validation |
| Test preset | `tests/unit/preset.test.ts` | Có 6 unit tests |
| Báo cáo kiểm thử + ảnh | `docs/04-testing/TV4-week1-test-report.md`, `docs/04-testing/screenshots/` | Đã kiểm tra ngày 09/10/2026 |

## 2. Tự kiểm thử trên máy trước khi PR

1. `npm install`, `npm run dev`, kiểm tra giao diện ở desktop và mobile.
2. Chọn Attractor/Vortex, kéo slider và đổi màu, bảo đảm UI phản hồi.
3. Export JSON, import lại, kiểm tra dữ liệu đã khôi phục đúng.
4. Sửa JSON thành `{}` rồi import và xác nhận thông báo lỗi.
5. Chuyển backend preference mà UI vẫn ghi backend thực tế `Canvas 2D (mockup)`.
6. Chạy `npm run typecheck`, `npm test`, `npm run build`.
7. Chụp ảnh màn hình minh chứng và bổ sung đường dẫn trong PR (ảnh không được tự tuyên bố đã chụp nếu chưa làm).

## 3. Các điều TUYỆT ĐỐI không báo cáo là hoàn thành

- Chưa có WebGPU simulation hoặc WebGL2 fallback.
- Chưa có FPS GPU hay GPU timing; chỉ có FPS preview Canvas 2D.
- Chưa có benchmark theo thiết bị/trình duyệt.
- Chưa có SRS hoặc PTTK chính thức của cả nhóm; TV4 chỉ đóng góp tài liệu chức năng/UI.

## 4. Cần TV1 xác nhận trước merge

- Có nên lấy scaffold này làm base repo chính thức không, hay chỉ cherry-pick thư mục TV4?
- Dùng Vite + TypeScript hay cấu hình khác?
- Chốt Attractor/Vortex hay sửa tên mode?
- Ai sở hữu và chuẩn hóa `LabConfig`?
- CI và rule branch chính của nhóm là gì?

## 5. Đầu việc tiếp theo của TV4 — tuần 2

- Tách UI từ canvas preview mock sang contract engine thống nhất cùng TV1.
- Chốt các thông số UI theo POC WebGPU/WebGL2 của TV2/TV3.
- Thiết kế trạng thái loading / WebGPU active / fallback active / unavailable.
- Thêm test tương tác UI khi đã có bộ công cụ kiểm thử nhóm thống nhất.
