# Benchmark results — TV1

One file per measured session, named `YYYY-MM-DD-<gpu>-<browser>.md` and
committed with the numbers. A screenshot or a chat message is not a result.

Acceptance criteria for a run: `docs/01-requirements/mvp-acceptance.md` §2.
Aggregation key: `(mode, configHash) × actual` — never merge across a hash
boundary (`docs/architecture.md` §5.1).

## Result file template

```
## Environment
Browser / version:
OS:
GPU / driver:
Repo commit:
Host: same machine for both backends? yes / no

## Configuration
Preset JSON:
configHash (64 hex):
Mode / particleCount:
Warm-up / sample count / duration (as fixed by TV5):

## Runs
| actual backend | statistic | fps | gpuTimeMs | gpuTimingAvailable | min / max |
|---|---|---|---|---|---|
| webgpu |  |  |  |  |  |
| webgl2 |  |  |  |  |  |

## Limitations
- Which protocol value was not yet fixed, or which timing path was unavailable.
- Compute on WebGL2 runs through transform feedback, not a native compute
  shader; say so rather than implying parity of mechanism.
```
