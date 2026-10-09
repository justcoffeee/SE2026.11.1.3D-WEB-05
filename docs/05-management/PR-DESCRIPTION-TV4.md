# [TV4] Week 1 — UI/UX Use Cases + Wireframes + Prototype

## Tóm tắt

- Khởi tạo scaffold thư mục làm việc chung (đề xuất; chưa áp đặt kiến trúc nhóm).
- Phân tích yêu cầu UI, lập danh sách Use Cases và wireframes.
- Dựng trang Particle Lab responsive bằng Vite + TypeScript + Canvas2D **mock**.
- Controls mode/count/speed/size/color/strength và backend preference.
- Export/import preset JSON có validation + test.

## Hành vi đã kiểm tra

- [x] Chạy UI bằng `npm run dev` trên máy Windows.
- [x] `npm run typecheck`
- [x] `npm test` — 6/6 tests đạt.
- [x] `npm run build`
- [x] Chụp màn hình desktop/mobile trong `docs/04-testing/screenshots/`.

Chi tiết: `docs/04-testing/TV4-week1-test-report.md`.

## Ngoài phạm vi PR

- WebGPU/Three.js/TSL computation thực; fallback WebGL2; GPU timing và benchmark.

## Cần review từ nhóm

1. TV1: scaffold, bootstrap, dữ liệu chung `LabConfig`.
2. TV2/TV3: mode, cấu hình simulation, backend preference.
3. TV5: hiển thị perf metrics và test cases.

## Lưu ý

`src/main.ts` chỉ là bootstrap tạm của demo TV4. Không merge đè lên bootstrap có sẵn nếu nhóm đã thêm code trước thời điểm PR.
