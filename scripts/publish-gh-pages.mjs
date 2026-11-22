// Build the site and publish it to the `gh-pages` branch.
// Used until automatic deploys (ci/deploy.yml) are switched on. Run: npm run deploy
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// https://github.com/<owner>/<repo>.git -> https://<owner>.github.io/<repo>/
const remote = out('git', ['remote', 'get-url', 'origin']);
const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
if (!match) throw new Error(`Can't read a GitHub owner/repo from remote "${remote}"`);
const [, owner, repo] = match;
const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  SITE_URL: process.env.SITE_URL || `https://${owner.toLowerCase()}.github.io`,
  BASE_PATH: process.env.BASE_PATH || `/${repo}/`,
};

console.log(`Building for ${env.SITE_URL}${env.BASE_PATH}`);
run('npm', ['run', 'build'], { env });

const dir = mkdtempSync(join(tmpdir(), 'issv-pages-'));
try {
  cpSync('dist', dir, { recursive: true });
  writeFileSync(join(dir, '.nojekyll'), '');
  const sha = out('git', ['rev-parse', '--short', 'HEAD']);
  run('git', ['init', '-q', '-b', 'gh-pages'], { cwd: dir });
  run('git', ['add', '-A'], { cwd: dir });
  run('git', ['commit', '-q', '-m', `Publish site from ${sha}`], { cwd: dir });
  run('git', ['push', '-f', remote, 'gh-pages'], { cwd: dir });
  console.log(`\nPublished. Live in about a minute at ${env.SITE_URL}${env.BASE_PATH}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
