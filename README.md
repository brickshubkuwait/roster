# Roster

A tiny, **read-only** CLI + MCP server for querying your team's work — from the
terminal, or straight from Claude. Scoped to your department, signed-token access,
no app and no SQL.

```
$ roster stats
team size: 7
open: 24   done: 37   overdue: 5
active now: 2
```

## Install

```bash
git clone https://github.com/brickshubkuwait/roster.git
cd roster
npm install
```

Set the token you were issued (it's scoped to your team and expires):

```bash
export ROSTER_TOKEN=<your token>
node cli.mjs stats          # or: npm link  →  roster stats
```

> Don't have a token? Ask your admin to issue one for your department.

## CLI

| Command | What it shows |
|---|---|
| `roster stats` | Team dashboard — size, open / done / overdue, who's tracking |
| `roster team` | Your department's team members |
| `roster overdue` | Cards past their due date and not done |
| `roster workload` | Open + overdue cards per person |
| `roster active` | Who's tracking time right now |
| `roster comments` | Recent comments on your team's cards |
| `roster search "<text>"` | Find cards by title or client |
| `roster card <id>` | One card in detail (first 8 chars of the id) |

Run `roster help` to see them all. Full field-by-field reference: [QUERIES.md](./QUERIES.md).

## Use it from Claude (MCP)

Add this to your Claude config (`~/.claude.json` → `mcpServers`), then ask in plain
English — *"what's overdue for my team?"*, *"who's overloaded?"*:

```json
{
  "mcpServers": {
    "roster": {
      "command": "node",
      "args": ["/path/to/roster/mcp.mjs"],
      "env": { "ROSTER_TOKEN": "<your token>" }
    }
  }
}
```

## Scope & security

- **Read-only.** It can never move, edit, or delete anything.
- Your token only ever shows **your department's team and their work** — never other
  teams, leadership, or anything financial.
- The database key never leaves the server; you only ever hold a signed, expiring
  token. Every query is logged for the admin audit.

---

Read-only · scoped to your team · every query audited.
