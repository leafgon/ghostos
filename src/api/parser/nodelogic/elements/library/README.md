# Leafelement Library Notes

## `cortex`

The `cortex` leafelement consumes bottles named `intent` and emits bottles named `outcome`.
It is a client of the public leaf-server Cortex edge only; provider and AI work must remain
behind `/api/cortex/jobs`.

Intent content is treated as untrusted input. The node builds a normalized request body from
allow-listed Cortex fields, rejects callback fields, ignores client-supplied authority and
transport fields, and submits accepted jobs to `/api/cortex/jobs`. Both `mode: "sync"` and
`mode: "async"` use the same runtime path: submit for a `202 accepted` job response, then poll
the accepted `resultUrl` until the result is terminal or bounded polling is exhausted.

If `intent.idempotencyKey` is valid, the node sends it as the operation key. Otherwise the key is
derived as SHA-256 over canonical JSON containing the executing `refnode`, stable bottle identity,
normalized intent fields, normalized Cortex request body without the key, and stable semantic
intent fields. Volatile transport fields such as timestamps, request IDs, headers, credentials,
and retry counters are excluded. Identical normalized intents therefore collapse into one effective
Cortex submission; callers that need intentional repeats should provide a distinct stable
`intentId` label/content field or an explicit `idempotencyKey`.

Outcomes are constructed from an allow-listed schema only. Raw Cortex API response envelopes and
unrecognized response fields are not passed through to downstream nodes.
