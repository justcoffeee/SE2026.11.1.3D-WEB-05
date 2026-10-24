# ADR-0001 — Use a modular monolith for the control plane

- Status: accepted
- Date: 2026-10-22
- Deciders: TV1 (author); to be reviewed by the team at the next sync
- Related: [`docs/architecture.md`](../architecture.md)

## Context

3D-WEB-05 is a particle lab whose GPU work runs **in the browser**. The server,
if and when it exists, holds only the control plane: identity and permissions,
saved presets, and ingestion of benchmark samples produced by clients.

Constraints that shape the decision:

- Team of 5, change requests answered within **8 hours**.
- **462 concurrent sessions**, p95 ≤ 5.0 s, operational data kept **49 days**.
- Reliability is the quality attribute under test: consistent behaviour on retry
  and on partial failure.
- Authentication/authorization is the boundary under test.
- No server code exists in this repository yet, so the cost of getting this
  wrong now is paid twice: once in code, once in retrofitting the boundary.

## Decision

Build the server as a **modular monolith**: one deployable containing `AuthZ`,
`Preset`, `Benchmark Ingestion` and `Telemetry`, each owning its own schema
inside **one** PostgreSQL instance. Module boundaries are enforced by internal
APIs and database constraints, not by the network.

Consequences that follow directly:

- Batch deduplication (`UNIQUE (run_id, batch_index)`) and the ownership check
  run in the **same transaction** as the sample insert.
- There is no window where a sample is stored but its authorization has not
  been evaluated.
- Retry idempotency is a database constraint, not a saga.

## Alternatives considered

| Option | Why not |
|---|---|
| **Layered monolith** (UI → Controller → Service → Repository) | The boundary is a convention, not a structure. A new controller can bypass the authorization service and nothing fails until production. That is precisely the failure mode this project must not have. |
| **Event-driven microservices** (Gateway, AuthZ, Preset, Ingestion split, broker between) | Requires saga/outbox for a consistency problem that a single transaction already solves, and multiplies operational surface for a team of 5 with an 8-hour CR budget. 462 concurrent sessions is not a deployable-count problem: the bottleneck is the sample write path and the permission check. |
| **Serverless functions per endpoint** | Same distributed-consistency cost as microservices, plus cold starts against a p95 target. |

**"Easier to scale" is explicitly not a reason to pick microservices here.**
Horizontal scaling of a read path is not what this workload needs.

## Consequences

Positive:

- Local transactions for the two invariants that matter (retry idempotency,
  authorization-on-write).
- One deployable, one log stream, one database to back up and retain for 49 days.
- A module can be extracted later without rewriting callers, because the
  boundary is already an internal API.

Negative:

- Vertical scaling only, until a module is extracted.
- One module leaking memory or blocking the event loop degrades everything.
- Module discipline is maintained by people and tests, not by the network.

Mitigations: per-module resource limits, an architecture test that forbids
cross-module imports outside the published module API, health checks per module.

## When to revisit

Each condition must be triggered by a **measurement**, not by opinion:

1. `pg_stat_statements` shows p95 ingestion above 5.0 s at 462 sessions →
   extract `Benchmark Ingestion`.
2. Sample volume exceeds 10× the design estimate (measured in rows/second) →
   separate the analytical store.
3. The 49-day retention job produces measurable load on the primary database →
   isolate it.
4. The team grows beyond ~12 people, or modules need independent deploy
   schedules.
5. Multi-region deployment or per-customer fault isolation becomes a contract
   requirement.
