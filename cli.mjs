#!/usr/bin/env node
// Roster CLI — query your team's work via your ROSTER_TOKEN.
//   roster stats | team | overdue | workload | active | comments
//   roster search "<text>"   roster card <id>   roster help
import { callRoster, QUERIES } from './lib/client.mjs'

const [, , cmd, ...rest] = process.argv

// command -> { q: query name, arg: hint, admin: bool }
const COMMANDS = {
  stats:       { q: 'stats' },
  team:        { q: 'team' },
  overdue:     { q: 'overdue' },
  workload:    { q: 'workload' },
  active:      { q: 'active' },
  comments:    { q: 'comments' },
  search:      { q: 'search', arg: '"<text>"' },
  card:        { q: 'card', arg: '<id>' },
  'ps-issues': { q: 'ps_issues', admin: true },
  audit:       { q: 'audit', admin: true },
}

function table(rows) {
  if (!rows || !rows.length) { console.log('  (nothing here right now)'); return }
  if (typeof rows[0] !== 'object') { rows.forEach(r => console.log('  ' + r)); return }
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))]
  const w = Object.fromEntries(cols.map(c => [c, Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length))]))
  const line = cells => cols.map(c => String(cells[c] ?? '').padEnd(w[c])).join('  ')
  console.log('  ' + line(Object.fromEntries(cols.map(c => [c, c.toUpperCase()]))))
  console.log('  ' + cols.map(c => '-'.repeat(w[c])).join('  '))
  rows.forEach(r => console.log('  ' + line(r)))
}

function printObject(o) {
  // A clean key: value list (used for stats + a single card) instead of raw JSON.
  if (o == null) { console.log('  (nothing here right now)'); return }
  const w = Math.max(...Object.keys(o).map(k => k.length))
  for (const [k, v] of Object.entries(o)) console.log('  ' + (k.replace(/_/g, ' ') + ':').padEnd(w + 2) + (v ?? '—'))
}

function help() {
  console.log('\nRoster CLI\n')
  for (const [c, def] of Object.entries(COMMANDS)) {
    const label = (c + (def.arg ? ' ' + def.arg : '')).padEnd(20)
    console.log('  roster ' + label + (QUERIES[def.q]?.desc || '') + (def.admin ? '  (admin only)' : ''))
  }
  console.log('\n  First set your token:  export ROSTER_TOKEN=<token from your admin>')
  console.log('  Then try:             roster stats\n')
}

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { help(); process.exit(0) }
const def = COMMANDS[cmd]
if (!def) { console.error(`I don't know "${cmd}".`); help(); process.exit(1) }

const params = {}
if (def.q === 'search') {
  params.q = rest.join(' ').trim()
  if (!params.q) { console.error('Add what to search for, e.g.   roster search "reel"'); process.exit(1) }
}
if (def.q === 'card') {
  params.id = (rest[0] || '').trim()
  if (!params.id) { console.error('Add a card id (first 8 chars are fine), e.g.   roster card 1c11685c'); process.exit(1) }
}

try {
  const r = await callRoster(def.q, params)
  console.log(`\n${cmd.toUpperCase()}  —  ${r.count} result${r.count === 1 ? '' : 's'}\n`)
  if (Array.isArray(r.data)) table(r.data)
  else printObject(r.data)
  if (r.note) console.log('\n  note: ' + r.note)
  console.log('\n  (run `roster help` to see everything you can ask)\n')
} catch (e) {
  const m = e.message || String(e)
  if (/ROSTER_TOKEN/.test(m)) console.error('✖ No token set. Ask your admin for your token, then run:  export ROSTER_TOKEN=<token>')
  else if (/invalid or expired/.test(m)) console.error('✖ Your token is invalid or has expired — ask your admin for a fresh one.')
  else if (/admin-scope only/.test(m)) console.error('✖ That one is admin-only — your token does not have access.')
  else console.error('✖ ' + m)
  process.exit(1)
}
