// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL and BASE_PATH are set by the deploy workflow.
// Locally the site runs at http://localhost:4321/.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';
// Astro doesn't add `base` to redirect targets, so do it here.
/** @param {string} path */
const to = (path) => base.replace(/\/$/, '') + path;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  prefetch: { defaultStrategy: 'hover', prefetchAll: true },
  // Old learnislam.org paths keep working.
  redirects: {
    '/aboutus': to('/about/'),
    '/late-policy': to('/families/#arrival'),
    '/reusebooks': to('/families/#books'),
    '/evaluation-reports': to('/families/#homework'),
  },
});
