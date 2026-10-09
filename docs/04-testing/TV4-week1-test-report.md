# Báo cáo kiểm thử UI tuần 1 — TV4

**Ngày kiểm thử:** 09/10/2026

**Môi trường:** Windows, Node.js v22.16.0, npm 11.10.1, Microsoft Edge/Chromium, Vite 6.4.4

**Phạm vi:** UI prototype, Canvas2D preview và preset JSON; không kiểm thử WebGPU/WebGL2 thật.

## 1. Kiểm tra tự động

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| `npm run typecheck` | Đạt | TypeScript không báo lỗi |
| `npm test` | Đạt | 6/6 unit tests, 0 lỗi |
| `npm run build` | Đạt | 7 modules transformed; build Vite hoàn tất |
| Console trình duyệt | Đạt | 0 error, 0 warning sau các luồng kiểm thử |

## 2. Kiểm thử tương tác

| Case | Thao tác | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| UI-01 | Chọn Vortex | Mode, mô tả, label lực và preview đổi sang Vortex | Đạt |
| UI-02 | Đặt speed = 2,4 | Label và giá trị slider đồng bộ | Đạt |
| UI-03 | Chọn WebGL2 | Preference đổi; backend thực tế vẫn “Canvas 2D (mockup)” và có toast giải thích | Đạt |
| UI-04 | Export rồi import preset | Tệp JSON tải thành công; import lại báo thành công | Đạt |
| UI-05 | Import `{}` | Bị từ chối với thông báo sai định dạng; trang không crash | Đạt |
| UI-06 | Khôi phục mặc định | Mode, speed và backend preference trở về mặc định | Đạt |
| UI-07 | Pause / Resume | Nhãn trợ năng đổi đúng và preview tiếp tục sau resume | Đạt |
| UI-08 | Responsive | Desktop 1440×1000 hai cột; mobile 390×844 một cột, không tràn ngang | Đạt |
| UI-09 | GPU timing | Hiển thị “Không khả dụng” | Đạt |

## 3. Ảnh minh chứng

- `docs/04-testing/screenshots/desktop-1440x1000.png`
- `docs/04-testing/screenshots/mobile-500x844.png`

## 4. Kết luận

Không phát hiện lỗi chặn PR trong phạm vi TV4 tuần 1. Không cần sửa code runtime sau lượt kiểm thử này. Các giới hạn WebGPU/WebGL2, GPU timing và benchmark vẫn được ghi rõ là ngoài phạm vi prototype.
