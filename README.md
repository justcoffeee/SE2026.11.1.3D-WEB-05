# 3D-WEB-05 — GPU Particle Lab

Browser particle lab targeting WebGPU with a WebGL2 GPU fallback, two modes
(Attractor/Vortex), live controls, preset import/export, and reproducible
measurements on both backends.

**Current implementation: UI through RendererPort; GPU integration pending.**
The Canvas2D preview has been removed. The default entry point does not yet
inject an initialized renderer, so it shows unavailable with no FPS or GPU
timing. Preset import/export remains available. Nothing in the default build
currently demonstrates a running GPU simulation.

## Run and verify

Requires **Node.js >= 22.16** and npm. From the repository root:

```bash
npm ci
npx playwright install chromium  # once per machine
npm run dev                     # Vite development server
```

```bash
npm run typecheck               # source TypeScript
npm run typecheck:tests         # test TypeScript
npm test                        # Vitest unit/contract tests
npm run test:e2e                # desktop/mobile Chromium; excludes screenshots
npm run build                   # production build
npm run preview                 # serve the production build
npm run verify                  # source/tests typecheck, unit, E2E, build
```

Use the test totals reported by the current run; branch totals change as PRs
merge. CI runs `npm run verify` on PRs and configured pushes.

## What exists

- **UI / presets:** controls, preset v1 JSON validation and round-trip,
  pause/resume/reset through an injected `RendererPort`, responsive layout,
  accessibility checks, unavailable/error presentation and cleanup.
- **Port consumer:** `mountLabUI(root, port)` applies defaults once, sends one
  `applyConfig` per change, polls `getStatus`, and returns an idempotent disposer.
  It never creates or initializes a GPU backend.
- **Core:** renderer/status contracts, config identity, aggregation and result
  parsing; a shared `FakeRenderer` for tests.
- **Backend capability selection:** injectable probes and preference resolution
  are integrated; actual renderer construction and fallback still need #12/#13.
- **Simulation reference and sampling:** deterministic CPU reference steps and
  the RendererPort performance collector are integrated; GPU runtime evidence
  and wiring remain pending.
- **Schema v2:** proposal and JSON Schema are available. Runtime parsing still
  uses v1 until issue #16 and its shared config/hash decisions are implemented.
- **Verification:** UI interaction tests use an explicit
  `tests/e2e/fixtures/renderer-port.html` harness with `FakeRenderer`.
  The harness starts no GPU and its backend labels are test inputs, not runtime
  evidence. Runtime state is not selected by URL parameters: tests change the
  injected port status directly and exercise polling, failure and recovery.

## Integration still required

- TV1/TV3 initialize the real adapter, bind the canvas and inject the port from
  `src/main.ts` (issues #12/#15). With no port, UI controls for simulation are
  disabled and presets remain editable.
- Simulation kernels and backend probes on other branches/PRs are not implied
  to be part of this build. There is no renderer adapter in this baseline.
- Actual WebGPU/WebGL2 fallback, GPU numeric parity, live timing validation,
  lifetime/respawn, perf collection and the two-backend benchmark need their
  own integration and browser evidence.
- A requested backend preference takes effect at the next renderer init.
  Only `RendererStatus.actual` identifies the backend that ran.
- Unsupported/invalid GPU timing stays `null`, never a fabricated zero.
- No server, login, database or network persistence is included.

## Project references

- [Architecture and contracts](docs/architecture.md)
- [MVP acceptance](docs/01-requirements/mvp-acceptance.md)
- [Use cases](docs/01-requirements/use-cases.md) and
  [UI requirements](docs/01-requirements/ui-requirements.md)
- [Interaction specification](docs/02-design/ui-interaction-spec.md)
- [Preset v1 schema](docs/02-design/preset-schema-v1.schema.json),
  [v2 proposal](docs/02-design/preset-schema-v2-proposal.md) and
  [v2 schema](docs/02-design/preset-schema-v2.schema.json)
- [Team ownership](docs/05-management/team-ownership.md)
- [Benchmark result template](docs/06-benchmark/README.md)
- [UI port handoff and verification](docs/04-testing/UI-renderer-port-2026-10-24.md)
- [Live status handoff and verification](docs/04-testing/UI-live-status-2026-10-24.md)

## GitHub workflow

Default branch: `main`. Integration branch: `dev`.
Work starts from a tracked issue on a separate branch from current `dev`
(pattern `type/<issue-number>-slug`, e.g. `feat/9-ui-renderer-port`), then a PR into `dev`, passing CI and at
least one independent approval before merge. Do not push directly to `main`.

Request TV1 (`minhhhduc`) review for the UI port/composition boundary and README.
The GitHub Pages workflow from PR #27 is integrated into dev. Publish a live
URL or deployment badge only after promotion to main, successful deployment
and a live smoke test.
