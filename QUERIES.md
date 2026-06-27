# Roster — Query & Data Dictionary

This is the reference for **what data the read-only Roster gateway exposes**, for whom, and in what shape. It is the source of truth for every query the CLI, MCP, or a raw POST can run.

- **Backend:** `supabase/functions/roster-query/index.ts` — holds the DB service-role key, verifies the signed token, scopes every result by department, and logs every request to `roster_access_log`.
- **Client:** `roster-mcp/lib/client.mjs` (shared core), `cli.mjs` (CLI), `mcp.mjs` (MCP server).
- **Everything is READ-ONLY.** No query writes to the database. No mutations are possible.

---

## Access model

Every request carries a **signed token** (HS256 JWT, minted only with the keychain secret `roster-mcp-secret`). The token's `depts` claim is the entire scope:

| Token kind | `depts` claim | What it can see |
|---|---|---|
| **Admin** | `["*"]` | All departments, all cards/comments/timers, plus the two admin-only queries. |
| **Lead (team-lead view)** | e.g. `["Video Edit"]` | Only that department's team, and that team's cards / comments / stats. |

A lead token **never** reveals the OWNER (your admin, `U071KE8UYP5`), the **Leadership** department, or any **super_admin / admin** — not their names, cards, comments, or timers. This "privacy fence" is the `HIDDEN` set built server-side (`index.ts` lines 56-61).

`token` and `query` are required; an unscoped token (`depts` empty) is rejected with `403`.

### How to call

```bash
# Mint test tokens (needs the keychain secret — admin only):
cd roster
node gen-token.mjs "Video Edit"   2>/dev/null   # → a LEAD token
node gen-token.mjs "*"            2>/dev/null   # → an ADMIN token

# Run a query via the CLI:
ROSTER_TOKEN=<token> node cli.mjs <stats|team|overdue|workload|active|comments|search "x"|card <id>|ps-issues|audit>

# Or POST the edge function directly:
curl -s https://sfmdwoxlyvajiutdmqok.supabase.co/functions/v1/roster-query \
  -H 'apikey: sb_publishable_GLPRkt0_28FOmSuLPqqTHw_6SxNletR' \
  -H 'content-type: application/json' \
  -d '{"token":"<tok>","query":"<q>","params":{}}'
```

> Tokens are secrets. Never paste a real token into a file, a ticket, or a commit.

### Common response envelope

Every successful query returns:

```json
{ "ok": true, "scope": "Video Edit", "count": <n>, "data": <array|object> }
```

`scope` is `"all departments"` for an admin token, or the comma-joined department list for a lead token.

### Command ↔ query name mapping

The CLI/MCP use hyphenated/underscored names; the gateway query strings are below. `ps-issues` (CLI) → `ps_issues` (query); MCP tool `roster_ps_issues` → `ps_issues`; likewise `roster_*` for the rest.

---

## Query reference

| Query | Answers | Admin-only | Fields returned (per row) | Params |
|---|---|:--:|---|---|
| `stats` | Team dashboard: size + open/done/overdue card counts + how many are tracking time now | No | `team_size`, `total_cards`, `open`, `done`, `overdue`, `active_now` (single object, not array) | — |
| `team` | The in-scope department's team roster | No | `slack_user_id`, `name`, `department`, `roster_role`, `hubstaff_enabled` | — |
| `overdue` | Cards past their due date and not marked complete, for the in-scope team | No | `id` (first 8 chars), `card`, `client`, `assignee`, `list`, `due`, `done` | — |
| `workload` | Open + overdue card counts grouped per person in scope | No | `person`, `open`, `overdue` | — |
| `active` | Who is tracking time right now (live Hubstaff timers) in scope | No | `person`, `card`, `since` | — |
| `comments` | Recent comments on the team's cards (owner/admin comments stripped) | No | `card`, `by`, `comment` (≤160 chars), `at` | — |
| `search` | In-scope cards whose title or client name contains the text | No | `id` (first 8), `card`, `client`, `assignee`, `list`, `due`, `done` (≤50 rows) | `q` (required) |
| `card` | One card by id (or its first 8 chars), only if in your scope | No | `id` (full), `card_name`, `client_name`, `department`, `assignee_slack_id`, `list_id`, `due_date`, `due_complete`, `priority`, `created_at`, `list`, `assignee` | `id` (required) |
| `ps_issues` | Open Product Support board issues | **Yes** | `issue`, `status`, `type`, `reported` | — |
| `audit` | Access log — who queried what, when | **Yes** | `when`, `who`, `scope`, `query`, `params` | `limit` (default 60, max 500) |

