#!/usr/bin/env node
// Nerdy install theatre — runs on `npm i -g brello` (postinstall hook).
// MUST never throw: a failing postinstall aborts the whole install. npm hides
// postinstall output unless `--foreground-scripts`, so the CLI also replays this
// on first run (see cli.mjs) as a guaranteed fallback.
if (process.env.npm_config_loglevel === 'silent' || process.env.CI) process.exit(0)
try {
  const { playBoot } = await import('./banner.mjs')
  await playBoot()
} catch { /* never break an install */ }
process.exit(0)
