# Reference step contract — simulation (#6)

Hợp đồng giữa reference step CPU (#6), kernel TSL attractor (#10) và vortex (#11).
Khi đổi công thức, phải sửa đồng thời tài liệu này, `simulation.ts` và golden test.

## 1. Attribute layout

`src/simulations/shared/attributes.ts` — một bộ attribute dùng chung cho cả hai backend,
adapter (#12) map trực tiếp sang GPU storage buffer.

| Attribute | `itemSize` | Mảng | Kiểu | Ghi chú |
|---|---|---|---|---|
| `position` | 3 | `positions` | `Float32Array` | world space |
| `velocity` | 3 | `velocities` | `Float32Array` | |
| `age` | 1 | `ages` | `Float32Array` | giây |
| `seed` | 1 | `seeds` | `Uint32Array` | cố định mỗi hạt |

`PARTICLE_ATTRIBUTES` là nguồn duy nhất mô tả layout; không hard-code lại trong adapter.

## 2. API

```ts
createState(config: SimulationConfig, seed = 1): ParticleState
step(state: ParticleState, dt: number, config: SimulationConfig): ParticleState
```

`SimulationConfig`:

| Field | Mặc định | Ghi chú |
|---|---|---|
| `mode` | — | `attractor` \| `vortex` |
| `particleCount` | — | số nguyên ≥ 0 |
| `speed` | — | hữu hạn, > 0 |
| `strength` | — | hữu hạn, ≥ 0 |
| `spawnRadius` | 10 | bán kính spawn |
| `attractorRadius` | 6 | ngưỡng damping của attractor |
| `attractorDamping` | 0.98 | |
| `vortexDamping` | 0.99 | |

- `createState` ném `TypeError` nếu config vi phạm bảng trên.
- `step` ném `TypeError` nếu `dt` hoặc `speed` không hữu hạn/âm; trả về chính `state`
  (mutate in-place).
- Không phụ thuộc DOM hay `three`.

## 3. Tất định

- PRNG `mulberry32`; cùng `(config, seed)` cho ra cùng toàn bộ mảng.
- Spawn trong khối cầu: `radius = spawnRadius * cbrt(random())`, phân bố đều theo thể tích.
- Dùng `Math.sqrt(x*x + y*y + z*z)` thay `Math.hypot`: `Math.hypot` có thể lệch vài ulp
  giữa các engine/CPU, làm golden test và đối chiếu GPU không ổn định.

## 4. Công thức một bước

Ký hiệu `scaled = dt * speed`, `r = |position|`.

```
lặp từng hạt:
  nếu r > 1e-6:
    tangent = (z / r, 0, -x / r)          // normalize(cross(-position, up))
    v      += tangent * strength * scaled
    nếu mode = attractor và r > attractorRadius: v *= attractorDamping
    nếu mode = vortex:                            v *= vortexDamping
    p      += v * scaled
  age += scaled
```

- Hạt nằm đúng gốc toạ độ không đổi vận tốc/vị trí (tránh chia 0) nhưng `age` vẫn tăng.
- Attractor: chỉ damping khi ra ngoài `attractorRadius`.
- Vortex: damping mỗi bước, không có lực hướng tâm.
- Thứ tự cố định: cộng vận tốc → damping → tích phân vị trí.

## 5. Golden baseline

Config: `mode` lần lượt `attractor`/`vortex`, `particleCount = 4`, `speed = 1`,
`strength = 1`, `spawnRadius = 1`, `attractorRadius = 1`, seed `123`, chạy 60 bước `1/60`.

Hạt 0, sau 60 bước:

| Mode | position[0..2] | velocity[0..2] |
|---|---|---|
| attractor | `-0.2440307, -0.5086817, -0.6391482` | `-0.7608172, 0, -0.0213828` |
| vortex | `-0.1751149, -0.5086817, -0.6317196` | `-0.5698951, 0, -0.0164840` |

Golden test nằm trong `tests/unit/simulation.test.ts` với dung sai `1e-6`.

## 6. Kiểm chứng

`tests/unit/simulation.test.ts`:

- layout `PARTICLE_ATTRIBUTES`;
- determinism theo seed, seed khác → state khác;
- `age` tăng `dt * speed`; step thực sự làm hạt di chuyển;
- finite với cả hai mode, kể cả hạt ở gốc;
- `strength = 0` giữ nguyên vị trí;
- input boundary (`dt`, `speed`, `particleCount`);
- golden values;
- chặn import DOM/`three`.

## 7. Đối chiếu #10 / #11

Kernel TSL phải giữ đúng thứ tự §4 và dùng cùng `Math.sqrt`/cùng hằng số. Numeric parity
thật chỉ đo được trên GPU, chờ adapter #12 để chạy browser readback vài hạt rồi so với §5.
Unit test hiện chỉ kiểm công thức CPU và cấu trúc node TSL.

## 8. Câu hỏi mở (cần TV2/product chốt)

1. Vortex hiện không có lực hút vào tâm: bán kính gần như giữ nguyên, chỉ giảm tốc.
   Nếu muốn hạt xoáy vào trong thì phải thêm thành phần hướng tâm trước khi port #23.
2. `spawnRadius` mặc định 10 > `attractorRadius` 6 → phần lớn hạt bị damping ngay từ
   frame đầu. Cần xác nhận đây là chủ ý.
3. `particleCount = 0` hiện được chấp nhận; nếu không cần trạng thái rỗng thì nên đổi
   thành `≥ 1`.
4. Tangent chuẩn hoá theo `r` 3D nên tốc độ xoáy giảm dần khi hạt gần cực Y. Nếu ý đồ là
   xoáy quanh trục Y thuần thì nên chuẩn hoá theo `sqrt(x² + z²)`.
5. `lifetime`/respawn (M3) chưa có — `age` tăng vô hạn.
