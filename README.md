# roster-cli-mcp

Query your team's work from the terminal, or straight from Claude. A small CLI and
MCP server for Roster. No app, no SQL.

```
$ roster stats
team size: 7
open: 24   done: 37   overdue: 5
active now: 2
```

## Install

```bash
git clone https://github.com/brickshubkuwait/roster-cli-mcp.git
cd roster-cli-mcp
npm install
```

Set your token, then run anything:

```bash
export ROSTER_TOKEN=<your token>
node cli.mjs stats          # or: npm link  →  roster stats
```

> Need a token? Ask your admin to issue one.

## CLI

| Command | What it shows |
|---|---|
| `roster stats` | Team dashboard — size, open / done / overdue, who's tracking |
| `roster team` | Your team members |
| `roster overdue` | Cards past their due date and not done |
| `roster workload` | Open + overdue cards per person |
| `roster active` | Who's tracking time right now |
| `roster comments` | Recent comments on your team's cards |
| `roster search "<text>"` | Find cards by title or client |
| `roster card <id>` | One card in detail (first 8 chars of the id) |

Run `roster help` to see them all. Full reference: [QUERIES.md](./QUERIES.md).

## Use it from Claude (MCP)

Add this to your Claude config (`~/.claude.json` → `mcpServers`), then ask in plain
English — *"what's overdue for my team?"*, *"who's overloaded?"*:

```json
{
  "mcpServers": {
    "roster": {
      "command": "node",
      "args": ["/path/to/roster-cli-mcp/mcp.mjs"],
      "env": { "ROSTER_TOKEN": "<your token>" }
    }
  }
}
```
