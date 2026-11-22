# Islamic School of Silicon Valley website (redesign proposal)

A proposed new website for the Islamic School of Silicon Valley. It's fast, works well on phones, meets accessibility standards, and volunteers can update it without writing code.

**Live preview:** https://mamoonrkhan.github.io/issv-website/

> This is a proposal, not the school's official site. Every page says so, and search engines are asked not to index it. The notice is one setting (`previewNotice` in `src/data/site.json`, or **Settings → Contact, links & PDFs** in the editor).

## Contents

- [What's on the site](#whats-on-the-site)
- [Editing content](#editing-content)
- [Publishing](#publishing)
- [Developing locally](#developing-locally)
- [How it's built](#how-its-built)
- [Before launch](#before-launch)
- [Handing it over to the school](#handing-it-over-to-the-school)

## What's on the site

| Page | Path | What it does |
|---|---|---|
| Home | `/` | "This Sunday" card (in session, virtual or no school), upcoming dates, announcements, photos |
| About | `/about/` | Story, mission, gallery, donations, contact |
| New families | `/new-families/` | How joining works, common questions |
| Calendar | `/calendar/` | Class days by month, events, holidays, one-tap subscribe for Apple, Outlook and Google |
| Curriculum | `/curriculum/` | Tabs for each grade (KG to Youth Group), daily schedule, milestones |
| Parent handbook | `/families/` | Policies in collapsible sections. Links like `/families/#dress` open the right one |
| Registration & tuition | `/registration/` | Key dates, tuition estimator, Zelle and check instructions |
| Search | `/search/` | Results as you type. Press <kbd>/</kbd> on any page to jump here |
| Calendar feed | `/calendar.ics` | Subscribed calendars update automatically |
| Editor | `/admin/` | No-code editing (see below) |

Old learnislam.org links (`/aboutus/`, `/late-policy/`, `/reusebooks/`, `/evaluation-reports/`) redirect to the matching new page.

## Editing content

Open **`/admin/`** on the live site. You'll edit content through forms, and each save becomes a commit in this repo, so every change is recorded and can be undone.

**Signing in:** choose **Sign in with token** and paste a GitHub [fine-grained token](https://github.com/settings/personal-access-tokens/new) with access to this repo only and the **Contents: Read and write** permission. (For a "Sign in with GitHub" button instead, deploy the free [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) worker and set `base_url` in `public/admin/config.yml`.)

| Section | What you can change |
|---|---|
| Announcements | Title, message, show-from and hide-after dates, top banner on or off. Expired posts hide by themselves. |
| Photos | Upload, caption, description, show on Home. A photo only appears once the parent-permission box is ticked. |
| Calendar | Each Sunday's status (in session, virtual, possible virtual, no school) and note, plus events. Updates the Calendar page, the This Sunday card and the calendar feed. |
| This Sunday | Emergency override for weather or closures |
| Settings | Zelle details and QR code, check payee, tuition and dates, emails, donation link, PDFs |
| Page text | Handbook sections, curriculum by grade, new-family questions |

> **Right now, saved edits don't appear on the live site until it's republished** (see below). Turning on automatic publishing fixes this.

## Publishing

### Current setup: manual

The live site is a built copy stored on the `gh-pages` branch. To publish the latest content:

```sh
npm install      # first time only
npm run deploy
```

This builds the site and pushes it to `gh-pages`. It's live about a minute later.

### Recommended: automatic

The workflow in [`ci/deploy.yml`](ci/deploy.yml) rebuilds the site on every change (including editor saves) and every night, which also keeps the This Sunday card and announcement dates current. It's parked in `ci/` because adding a workflow needs a GitHub token with the `workflow` scope. To turn it on, once:

1. Create a [classic token](https://github.com/settings/tokens/new) with the **repo** and **workflow** scopes.
2. Move the file into place and push. When git asks for a password, paste the token.
   ```sh
   mkdir -p .github/workflows
   git mv ci/deploy.yml .github/workflows/deploy.yml
   git commit -m "Turn on automatic deploys"
   git push
   ```
3. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

After that, `npm run deploy` and the `gh-pages` branch are no longer needed.

## Developing locally

Requires [Node.js](https://nodejs.org) 22.23 or newer (24 recommended, see `.nvmrc`).

```sh
npm install
npm run dev       # http://localhost:4321 (search works only after a build)
npm run build     # build to dist/ and create the search index
npm run preview   # serve the build
npm run check     # type-check
```

### Project layout

```
src/
  data/                     content the editor changes (JSON)
  content/announcements/    one Markdown file per announcement
  pages/                    one file per page, plus calendar.ics.ts
  components/               header, footer, hero, photo, add-to-calendar…
  layouts/Base.astro        page shell: banners, header, footer, site-wide scripts
  lib/schedule.ts           This Sunday and upcoming-dates logic (build and browser)
  lib/url.ts, images.ts     base-path links, image lookup
  styles/global.css         design tokens and all styles
  assets/photos, uploads/   images uploaded in the editor (optimized at build)
public/
  admin/                    the editor (Sveltia CMS) and its config
  docs/                     PDFs uploaded in the editor
scripts/publish-gh-pages.mjs  `npm run deploy`
ci/deploy.yml               GitHub Actions workflow (see Publishing)
```

### Conventions

- **Content lives in `src/data` and `src/content`, never in page markup.** If something should be editable, add it to a data file and to `public/admin/config.yml`.
- **Styles live in `src/styles/global.css`.** Use the design tokens (`--green-700`, `--muted`…) and existing classes. Layout helpers (`stack`, `pt-48`, `mb-12`…) are at the end of the file.
- **Internal links go through `u()`** from `src/lib/url.ts`, so they work when the site is served from a sub-path like `/issv-website/`.
- **Dates are `YYYY-MM-DD` strings in Pacific time.** Use the helpers in `src/lib/schedule.ts`.

## How it's built

- **[Astro](https://astro.build)** turns the pages into plain static HTML. There's no server or database, and hosting is free.
- **[Pagefind](https://pagefind.app)** builds the search index during the build. Hand-picked answers in `src/pages/search.astro` add synonyms (for example, "hijab" finds the dress code).
- **[Sveltia CMS](https://github.com/sveltia/sveltia-cms)** powers `/admin/`. It edits the files in `src/data` and `src/content` and commits them to GitHub.
- **Images** uploaded in the editor are resized and converted to AVIF and WebP at build time, and location data is stripped.
- **Self-hosted fonts:** Inter, Source Serif 4, and Amiri for the Arabic.
- **No tracking and no cookies.** The tuition estimator runs only in the browser and sends nothing.

## Before launch

Information needed from the school:

- [ ] Zelle email or phone, and the recipient name exactly as Zelle shows it
- [ ] Zelle QR code image (from the school's bank app)
- [ ] Check payee name and mailing address
- [ ] Greene Middle School street address and parking notes
- [ ] Confirmed installment due dates
- [ ] Logo, or approval of the new emblem
- [ ] Classroom photos, with parent permission
- [ ] Current PDFs and the volunteer sign-up link
- [ ] Donation link, and who manages it
- [ ] OK to publish the school calendar as a subscribable feed
- [ ] Who owns `learnislam.org`, and DNS access

## Handing it over to the school

1. Transfer the repo to a school-owned GitHub account (**Settings → Transfer ownership**).
2. Update `repo:` in `public/admin/config.yml` to the new owner.
3. Turn on automatic publishing (see [Publishing](#publishing)).
4. Add the school's domain under **Settings → Pages → Custom domain** and point its DNS at GitHub Pages.
5. Turn off the preview notice.
6. Give at least one school-appointed backup editor access to the repo.

Netlify and Cloudflare Pages work too: build command `npm run build`, output folder `dist`, environment variable `SITE_URL` set to the site’s address (for example `https://learnislam.org`).
