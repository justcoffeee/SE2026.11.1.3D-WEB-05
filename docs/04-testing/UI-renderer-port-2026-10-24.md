# UI RendererPort handoff — 24/10/2026

Scope: issues #9 and #25. Baseline dev: `34221148f7dcbce4f9b67fb7313640312bee3250`.
Branch: `codex/tv4-9-ui-renderer-port`. No new dependencies or changes to preset
v1, RendererPort, main.ts, simulation kernels, or GPU adapter implementation.

## Behavior

- `mountLabUI(root, port)` consumes an already initialized RendererPort. It
  applies DEFAULT_CONFIG once, then reads status; it does not call init/start
  automatically. The composition root owns canvas binding and initialization.
- A control change applies one complete config. Mode/count changes, preset
  imports and restore-defaults then call reset. Reset alone retains config.
- Pause/resume reads port status and calls pause/start. Backend preference is
  applied as config only; changing the selection does not silently re-init.
- Poll status every 500 ms. Actual backend and nullable metrics come from the
  port. Invalid/unsupported GPU timing is unavailable, never fabricated zero.
- Return a disposer and register it for beforeunload. Both together still call
  port.dispose once; clear timers/listeners and cancel pending import effects.
- If applyConfig rejects, keep the previous UI config. Initial apply failure
  stays disabled across polling until a successful application (e.g. import).
  If reset fails after applying an import, retain the applied config and say
  explicitly that reset failed, using a safe message without backend details.

## Default build and TV1/TV3 handoff

The port argument is optional only for source compatibility with the current
one-argument main.ts bootstrap. Without a port the UI reports unavailable,
disables simulation controls and leaves preset import/export available.
The old Canvas2D renderer is removed, not retained as a fallback.

TV1/TV3 must implement #12/#15: obtain/bind the canvas, initialize the adapter,
pass it into mountLabUI and decide when to start the simulation. No GPU or
canvas-binding API has been invented in this UI change. Main.ts is untouched.
TV1 should review the initial-config/lifecycle sequencing before integration.

Full live-status acceptance and removal of historical fixture helper types
remain #14. Schema v2 implementation remains #16 with configHash/vortex
decisions pending. This PR does not accept GPU parity or benchmark results.

## Verification

Windows, Node/npm installed locally; exact dependencies installed with npm ci.

- `npm run verify` with CI=1: source/tests TypeScript, **64 unit tests**, **26
  desktop/mobile Chromium E2E tests**, production build PASS.
- After merging current dev `8f16d155` (backend capability PR #29), reran
  `npm run verify`: **78 unit tests**, **26 E2E**, typechecks/build PASS.
- Production preview checked on desktop/mobile: unavailable state, usable preset
  actions and no horizontal overflow. No fake renderer/harness in build output.
- E2E includes existing preset round-trip/invalid import and axe WCAG checks,
  and new port call-log assertions for controls, lifecycle, unavailable entry,
  initial apply recovery, reset failure sanitization, pending-file cancellation.
- FakeRenderer browser tests live in an explicit `tests/e2e/fixtures/` harness
  with a visible NO GPU warning. The production entry never reads its query.
- Two P2 defects found during independent read-only review were fixed and
  re-reviewed with no remaining blockers. Reviewer did not run tests.
- GPU runtime, numeric parity, real fallback/timing and benchmark: NOT_RUN.

The first restricted local Vitest attempt could not access runner temporary
files. A normal-permission verification run passed; no test code was changed to
hide those environment failures. No GPU performance claim follows from CI.
