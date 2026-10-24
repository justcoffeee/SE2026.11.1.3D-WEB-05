# MVP acceptance — 3D-WEB-05

Status: **proposed by TV1 on 2026-10-22.** Section 1 restates the assignment;
section 2 is TV1's criteria. Values the assignment does not establish are marked
as needing TV2/TV3/TV5 confirmation — none is invented here.

## 1. Functional completion

MVP is done when one build, in a real browser, satisfies all six:

1. Two modes (attractor, vortex) animate tens of thousands of particles on the GPU.
2. Particle count, speed, size, colour and mode coefficient change the scene live.
3. FPS is always shown; GPU timing is shown when available and reads "unavailable"
   otherwise — never `0` (INV-1, `docs/architecture.md` §3).
4. The backend that actually ran is displayed, with a working fallback where
   WebGPU is absent.
5. A preset exports and re-imports with an unchanged configuration.
6. Reset, pause/resume, and the loading/error/unsupported states work.

The Canvas 2D mock satisfies none of 1–6. Sources: `ui-requirements.md`,
`UI-FR-01..10`; division in `docs/05-management/team-ownership.md` §4.

## 2. Benchmark acceptance

A comparison counts only when every run records: browser name and version, OS,
GPU model and driver, the exported preset, its `configHash`
(`docs/architecture.md` §5.1), and the `actual` backend of each sample — never
`requested`.

**Protocol.** These values are not set by the assignment; TV2/TV3/TV5 must fix
and publish them before the first recorded run:

| Item | Requirement | Value |
|---|---|---|
| Warm-up | frames discarded before sampling starts | TBD — TV5 |
| Sample count | fixed per run, identical for both backends | TBD — TV5 |
| Duration | fixed per run; no cherry-picked samples | TBD — TV5 |
| Aggregation | one declared statistic (e.g. median), same for both backends | TBD — TV2/TV3/TV5 |

**Fair comparison.** Same build, same preset, same particle count, start from
reset, alternate WebGPU and WebGL2 on the same machine. Numbers from another
machine are not a comparison. If GPU timing is unavailable on a backend, that is
recorded as `gpuTimingAvailable: false` with `gpuTimeMs: null`, not omitted.

**Reproducibility vs advantage.** MVP requires **reproducible** measurements,
not a measurable advantage. The assignment sets no improvement threshold; a run
where WebGL2 is faster is a valid result and is reported as measured.

**Result template.** `docs/06-benchmark/README.md`. A run missing environment,
`configHash`, `actual` or sample statistics is not a result.
