# Phân quyền thư mục (đề xuất cho buổi kickoff)

Đây là danh sách **owner kỹ thuật dự kiến**, không phải quy định đã được TV1 phê duyệt.

| Owner | Thư mục | Trạng thái sau scaffold tuần 1 |
|---|---|---|
| TV1 | `src/core/`, `src/main.ts`, `.github/`, cấu hình tích hợp | Chỉ có thư mục trống và bootstrap tạm cho UI demo |
| TV2 | `src/simulations/webgpu/` | `.gitkeep`; không có WebGPU implementation |
| TV3 | `src/simulations/webgl2/` | `.gitkeep`; không có WebGL2 implementation |
| TV2 + TV3 | `src/simulations/shared/` | `.gitkeep`, chờ thống nhất contract |
| TV4 | `src/ui/`, `src/presets/`, tài liệu UI | Prototype và tài liệu tuần 1 |
| TV5 | `src/perf/`, `tests/` | `src/perf` trống; `tests/unit/preset.test.ts` do TV4 tạo riêng để kiểm thử preset |

**Quy tắc làm việc:** người khác được phép review và PR vào thư mục; owner chịu trách nhiệm review logic, không độc quyền code. Không xóa code người khác khi chưa trao đổi.