A non-admin token calling `ps_issues` or `audit` gets `{"error":"... is admin-scope only"}` with HTTP `403`.

---

## Per-query detail + output shapes

### `stats` — team dashboard (not admin-only)
Counts derived from the in-scope card set; `active_now` counts live Hubstaff timers for the team (excluding hidden owner/admins). `data` is a single object.

```json
{ "ok": true, "scope": "Video Edit", "count": 1,
  "data": { "team_size": 7, "total_cards": 56, "open": 20, "done": 36, "overdue": 4, "active_now": 0 } }
```

### `team` — department roster (not admin-only)
The active members of the scoped department(s).

```json
{ "ok": true, "scope": "Video Edit", "count": 7,
  "data": [ { "slack_user_id": "U073TM1A46P", "name": "Joshin Samuel",
              "department": "Video Edit", "roster_role": "video_editor", "hubstaff_enabled": true } ] }
```

### `overdue` — past-due open cards (not admin-only)
Cards with a `due_date` before today and `due_complete = false`, sorted by due date ascending. Rows are "slim" card shape.

```json
{ "ok": true, "scope": "Video Edit", "count": 4,
  "data": [ { "id": "a1b2c3d4", "card": "Edit reel v2", "client": "FoodHall",
              "assignee": "Mahmoud Hesham", "list": "In Progress", "due": "2026-06-20", "done": false } ] }
```

### `workload` — load per person (not admin-only)
Open (not-complete) cards bucketed by assignee, with how many of those are overdue. Sorted by `open` descending.

```json
{ "ok": true, "scope": "Video Edit", "count": 6,
  "data": [ { "person": "Mahmoud Hesham", "open": 8, "overdue": 3 } ] }
```

### `active` — live timers (not admin-only)
Who currently has a live Hubstaff timer, and which card they are on.

```json
{ "ok": true, "scope": "Video Edit", "count": 1,
  "data": [ { "person": "Thahir Jabbar", "card": "Edit reel v2", "since": "2026-06-27T16:40:00Z" } ] }
```

### `comments` — recent card comments (not admin-only)
Up to 40 recent, non-deleted comments on the team's cards. Each comment body is collapsed and truncated to 160 chars. Comments authored by hidden owner/admins are removed.

```json
{ "ok": true, "scope": "Video Edit", "count": 12,
  "data": [ { "card": "Edit reel v2", "by": "Mahmoud Hesham",
              "comment": "uploaded the final cut, pending review", "at": "2026-06-26" } ] }
```

### `search` — find cards (not admin-only)
Case-insensitive substring match on card title **or** client name, within scope. Capped at 50 rows. Slim card shape.

```json
{ "ok": true, "scope": "Video Edit", "count": 3,
  "data": [ { "id": "a1b2c3d4", "card": "Edit reel v2", "client": "FoodHall",
              "assignee": "Mahmoud Hesham", "list": "In Progress", "due": "2026-06-20", "done": false } ] }
```

Missing `q` → `{"error":"params.q required"}` (HTTP 400).

### `card` — one card (not admin-only)
Looks up a single card by full id or its first 8 chars. Returns `null` with a `note` if the id is not in your scope (rather than leaking existence). This is the only query that returns the **full, un-slimmed** card fields.

