# Mô tả giao diện — GPU Particle Lab (TV4, tuần 1)

**Phạm vi:** giao diện responsive và Canvas2D preview phục vụ kiểm chứng luồng UI. Tài liệu này không mô tả WebGPU/WebGL2 đã hoàn thành.

## 1. Mục tiêu trải nghiệm

Giao diện ưu tiên vùng quan sát particle, giúp người dùng thay đổi tham số mà vẫn nhìn được phản hồi trực quan. Mọi thông tin về backend và hiệu năng phải phân biệt rõ dữ liệu thật, dữ liệu chưa khả dụng và dữ liệu của bản mock.

## 2. Cấu trúc màn hình

| Khu vực | Nội dung | Mục đích |
|---|---|---|
| Thanh điều hướng trái | Logo, biểu tượng module, avatar TV4 | Tạo khung điều hướng cho sản phẩm tương lai; tuần 1 chưa điều hướng trang |
| Thanh tiêu đề | Breadcrumb, badge “UI Prototype · Week 01”, mã đề tài | Cho biết ngữ cảnh và trạng thái prototype |
| Khu vực scene | Tiêu đề, Canvas2D preview, badge mock, pause/reset | Quan sát chuyển động và kiểm tra phản hồi controls |
| Thẻ trạng thái | Backend thực tế, FPS preview, GPU timing | Ngăn nhầm lẫn giữa Canvas2D mock và GPU simulation thật |
| Control panel | Mode, particle properties, force, backend preference, preset | Thay đổi cấu hình và thử các luồng chính |
| Toast | Thông báo thành công/lỗi | Phản hồi cho backend preference, import/export và reset |

## 3. Controls và hành vi

| Control | Giá trị tuần 1 | Hành vi |
|---|---|---|
| Simulation mode | Attractor / Vortex | Đổi state, label lực, mô tả và khởi tạo lại preview |
| Particle count | 1.000–50.000, bước 1.000 | Cập nhật cấu hình mục tiêu; preview chỉ vẽ tối đa 600 chấm |
| Speed | 0,1–3,0 | Điều chỉnh tốc độ chuyển động của preview |
| Particle size | 1–8 px | Điều chỉnh kích thước chấm trong preview |
| Particle color | `#RRGGBB` | Đổi màu chấm và lưu vào preset |
| Strength | 0,2–4,0 | Điều chỉnh mức ảnh hưởng minh họa theo mode |
| Backend preference | Auto / WebGPU / WebGL2 | Chỉ lưu lựa chọn; backend thực tế vẫn là Canvas2D mock |
| Export JSON | Tải preset schema v1 | Xuất toàn bộ `LabConfig` sau validation |
| Import | Chọn JSON tối đa 1 MB | Validate trước khi thay state; lỗi giữ nguyên cấu hình cũ |
| Khôi phục mặc định | `DEFAULT_CONFIG` | Đồng bộ lại toàn bộ controls và preview |
| Pause / Resume | Đang chạy / tạm dừng | Chỉ điều khiển animation preview, không sửa config |

## 4. Trạng thái hiển thị

- **Prototype:** luôn có badge “UI PROTOTYPE” và “CANVAS 2D DEMO · NOT GPU”.
- **Đang chạy:** nút hiển thị pause và preview tiếp tục cập nhật FPS.
- **Tạm dừng:** nút đổi thành resume; cấu hình vẫn giữ nguyên.
- **Import thành công:** controls và preview đồng bộ, toast xác nhận.
- **Import lỗi:** toast lỗi nêu nguyên nhân; state trước đó không đổi.
- **GPU timing không hỗ trợ/chưa tích hợp:** hiển thị “Không khả dụng”.
- **Backend preference thay đổi:** toast xác nhận đã lưu preference nhưng engine thật chưa kết nối.

## 5. Responsive

- **Desktop trên 930 px:** scene và control panel hiển thị hai cột; panel rộng 320–362 px.
- **Tablet 641–930 px:** panel chuyển xuống dưới scene; controls vẫn dùng được theo thứ tự đọc từ trên xuống.
- **Mobile tối đa 640 px:** rail và topbar thu gọn, thẻ trạng thái xếp một cột, scene tối thiểu 350 px.
- Không cho panel phủ lên canvas; trang được phép cuộn dọc trên màn hình hẹp.

## 6. Khả năng tiếp cận

- Input có `label`, nút icon có `aria-label`, nhóm mode có `aria-pressed`.
- Có focus indicator rõ cho button/input/select.
- Trạng thái không chỉ biểu diễn bằng màu; badge và thông báo đều có chữ.
- Toast dùng `role="status"` và `aria-live="polite"`.
- Canvas có nhãn mô tả; chức năng chính vẫn nằm ở controls HTML.

## 7. Ranh giới tích hợp

`src/ui/app.ts` quản lý state UI tuần 1; `src/presets/preset.ts` quản lý contract và validation preset; `src/ui/mock/particlePreview.ts` chỉ minh họa. Khi tích hợp, TV1–TV3 thay preview mock bằng engine port và TV5 cung cấp performance snapshot, nhưng cách hiển thị backend thực tế/không khả dụng phải được giữ nguyên.
