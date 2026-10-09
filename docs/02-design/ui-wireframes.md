# Wireframes giao diện Particle Lab — TV4, tuần 1

**Mục tiêu:** tổ chức canvas là trung tâm; settings dễ tiếp cận; trạng thái backend/GPU timing không mơ hồ.

**Phiên bản:** Low-fidelity ASCII v0.1. Giao diện HTML/CSS thực tế cũng nằm trong `src/ui/`.

## 1. Wireframe Desktop (>= 930px)

```text
┌─────┬──────────────────────────────────────────────────────────────┐
│     │ WORKSPACE / GPU PARTICLE LAB                 UI PROTOTYPE    │
│     ├───────────────────────────────────┬──────────────────────────┤
│ NAV │ INTERACTIVE PARTICLE SYSTEM       │ CONTROL PANEL            │
│     │ Make motion visible.              │                          │
│ [✦] │ ┌───────────────────────────────┐ │ 01. Simulation mode      │
│ [▤] │ │ PREVIEW ACTIVE   CANVAS2D DEMO│ │ [Attractor] [Vortex]     │
│ [⌁] │ │                               │ │                          │
│     │ │            • • •              │ │ 02. Particle properties  │
│     │ │          •  +  •              │ │ Particle count   [slider]│
│     │ │            • • •              │ │ Speed            [slider]│
│     │ │                               │ │ Size             [slider]│
│     │ │ ATTRACTOR FIELD       [Ⅱ][↻] │ │ Color            [color] │
│     │ └───────────────────────────────┘ │                          │
│     │ ┌───────────┬──────────┬────────┐ │ 03. Force controls       │
│     │ │Backend    │Preview FPS│GPU time│ │ Strength         [slider]│
│     │ │Canvas2D   │ measured  │ N/A    │ │                          │
│     │ └───────────┴──────────┴────────┘ │ 04. Backend preference   │
│     │ UI demo — not GPU simulation      │ [Auto/WebGPU/WebGL2 ▼]   │
│     │                                   │                          │
│     │                                   │ 05. Preset               │
│     │                                   │ [Export JSON] [Import]   │
│     │                                   │ Reset defaults           │
└─────┴───────────────────────────────────┴──────────────────────────┘
```

## 2. Wireframe Tablet / Mobile (<= 930px)

```text
┌─────────────────────────────────┐
│ GPU PARTICLE LAB          DEMO   │
├─────────────────────────────────┤
│ Make motion visible.            │
│ ┌─────────────────────────────┐ │
│ │        Particle canvas      │ │
│ │       Canvas 2D preview     │ │
│ │                 [Ⅱ] [↻]     │ │
│ └─────────────────────────────┘ │
│ Backend: Canvas2D mock          │
│ Preview FPS: ...                │
│ GPU timing: N/A                 │
├─────────────────────────────────┤
│ CONTROL PANEL                   │
│ [Attractor] [Vortex]            │
│ Particle count  [slider]        │
│ Speed / Size    [slider]        │
│ Color           [picker]        │
│ Strength        [slider]        │
│ Backend         [select]        │
│ [Export JSON]  [Import]         │
└─────────────────────────────────┘
```

## 3. Phân cấp thông tin

1. **Canvas/scene** là vùng tương tác chính; không được che bởi panel.
2. **Backend thực tế** và thông báo UI demo luôn dễ nhìn thấy.
3. **Mode và controls** nhóm theo tác vụ, label gắn với giá trị hiện tại.
4. **Preset** có hai hành động chính Export/Import và một Reset phụ.
5. **Feedback** thông qua toast và thông báo ngữ nghĩa, lỗi phải diễn đạt bằng chữ.

## 4. Trạng thái UI cần thiết

| Trạng thái | Hành vi hiển thị |
|---|---|
| Mock tuần 1 | Badge “UI Prototype”; backend Canvas2D demo; GPU timing “Không khả dụng” |
| Engine initializing (tương lai) | Loading và disable controls có phụ thuộc engine nếu cần |
| WebGPU active (tương lai) | Badge WebGPU lấy từ engine, không suy từ dropdown |
| Fallback active (tương lai) | Badge WebGL2 + lý do fallback nếu có |
| GPU timing unsupported | “Không khả dụng”, không hiển thị 0ms vì dễ gây hiểu nhầm |
| Preset invalid | Thông báo lỗi chính xác, cấu hình cũ không thay đổi |
| User paused | Icon đổi thành Resume, preview dừng cập nhật |

## 5. Visual design đề xuất

- Dark lab theme, nền navy, màu nhấn cyan, typography Space Grotesk / DM Sans (có fallback hệ thống).
- Trang chính gồm rail / topbar / scene / controls; các ô metric dưới scene.
- Nhãn song ngữ Việt–Anh theo thuật ngữ chuyên ngành, code và tên trường thống nhất với schema.
- Responsive từ desktop đến mobile; keyboard focus và aria labels cho các control cần thiết.

## 6. Dấu mốc tích hợp

Các mock states sẽ thay bởi dữ liệu thật từ TV1, TV2, TV3, TV5; **không** gọi Canvas2D demo là một backend fallback của sản phẩm.
