#!/usr/bin/env node
// Roster MCP server (stdio) — read-only, scoped by ROSTER_TOKEN.
// Gives Claude direct tools to query Brello/Roster instead of hand-written SQL.
// Register in Claude Code / claude_desktop_config.json (see README).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { callRoster } from './lib/client.mjs'

const server = new McpServer({ name: 'roster-brello', version: '1.0.0' })

const asText = (r) => ({ content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] })
const wrap = (query, mapParams = () => ({})) => async (args) => {
  try { return asText(await callRoster(query, mapParams(args || {}))) }
  catch (e) { return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true } }
}

server.tool('roster_stats', 'Team dashboard: team size, open/done/overdue cards, and how many are tracking now', {}, wrap('stats'))
server.tool('roster_team', "List the in-scope department's team members", {}, wrap('team'))
server.tool('roster_comments', 'Recent comments on the team’s cards (owner/admin comments are hidden)', {}, wrap('comments'))
server.tool('roster_overdue', 'Overdue Brello cards for the in-scope team (past due, not done)', {}, wrap('overdue'))
server.tool('roster_workload', 'Open + overdue card counts per person in scope (who is overloaded)', {}, wrap('workload'))
server.tool('roster_active', 'Who is actively tracking time right now (live Hubstaff timers) in scope', {}, wrap('active'))
server.tool('roster_search', 'Search in-scope Brello cards by title or client name', { q: z.string().describe('text to search for') }, wrap('search', a => ({ q: a.q })))
server.tool('roster_card', 'Get one Brello card by id (first 8 chars ok), if it is in your scope', { id: z.string().describe('card id or its first 8 characters') }, wrap('card', a => ({ id: a.id })))
server.tool('roster_ps_issues', 'Open Product Support issues (admin-scope tokens only)', {}, wrap('ps_issues'))
server.tool('roster_audit', 'Access log: who queried what and when (admin-scope tokens only)', {}, wrap('audit'))

await server.connect(new StdioServerTransport())
console.error('[roster-mcp] ready (read-only, scoped by ROSTER_TOKEN)')
