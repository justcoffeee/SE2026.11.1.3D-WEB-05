# GPU kernel contract — attractor (#10) & vortex (#11)

Hợp đồng giữa kernel TSL và reference step CPU (`step()` ở `src/simulations/simulation.ts`).
Khi sửa công thức, phải cập nhật đồng thời reference step, kernel và tài liệu này.

## 1. Buffer layout

`createParticleBuffers(count)` (`src/simulations/shared/particleBuffers.ts`) tạo đúng bộ
attribute của `PARTICLE_ATTRIBUTES`:

| Buffer | TSL type | Khớp reference |
|---|---|---|
| `positions` | `vec3` | `positions: Float32Array` |
| `velocities` | `vec3` | `velocities: Float32Array` |
| `ages` | `float` | `ages: Float32Array` |
| `seeds` | `uint` | `seeds: Uint32Array` |
| `count` | — | `ParticleState.count` |

`initKernel` khởi tạo cả 4 buffer và là compute node tên `Init Particles`.

## 2. Init kernel

```
u         = hash(i)                         // đều trong [0, 1)
v         = hash(i+1)
z         = 2u - 1                          // đều trong [-1, 1]
phi       = 2πv                             // đều trong [0, 2π)
rxy       = sqrt(1 - z²)
direction = (cos(phi) * rxy, z, sin(phi) * rxy)
radial    = pow(hash(i+2), 1/3)
position  = direction * spawnRadius * radial
velocity  = 0
age       = 0
seed      = uint(hash(i+3) * 0xffffffff)
```

- `direction` là **mẫu cầu đều** (uniform sphere sampling): `z` đều trên trục tung và
  `phi` đều quanh trục, nên diện tích khớp `sin(θ) dθ dφ`. Không được normalize một vector
  đều trong cube (`normalize((hash, hash, hash) - 0.5)`) vì cách đó dồn hạt về 8 góc.
- `pow(x, 1/3)` thay `cbrt` để phân bố đều theo thể tích, khớp
  `createState()` (`radius = spawnRadius * cbrt(random())`).
- Hash index: `i`, `i+1` cho hướng, `i+2` cho radial, `i+3` cho seed.
- Hash-based init **không** tái tạo đúng dãy `mulberry32` của CPU. Vì vậy không thể so
  bit-exact vị trí ban đầu giữa CPU và GPU; chỉ so được công thức step khi cùng state đầu vào
  (xem §5).
- `seeds` cùng miền giá trị `Uint32` với reference, dùng cho nhiễu/respawn sau này.

## 3. Uniform contract

| Uniform | Mặc định | Adapter phải làm gì |
|---|---|---|
| `spawnRadius` | `DEFAULT_SPAWN_RADIUS` (10) | set theo preset |
| `strength` | 1 | `config.strength` |
| `delta` | 0 | **`clampedDt * config.speed`** mỗi frame |
| `radius` | `DEFAULT_ATTRACTOR_RADIUS` (6) | `config.attractorRadius` (attractor) |
| `damping` | `DEFAULT_ATTRACTOR_DAMPING` (0.98) | `config.attractorDamping` (attractor) |
| `vortexDamping` | `DEFAULT_VORTEX_DAMPING` (0.99) | `config.vortexDamping` (vortex) |

`delta` đã gồm `speed`; kernel **không** nhân thêm `speed` để tránh nhân đôi.
Vortex dùng uniform riêng (`vortexDamping`) để adapter không vô tình dùng damping của attractor.

## 4. Công thức step (khớp reference)

```
d        = |position|
nếu d > 1e-6:
  toCenter = normalize(-position)
  tangent  = toCenter × (0, 1, 0)        // = (z/r, 0, -x/r), r = d
  v       += tangent * strength * delta
  attractor: nếu d > radius: v *= damping
  vortex:                    v *= vortexDamping
  p       += v * delta
age     += delta
```

- Thứ tự cố định: cộng vận tốc → damping → tích phân vị trí → tăng age.
- **Guard gốc toạ độ**: `normalize(vec3(0))` là `0/0` → NaN, nên cả hai kernel bọc phần
  chuyển động trong `If(distance.greaterThan(1e-6), ...)`, giống `if (r > EPSILON)` của
  reference (`EPSILON = 1e-6`). `age` tăng **ngoài** guard để hạt ở tâm vẫn già đi.
- Attractor: chỉ damping khi ra ngoài `radius`.
- Vortex: damping mỗi bước, không có lực hướng tâm (xem §6).
- Kernel không đọc `seeds`; buffer này dành cho respawn/nhiễu ở giai đoạn sau.

## 5. Kiểm chứng và parity

Hiện có (unit, chạy trong Node):

- layout buffer + default uniform;
- `initKernel` / attractor / vortex đều là compute node đúng tên, đúng `count`;
- validate `count` nguyên dương;
- vortex dùng `vortexDamping` riêng;
- `tests/unit/kernel-contract.test.ts` khoá hai tính chất không thấy được từ node graph:
  sampler cầu đều (không có `normalize(cube - 0.5)`), guard gốc toạ độ trong **cả hai**
  kernel với `age` tăng ngoài guard, và hash index trong tài liệu này khớp code.

**Chưa có numeric parity GPU** vì Vitest không chạy được WebGPU. Điều kiện để test thật:

1. Adapter #12 dựng `WebGPURenderer` + chạy `initKernel`, rồi `step` N lần với state cố định.
2. Readback `positions`/`velocities` vài hạt, so với golden values của reference step
   (`tests/unit/simulation.test.ts`, dung sai `1e-5` do khác thứ tự float).
3. Chạy trong Playwright Chromium có WebGPU; skip nếu `navigator.gpu` không khả dụng.

Cho đến lúc đó, "numeric test đối chiếu reference" của #10/#11 chỉ được bảo đảm ở mức
công thức + cấu trúc node, không phải kết quả GPU thực.

## 6. Câu hỏi mở

1. **Tangent chuẩn hoá theo `r` 3D**: hạt gần cực Y có tốc độ xoáy nhỏ dần. Nếu muốn xoay
   quanh trục Y thuần, đổi sang `r_xz = sqrt(x² + z²)` và cập nhật cả reference step.
2. **Vortex không có lực hút tâm**: bán kính gần như giữ nguyên, chỉ giảm tốc. Cần product
   xác nhận trước khi coi #11 là "xoáy quanh tâm" đúng nghĩa.
3. **Không bit-exact init**: nếu cần tái tạo đúng state CPU trên GPU, phải truyền
   `positions`/`velocities`/`seeds` từ CPU thay vì init bằng hash.
4. **`pow(x, 1/3)`** có thể lệch vài ulp so với `Math.cbrt`; chỉ ảnh hưởng phân bố, không
   ảnh hưởng công thức step.
