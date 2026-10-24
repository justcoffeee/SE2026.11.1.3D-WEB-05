# WebGL2 simulation strategy — evidence

Status: **evidence only; no option agreed.** TSL compute through WebGL2
transform feedback is the *preferred candidate*. The decision belongs to
TV2 + TV3 ([`05-management/team-ownership.md`](../05-management/team-ownership.md)
§7, item 1) and they have not confirmed it. Nothing here is implemented.

Question: the particle simulation must run on the GPU. Given the one-adapter,
`forceWebGL` decision ([`architecture.md`](../architecture.md) §4), what runs
the particle step on the WebGL2 backend?

## 1. What `three@0.186.1` actually does

Read from the published build `three@0.186.1/build/three.webgpu.js` (the
package is not a dependency of this repository; the file was inspected directly
from the npm tarball):

- `WebGLBackend.createComputePipeline()` compiles the TSL compute node as a
  **vertex shader**, attaches a no-op fragment shader, and declares its outputs
  with `gl.transformFeedbackVaryings(..., SEPARATE_ATTRIBS)` — lines
  75732–75775.
- `WebGLBackend.compute()` enables `gl.RASTERIZER_DISCARD`, binds a
  transform-feedback object and calls `gl.beginTransformFeedback(gl.POINTS)` —
  line 74913 onward.
- `WebGLBackend.beginCompute()` opens a `TimestampQuery.COMPUTE` query, so
  compute timing has a WebGL2 path as well.

Consequence: a TSL `Fn(...).compute(count)` runs natively on WebGPU and through
transform feedback on WebGL2, from **one** source. No second copy of the
simulation rules is required.

## 2. Constraints visible in the same file

- Indirect dispatch is unsupported: `count` must be a single number. An array
  hits `warnOnce('WebGLBackend.compute(): The count parameter must be a single
  number, not an array.')` inside `compute()`.
- Transform feedback writes one varying per invocation. Element-wise update
  (`storageBuffer.element(i).assign(...)`) maps directly onto it; scatter writes
  to arbitrary indices and atomics do not.
- "Compute" on WebGL2 is vertex-stage work with fragment output discarded, not
  a native compute shader. Reports must say so.

## 3. Options

| Option | Fits the one-adapter decision | Duplicates the rules | Verdict |
|---|---|---|---|
| TSL compute node, same source for both backends | Yes | No | Preferred: three already maps it to transform feedback |
| Ping-pong render targets + fragment shader (`GPUComputationRenderer` pattern) | Only with a separate material tree | Yes | Fallback if the state update needs scatter or atomics |
| Raw WebGL2 transform feedback outside three | No — bypasses the adapter | Yes | Rejected |
| CPU stepping | No — the premise is GPU simulation | Yes | Rejected |

## 4. What TV2 and TV3 must confirm

1. **Element-wise state.** Does the particle update map one invocation to one
   particle, so that transform feedback's per-invocation varying write is
   sufficient?
2. **No scatter, no atomics.** Does the update avoid writing to an index other
   than the invocation's own, and avoid atomic accumulation? Transform feedback
   cannot express either.
3. **Supported `count`.** Is `count` the fixed particle count per step, never
   an array and never indirect? `compute()` falls back to `count[0]` with a
   `warnOnce` on an array.
4. **Compute timing.** Does `TimestampQuery.COMPUTE` return a usable number
   under `EXT_disjoint_timer_query_webgl2`, or must `gpuTimingAvailable` be
   false on the WebGL2 backend?

If 1 or 2 fails, the TSL compute path is insufficient and the ping-pong option
returns. Until all four are answered, do not write a second stepping path.
