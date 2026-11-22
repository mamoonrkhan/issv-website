# Islamic School of Silicon Valley — website redesign (proposal)

A proposed rebuild of the school website: fast, accessible, mobile-friendly, and editable by volunteers without code.

> **Status:** proposal preview. Every page shows a "not the official website" notice, and search engines are told not to index it. To launch for real, turn off **Settings → Contact, links & PDFs → Show "proposal preview" notice** in the editor.

## What's included

| Page | Path | Highlights |
|---|---|---|
| Home | `/` | "This Sunday" card (in session / virtual / no school), coming-up dates, announcements, photo strip |
| About | `/about/` | Story, mission, gallery, donate band, contact |
| New families | `/new-families/` | How joining works, FAQs |
| Calendar | `/calendar/` | Class days by month, events, holidays, **subscribe** (Apple, Outlook, Google) |
| Curriculum | `/curriculum/` | Grade tabs (KG to Youth), daily schedule, milestones |
| Parent handbook | `/families/` | Collapsible policy sections; links like `/families/#dress` open the right one |
| Registration & tuition | `/registration/` | Key dates, tuition estimator, Zelle copy-email flow, check option |
| Search | `/search/` | Instant results as you type (press <kbd>/</kbd> on any page) |
| Calendar feed | `/calendar.ics` | Generated from the calendar data; subscribed phones update automatically |
| Editor | `/admin/` | No-code editing for announcements, photos, calendar, settings and page text |

Old learnislam.org paths (`/aboutus/`, `/late-policy/`, `/reusebooks/`, `/evaluation-reports/`) redirect to the new pages.

## How it works

- **[Astro](https://astro.build)** builds plain static HTML. There's no server or database, and hosting is free.
- **All content lives in files.** `src/data/*.json` holds the calendar, handbook, curriculum, FAQs, photos and settings. `src/content/announcements/*.md` holds one announcement per file.
- **[Sveltia CMS](https://github.com/sveltia/sveltia-cms)** at `/admin/` edits those files through a friendly form. Each save is a GitHub commit, so there's full history and every mistake can be undone.
- **GitHub Actions** rebuilds and deploys on every change, and again every night so expired announcements drop off.
- **[Pagefind](https://pagefind.app)** builds the search index at build time.
- No tracking, no cookies, and no payment data is collected. The tuition estimator runs only in the browser.

## Publishing

**Right now** the live preview is served from the `gh-pages` branch (a pre-built copy of the site). It doesn't rebuild on its own yet, so editor changes won't appear until the next manual publish:

```sh
SITE_URL=https://mamoonrkhan.github.io BASE_PATH=/issv-website/ npm run build
# then push dist/ to the gh-pages branch
```

**To turn on automatic publishing** (on every edit and nightly), do this once:

1. Create a [classic token](https://github.com/settings/tokens/new) with the **repo** and **workflow** scopes.
2. Move the workflow into place and push. Use the token as the password when asked:
   ```sh
   mkdir -p .github/workflows && git mv ci/deploy.yml .github/workflows/deploy.yml
   git commit -m "Turn on automatic deploys" && git push
   ```
3. In the repo, go to **Settings → Pages → Source** and switch to **GitHub Actions**.

## Using the editor (`/admin/`)

1. Open `https://<your-username>.github.io/issv-website/admin/`.
2. Choose **Sign in with token** and paste a GitHub [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) limited to this repo, with **Contents: Read and write**.
3. Edit, then save. The site updates in about a minute.

For "Sign in with GitHub" buttons instead of tokens (nicer for other volunteers), deploy the free [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) worker and set `base_url` in `public/admin/config.yml`.

**What volunteers can edit**

- **Announcements:** title, message, show-from and hide-after dates, and a "top banner" toggle.
- **Photos:** upload, caption, alt text, and whether to show on Home. A photo is never shown unless the parent-permission box is ticked. Uploads are converted to WebP, and the build makes AVIF/WebP sizes and strips location data.
- **Calendar:** each Sunday's status (In session / Virtual / Possible virtual / No school) and note, plus events. This drives the Calendar page, the This Sunday card and the `.ics` feed.
- **This Sunday:** emergency override for weather or closures.
- **Settings:** Zelle email/name/QR, check payee, tuition and dates, contact emails, donation link, PDFs.
- **Page text:** handbook sections, curriculum by grade, FAQs.

## Running it locally (optional)

Requires Node 24+.

```sh
npm install
npm run dev       # http://localhost:4321 (search only works after a build)
npm run build     # builds to dist/ and creates the search index
npm run preview   # serves the build
```

## Needed from the school before launch

- [ ] Zelle email or phone, and the exact recipient name shown in Zelle
- [ ] Zelle QR code image (from the school's bank app)
- [ ] Check payee name and mailing address
- [ ] Greene Middle School street address and parking notes
- [ ] Installment due dates (confirm)
- [ ] Logo file, or approval of the new emblem
- [ ] Classroom photos, with parent permission
- [ ] Current PDFs and the volunteer sign-up link
- [ ] Donation link and who manages it
- [ ] OK to publish the school calendar as a subscribable feed
- [ ] Who owns `learnislam.org` today, and DNS access (to point the domain here)

## Moving it to the school

Transfer the repo to a school-owned GitHub account (**Settings → Transfer**), update `repo:` in `public/admin/config.yml`, add a custom domain under **Settings → Pages**, and give at least one school-appointed backup editor access. Netlify or Cloudflare Pages also work: build command `npm run build`, output folder `dist`.

## Project layout

```
src/
  data/                 editable content (JSON)
  content/announcements one Markdown file per announcement
  pages/                one file per page, plus calendar.ics.ts
  components/           header, footer, hero, photo, add-to-calendar…
  layouts/Base.astro    page shell, banner, menu and "/" shortcut scripts
  lib/schedule.js       This Sunday / coming-up logic (shared by build and browser)
  styles/global.css     design tokens and all styles
  assets/photos         CMS photo uploads (optimized at build)
public/admin/           the editor
.github/workflows/      deploy + nightly rebuild
```
