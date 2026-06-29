// Shared nerdy boot theatre — used by the postinstall hook AND the first `brello`
// run (so it shows no matter how npm handles install-script output).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const TTY = process.stdout.isTTY
const e = (n) => (s) => TTY ? `\x1b[${n}m${s}\x1b[0m` : String(s)
const cyan = e(36), dim = e(2), green = e(32), bold = e(1)
const w = (s = '') => process.stdout.write(s)
const sleep = (ms) => new Promise((r) => setTimeout(r, TTY ? ms : 0))

export function version() {
  try { return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')).version } catch { return '' }
}

export async function playBoot() {
  const v = version()
  w('\n')
  for (const line of [
    '   ╔╗ ╦═╗ ╔═╗ ╦  ╦  ╔═╗',
    '   ╠╩╗╠╦╝ ║╣  ║  ║  ║ ║',
    '   ╚═╝╩╚═ ╚═╝ ╩═╝╩═╝╚═╝',
  ]) { w(cyan(line) + '\n'); await sleep(60) }
  w(dim("   your team’s work, from the terminal") + (v ? dim('   v' + v) : '') + '\n\n')

  for (const s of ['resolving roster gateway', 'verifying cipher', 'arming mcp tools']) {
    w('   ' + cyan('▸') + ' ' + s + dim(' …')); await sleep(150); w(green(' ok') + '\n')
  }
  w('   ' + cyan('▸') + ' linking modules\n')
  for (const m of ['cli.mjs', 'mcp.mjs', 'lib/client.mjs', 'lib/auth.mjs']) {
    w('       ' + green('✓') + ' ' + dim(m) + '\n'); await sleep(80)
  }

  const N = 26
  if (TTY) {
    for (let i = 0; i <= N; i++) {
      w('\r   ' + cyan('[') + cyan('█'.repeat(i)) + dim('░'.repeat(N - i)) + cyan(']') + ' ' + String(Math.round((i / N) * 100)).padStart(3) + '%')
      await sleep(28)
    }
    w('\n')
  } else {
    w('   [' + '█'.repeat(N) + '] 100%\n')
  }

  w('\n   ' + green('✓') + ' ' + bold('brello' + (v ? ' v' + v : '')) + ' ready\n')
  w('     ' + dim('sign in:  ') + cyan('brello auth') + dim('    then:  ') + cyan('brello stats') + '\n')
  w('     ' + dim('everything:  ') + cyan('brello help') + '\n\n')
}
