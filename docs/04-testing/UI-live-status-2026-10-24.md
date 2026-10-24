# Live RendererStatus UI — issue #14, 24/10/2026

Branch: `feat/14-ui-live-status`, following `type/<issue-number>-slug`.
Initial baseline: PR #32, commit `ed914c0b5831e4e4cb67058aee014662bb9df684`.
PR #32 merged into dev at `1c466d2b164ed9731bea9dacc125f23f0385fda1`;
PR #33 now targets dev. The merged dev tree matches the initial baseline.

## Completed UI work

- Removed synthetic runtime backend values, fixture key types, query parsers and
  preview-FPS helpers from source; removed URL-driven state from browser tests.
- RendererStatus.actual remains the only backend identity. Requested preference
  explains automatic fallback; it never replaces actual in the backend card.
- Finite, nonnegative values are displayed only with appropriate availability.
  Unavailable/invalid timing and measurements retained while paused are hidden.
  A measured zero is still a valid value when timing is available and running.
- Existing polling now has regression coverage for ready → fallback →
  unavailable → error → recovery and clearing old metrics/notices.
- Tests use an explicit controlled FakeRenderer with no production query path.
  Shared RendererPort, collector, preset v1, physics and main.ts are unchanged.

## Verification

`CI=1 npm run verify`: **102 unit tests**, **30 desktop/mobile Chromium E2E**,
source/test typecheck and production build PASS.
The browser suite includes axe WCAG A/AA checks for all four runtime phases.
Read-only independent review reported no blocking findings; reviewer did not
run tests. Source/E2E scans confirm the old query and synthetic backend tokens
have been removed from `src/ui` and `tests/e2e`.

## Remaining integration gate

This is a draft UI candidate, not closure of #14. #32/#9/#25 are merged,
but adapter #12 plus composition root #15 are absent on the inspected baseline.
Real renderer/backend/timing verification is NOT_RUN. Current port has no frame
timestamp or measurement-age field, so UI cannot independently determine the
freshness of numeric values while a producer claims it is running.

PR #33 targets dev after #32 merged; CI checks the candidate against that base.
After #12/#15, exercise the same UI with actual WebGPU/WebGL2, forced fallback
and unavailable/error paths before marking #14 accepted. No default branch,
release, deployment or shared preset/configHash decision is changed here.

## Other TV4 work

#16 (preset v2 adoption) remains blocked on the configHash field-set decision
owned by TV1 and the public Vortex parameter/default mapping with TV2/TV3.
The current v2 schema contains vortexStrength only, while reference kernels
use vortexDamping too. No speculative schema/type migration was introduced.
