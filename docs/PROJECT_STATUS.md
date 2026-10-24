# PROJECT STATUS — 3D-WEB-05

> **24/10/2026 — issue #14 draft, feat/14-ui-live-status:** the UI now has only
> RendererStatus-based state projection; synthetic backend/fixture query helpers
> are removed. Polling, failure/recovery and metric clearing are tested against
> an explicitly injected FakeRenderer. PR #32 is merged; draft PR #33 targets
> dev. GPU integration is not accepted: adapter #12/#15 and real browser evidence remain
> pending. See [live status handoff](04-testing/UI-live-status-2026-10-24.md).

> **24/10/2026 — TV4 issue #9/#25 branch checkpoint:** UI now consumes an
> injected RendererPort, with explicit FakeRenderer browser tests and no
> Canvas2D preview. Production main still has no adapter injected and shows
> unavailable; this is not GPU acceptance. README reflects this branch's
> behavior. See [handoff and verification](04-testing/UI-renderer-port-2026-10-24.md).
> Previous checkpoints below are historical, not current branch state.

> Cập nhật GitHub ngày **22/10/2026**: xem
> [snapshot theo từng nhánh và kế hoạch PR](05-management/github-progress-2026-10-22.md)
> và [kiểm tra TV4 hôm nay](04-testing/TV4-pr-verification-2026-10-22.md).
> Nội dung dưới đây là checkpoint TV4 ngày 11/10; các câu “chưa push/chưa PR”,
> pending và kết quả test bên dưới chỉ mô tả thời điểm đó.

**Cập nhật:** 11/10/2026
**Nhánh làm việc:** feat/tv4-week1-ui-ux
**Gate hiện tại:** TV4 pre-integration + quality tooling hoàn tất, chờ review contract và ghép engine.

## Đã hoàn thành phía TV4

- Use case, UI requirements, wireframe, mô tả UI và interaction spec tuần 1.
- UI responsive và Canvas2D preview trung thực về giới hạn.
- Preset schema v1, validation chặt, import/export và unit tests.
- View-model trạng thái runtime độc lập engine.
- Fixture: initializing, ready WebGPU, fallback WebGL2, unsupported, error.
- Design tokens, reduced-motion, alert/status semantics, trạng thái disabled.
- Ma trận state, test cases và tài liệu bàn giao pre-integration.
- Ajv dùng trực tiếp JSON Schema v1; Vitest thay Node test runner.
- Playwright E2E desktop/mobile, axe-core WCAG scan và ảnh evidence tự động.

## Đang chờ

- TV1 xác nhận lifecycle/API adapter và hướng hợp nhất lịch sử Git.
- TV2 xác nhận mode, range vật lý và cách apply config WebGPU.
- TV3 xác nhận fallback reason/actual backend.
- TV5 xác nhận PerformanceSnapshot, chu kỳ cập nhật và E2E/benchmark.
- Thiết lập default branch để sau theo chỉ đạo của chủ repo.
- Quality tooling ngày 11/10 đã được commit cục bộ trên nhánh TV4; chưa push/chưa mở PR.

## Kiểm tra chất lượng

| Kiểm tra | Trạng thái |
|---|---|
| Baseline typecheck | Đạt |
| Baseline unit tests | Đạt 6/6 |
| Typecheck sau thay đổi | Đạt |
| Unit tests sau thay đổi | Đạt 17/17 |
| Playwright E2E | Đạt 10/10, desktop + mobile Chromium |
| axe-core WCAG A/AA | Đạt 2 viewport × 4 state, 0 violation sau sửa contrast |
| Production build | Đạt, Vite 6.4.4, 190 modules transformed |
| Ảnh tự động | Đạt 2/2 test; 4 ảnh `automated-*` mới |

## Ba việc tiếp theo

1. Khi người dùng cho phép: push nhánh TV4 và mở PR theo chiến lược lịch sử Git do TV1 chốt.
2. TV1/TV2/TV3/TV5 review contract; sau khi có engine, mở rộng E2E/benchmark thật.
3. Chỉ mở rộng Firefox/WebKit hoặc Storybook khi có nhu cầu tích hợp cụ thể; không đổi kiến trúc UI hiện tại.