```json
{ "ok": true, "scope": "Video Edit", "count": 1,
  "data": { "id": "a1b2c3d4-....", "card_name": "Edit reel v2", "client_name": "FoodHall",
            "department": "Video Edit", "assignee_slack_id": "U0AK2LRR9S9", "list_id": "...",
            "due_date": "2026-06-20", "due_complete": false, "priority": "high",
            "created_at": "2026-06-10T...", "list": "In Progress", "assignee": "Mahmoud Hesham" } }
```

Out of scope → `{ "ok": true, "count": 0, "data": null, "note": "not found in your scope" }`. Missing `id` → `{"error":"params.id required"}` (HTTP 400).

### `ps_issues` — Product Support board (**ADMIN ONLY**)
Open cards on the Product Support board, newest first. Lead tokens are rejected.

```json
{ "ok": true, "scope": "all departments", "count": 9,
  "data": [ { "issue": "Roster grid lag on Safari", "status": "Triage",
              "type": "bug", "reported": "2026-06-25" } ] }
```

Lead token → `{"error":"ps_issues is admin-scope only"}` (HTTP 403).

### `audit` — access log (**ADMIN ONLY**)
The `roster_access_log` rows, newest first. `limit` defaults to 60, max 500. This query is **not** itself logged.

```json
{ "ok": true, "scope": "all departments", "count": 60,
  "data": [ { "when": "2026-06-27 19:59", "who": "Video Edit", "scope": "Video Edit",
              "query": "team", "params": "" } ] }
```

Lead token → `{"error":"audit is admin-scope only"}` (HTTP 403).

---

## Known privacy / audit caveats

These are **verified behaviors** of the current code. They are documented here so callers know exactly what the data dictionary above does and does not guarantee. (Fixes are tracked separately.)

- **HIGH — `team` bypasses the privacy fence.** The `team` handler returns the raw resolved roster **without applying `HIDDEN`** (`index.ts` line 83-84). A token scoped to `depts:["Leadership"]` therefore returns the full Leadership roster **including the owner your admin** (`U071KE8UYP5`). Any lead token scoped to a department that contains a hidden person would expose that person's name via `team`, contradicting the "never reveal owner/Leadership/admins by name" rule that `cards`/`comments`/`stats` enforce. **Until fixed, `team` is the one query whose output is not privacy-fenced.**

- **MEDIUM — `active` does not apply `HIDDEN`.** Unlike `stats.active_now` (which filters `&& !HIDDEN.has(...)`, line 165), the `active` handler filters only by `ALL || ids.has(...)` (line 117). A department lead whose team includes a person who is also an admin (e.g. Joshin Samuel, `U073TM1A46P`, Video Edit **and** admin → in `HIDDEN`) would surface that person's live timer + card via `active`, even though `stats` deliberately hides them. Currently latent (no such timer live), but the same privacy rule is enforced inconsistently across the two queries.

- **MEDIUM — the access log records `ok: true` before authorization.** The audit insert (lines 43-45) hardcodes `ok: true` at the top of the handler, **before** the admin-only `403` checks for `ps_issues` (line 134) and `audit` (line 178). A lead token **denied** `ps_issues`/`audit` is logged identically to a successful access — verified live (a Video Edit lead's denied `ps_issues` request appears in `roster_access_log` with `ok=true` and its params). The audit trail cannot currently distinguish authorized access from a non-admin probing the admin-only queries.

- **LOW — collaborator path is not department-checked.** In `scopedCards` (line 75) the `HIDDEN` guard is applied only to `assignee_slack_id`. A card owned by a non-hidden person in **another** department but collaborated-on by an in-scope member would be in scope (exposing its title, client, and the other-dept assignee's name). Currently zero such cards exist, but the rule is broader than "this department's team plus their cards."

- **LOW — a lead's own admin teammate is over-hidden.** Because `HIDDEN` includes anyone with `app_role IN ('admin','super_admin')`, a department lead who is themselves an admin (e.g. Joshin, the Video Edit lead) has **their own** cards dropped from `overdue`/`workload`/`search`/`card`/`stats` and their comments stripped from `comments` — yet they still appear in `team`. Their own numbers will look incomplete. This is a correctness/usability bug, not a leak.
