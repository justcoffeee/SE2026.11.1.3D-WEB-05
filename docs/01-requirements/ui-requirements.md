# Yêu cầu giao diện UI/UX và Preset (TV4) — v0.2

**Dự án:** 3D-WEB-05 — GPU Particle Lab

**Giai đoạn:** tuần 1 (12–18/10/2026)

**Tình trạng:** phần UI độc lập engine đã có prototype và test; contract chung còn chờ TV2/TV3/TV5 review. Nguồn sự thật về kiến trúc và contract là [`docs/architecture.md`](../architecture.md).

## 1. Nguồn yêu cầu

Theo ngữ cảnh đề tài, MVP cần ít nhất hai simulation modes, điều chỉnh particle count/speed/size/color/hệ số mode, FPS và GPU timing khi hỗ trợ, WebGPU/WebGL2 fallback và chỉ báo backend thực tế, export/import JSON preset.

## 2. Actor và phạm vi

- **Người sử dụng (User):** vào lab, khám phá particle, thay đổi cấu hình, xem chỉ số, xuất/nhập preset.
- **Hệ thống/engine:** thực hiện simulation, chọn backend phù hợp, cung cấp dữ liệu hiệu năng. Đây **không phải actor người dùng**.
- **TV4 chịu trách nhiệm:** thiết kế giao diện, quản lý trạng thái UI, ràng buộc controls, nhập/xuất JSON và thông báo lỗi.
- **Không thuộc phần TV4:** cài đặt WebGPU/WebGL2 engine, công thức mô phỏng production và phép đo GPU timing thật.

## 3. Functional Requirements chi tiết cho UI

| ID | Mức ưu tiên | Yêu cầu | Acceptance criteria |
|---|---|---|---|
| UI-FR-01 | Must | Chọn simulation mode (ít nhất Attractor, Vortex trong bản đề xuất) | Lựa chọn phản ánh trên controls và thông số gửi tới engine |
| UI-FR-02 | Must | Điều chỉnh particle count | Có label, giá trị hiện hành, min/max rõ ràng; engine được cập nhật qua contract |
| UI-FR-03 | Must | Điều chỉnh speed, size, color, hệ số riêng mode | Hiển thị giá trị và phản hồi khi tương tác |
| UI-FR-04 | Must | Hiển thị backend **thực tế** | WebGPU / WebGL2 / chưa khởi tạo / lỗi; không lấy backend được yêu cầu để giả là backend thực tế |
| UI-FR-05 | Must | Hiển thị FPS / GPU timing | GPU timing hiện "Không khả dụng" nếu không có; không đặt số đo giả |
| UI-FR-06 | Must | Export cấu hình JSON | Tệp tải về chứa đủ trường, phiên bản schema |
| UI-FR-07 | Must | Import preset JSON | Khôi phục toàn bộ controls khi hợp lệ; thông báo lỗi khi thiếu/sai kiểu trường |
| UI-FR-08 | Should | Reset về giá trị mặc định | Controls và state đồng bộ sau reset |
| UI-FR-09 | Should | Tạm dừng / tiếp tục simulation | Trạng thái điều khiển rõ; cần API engine thực tế trong giai đoạn tích hợp |
| UI-FR-10 | Should | Thông báo loading/error/unsupported | Có fixture kiểm thử từng state; khóa control simulation khi chưa thể chạy; không báo sai khả năng GPU |

## 4. Non-functional Requirements đề xuất

- **Rõ ràng:** phân biệt backend mong muốn với backend đang hoạt động; số liệu đo thật với demo.
- **Responsive:** desktop ưu tiên, panel không che vùng xem particle ở tablet/mobile.
- **Khả năng dùng được:** label cho input, focus keyboard, trạng thái lỗi đọc được; không chỉ phân biệt trạng thái bằng màu sắc.
- **An toàn đầu vào:** preset JSON có schema và validation; không render nội dung tùy ý từ file thành HTML.
- **Tích hợp:** state controls tách khỏi renderer và performance pipeline; module TV4 không chứa code WebGPU giả.

## 5. Trạng thái triển khai TV4 pre-integration

- UI-FR-01 đến UI-FR-03, UI-FR-06 đến UI-FR-09: có trong Canvas2D UI prototype.
- UI-FR-04, UI-FR-05, UI-FR-10: đã hoàn thiện cách hiển thị và fixture UI; dữ liệu engine/performance thật còn chờ tích hợp.
- JSON Schema v1 và ma trận runtime state đã lưu ở docs/02-design.

## 6. Ngoài phạm vi UI tuần 1

Kết nối GPU thật, benchmark, test hiệu năng 10k–50k particle, hiệu ứng đồ họa nâng cao, save preset lên server, authentication, đa người dùng.

## 7. Điểm cần xác nhận tại buổi review

1. Nhóm có chốt **Attractor + Vortex** làm hai mode chính thức không?
2. Ranges demo (`particleCount` 1k–50k; `speed` 0.1–3; `size` 1–8; `strength` 0.2–4) có phù hợp với mô hình engine thật không?
3. UI sẽ nhận backend state / perf state qua interface hoặc event nào do TV1/TV5 thống nhất?
4. Dùng panel custom hiện tại hay chuyển sang lil-gui/Tweakpane sau POC?

Các câu này là quyết định kiến trúc cần team đồng thuận, không chặn việc nộp deliverable TV4 tuần 1.
