// Shared core for the Roster CLI + MCP. Holds NO database key — it only sends your
// ROSTER_TOKEN to the roster-query gateway, which resolves what you can see.
const ROSTER_URL = process.env.ROSTER_URL || 'https://sfmdwoxlyvajiutdmqok.supabase.co/functions/v1/roster-query'
// Public publishable key (already shipped in the web app; RLS-protected) — only the
// gateway needs it. The real access control is the ROSTER_TOKEN.
const APIKEY = process.env.ROSTER_APIKEY || 'sb_publishable_GLPRkt0_28FOmSuLPqqTHw_6SxNletR'

export async function callRoster(query, params = {}) {
  const token = process.env.ROSTER_TOKEN
  if (!token) {
    throw new Error('ROSTER_TOKEN is not set. Ask your admin for a token, then `export ROSTER_TOKEN=...`')
  }
  let res
  try {
    res = await fetch(ROSTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: APIKEY, Authorization: `Bearer ${APIKEY}` },
      body: JSON.stringify({ token, query, params }),
    })
  } catch (e) {
    throw new Error(`Network error reaching roster-query: ${e.message}`)
  }
  let j
  try { j = await res.json() } catch { throw new Error(`HTTP ${res.status} (non-JSON response)`) }
  if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`)
  return j
}

export const QUERIES = {
  stats:     { desc: 'Team dashboard: team size, open/done/overdue cards, who is active now' },
  team:      { desc: 'Your team members' },
  overdue:   { desc: 'Overdue cards for your team (past due, not done)' },
  workload:  { desc: 'Open + overdue card counts per person' },
  active:    { desc: 'Who is tracking time right now (live Hubstaff timers)' },
  comments:  { desc: 'Recent comments on your team’s cards' },
  search:    { desc: 'Search cards by title/client', params: ['q'] },
  card:      { desc: 'One card by id (first 8 chars ok)', params: ['id'] },
  ps_issues: { desc: 'Open Product Support issues (admin only)' },
  audit:     { desc: 'Access log — who queried what, when (admin only)' },
}
