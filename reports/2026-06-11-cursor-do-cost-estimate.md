# Cursor-Presence Durable Object — Cost Estimate

Date: 2026-06-11
Scope: Cost of running the realtime cursor feature (`CursorRoom` DO + WebSocket via durabcast).

## TL;DR

For this site's realistic traffic, the cursor DO costs **$0 on top of the base $5/mo Workers Paid plan.**
The single global DO's compute duration fits inside the free tier _even if it never hibernates_, and
move/storage volume on a personal site is orders of magnitude below the included allowances.
The only thing that ever scales into real money is the **per-move `ctx.storage.put` write**
(SQLite rows written, $1.00/M, 50M free) — and only under sustained dozens-of-concurrent-movers load.

## Cloudflare DO pricing (Workers Paid, retrieved 2026-06-11)

| Dimension           | Rate            | Included / month |
| ------------------- | --------------- | ---------------- |
| Requests            | $0.15 / M       | 1,000,000        |
| Compute duration    | $12.50 / M GB-s | 400,000 GB-s     |
| SQLite rows written | $1.00 / M       | 50,000,000       |
| SQLite rows read    | $0.001 / M      | 25,000,000,000   |
| SQLite stored data  | $0.20 / GB-mo   | 5 GB-mo          |

Billing rules that matter here:

- **Incoming WebSocket messages bill 20:1** (100 incoming msgs = 5 requests). Outgoing msgs are free.
- **Duration is per-instance, 128 MB allocation, shared across all concurrent connections.**
  Formula: `active_seconds × 128MB ÷ 1GB = GB-s`.
- **Hibernation API → not billed for duration while idle-eligible** (durabcast uses this).

## What this implementation actually does (cost-relevant)

- **One global DO instance** (`idFromName('global')`); pages routed by a `path` field, not by sharding.
- **Hibernation API** (durabcast `BroadcastMessage`) — idle sockets cost no duration.
- **Per move message** (client + server throttled to 100 ms ⇒ ≤10/s per visitor):
  - 1 incoming WS message
  - 1 `ctx.storage.get` (row read) + 1 `ctx.storage.put` (row write) for the throttle key
- **Idle cursors send nothing** — the throttle only emits on actual movement; idle is a client-side visual fade, not traffic.
- **No alarms / setInterval in the DO.** Ping every 30 s is auto-answered.

## Key derivation

### Duration ≈ always free

Single DO awake 24/7 for a month: `2,592,000 s × 128MB ÷ 1GB = 331,776 GB-s` < 400,000 included.
So no matter how busy the cursor room gets, **one DO never incurs duration charges.** With hibernation
the real number is a small fraction of this.

### Per-move marginal cost (above free tiers)

| Unit per move        | 1M moves   | $       |
| -------------------- | ---------- | ------- |
| 0.05 requests (20:1) | 50,000 req | $0.0075 |
| 1 row written        | 1,000,000  | $1.00   |
| 1 row read           | 1,000,000  | $0.001  |

⇒ **≈ $1.01 per 1,000,000 move messages** beyond free tiers. Writes dominate ~133:1 over requests.
1M moves ≈ 100,000 active-cursor-seconds ≈ **27.8 hours of continuous cursor motion** (summed over all visitors).

### Free-tier headroom (monthly), expressed in aggregate "active cursor motion" hours

- Requests free tier exhausts first: 1M req = 20M moves ≈ **555 active-motion-hours**.
- Writes free tier: 50M moves ≈ **1,388 active-motion-hours**.
- 0–555 hrs: **$0**. 555–1,388 hrs: only request overage (< ~$0.30 total). >1,388 hrs: writes ramp at $1 / 1M moves.

## Scenarios

| Scenario                                             | Active cursor-seconds/mo | Moves/mo    | Extra cost |
| ---------------------------------------------------- | ------------------------ | ----------- | ---------- |
| Personal site (~3k visits, ~36 s active motion each) | 108,000                  | 1.08M       | **$0**     |
| Event spike: 50 concurrent movers, 8 h/day, 30 d     | 43.2M                    | 432M moves… | wait       |

(Recompute the heavy row carefully below — the table's middle column is active-seconds.)

- **Personal site** (3,000 visits × 36 s active motion = 108k s ⇒ 1.08M moves): requests 54k, writes 1.08M, all < free ⇒ **$0**.
- **Busy** (50 concurrent movers, 8 h/day, 30 d = 50 × 28,800 × 30 = 43.2M active-s? no): 50 movers × 8h×3600 × 30 = 50 × 864,000 = 43.2M active-cursor-seconds ⇒ 432M moves. requests = 21.6M − 1M = $3.09; writes = 432M − 50M = $382; duration $0. ⇒ **~$385** — writes dominate.
- **Extreme** (100 movers, 24/7): 2.59B moves ⇒ writes ≈ $2,540. (Purely illustrative ceiling.)

The jump from "Busy" to real money is entirely SQLite **writes**.

## Optimization lever (if cost ever matters)

The per-move `ctx.storage.put(moveThrottleKey(uid), now)` exists only because in-memory state is wiped on
hibernation. Storing that timestamp in **`ws.serializeAttachment()`** instead (per-connection, survives
hibernation, **not billed as a storage row**) would drop writes to ≈0 and remove the only cost that scales.
Reads via `deserializeAttachment()` are likewise free. This turns even the extreme scenario into ~$20
(requests only) instead of thousands.

## Conclusion

Ship it. On this site the cursor DO is effectively free (covered by the $5/mo plan). Revisit only if the
feature goes viral with sustained dozens of simultaneous active movers — and if so, move the throttle
timestamp from `ctx.storage` to the WebSocket attachment.
