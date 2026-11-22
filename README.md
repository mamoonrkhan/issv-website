# Islamic School of Silicon Valley website (redesign proposal)

A proposed new website for the Islamic School of Silicon Valley. It's fast, works well on phones, meets accessibility standards, and volunteers can update it without writing code.

**Live preview:** https://mamoonrkhan.github.io/issv-website/

> This is a proposal, not the school's official site. Every page says so, and search engines are asked not to index it. To remove it, set `previewNotice` to `false` in `src/data/site.json`.

## Contents

- [What's on the site](#whats-on-the-site)
- [Editing content](#editing-content)
- [Publishing](#publishing)
- [Developing locally](#developing-locally)
- [How it's built](#how-its-built)
- [Before launch](#before-launch)
- [How it's run](#how-its-run)
- [Going live on learnislam.org](#going-live-on-learnislamorg)
- [If the maintainer steps away](#if-the-maintainer-steps-away)

## What's on the site

| Page | Path | What it does |
|---|---|---|
| Home | `/` | "This Sunday" card (status, absence form, calendar buttons, announcements), upcoming dates, parent links, at-a-glance facts |
| About | `/about/` | Story, mission, donations, contact |
| New families | `/new-families/` | How joining works, common questions |
| Calendar | `/calendar/` | Class days by month, events, holidays, one-tap subscribe for Google, Apple and Outlook |
| Curriculum | `/curriculum/` | Tabs for each grade (KG to Youth Group), daily schedule, milestones |
| Parent handbook | `/families/` | Jump links, then policies in collapsible sections. Links like `/families/#dress` open the right one |
| Registration & tuition | `/registration/` | Key dates, tuition estimator, Zelle and check instructions |
| Search | `/search/` | Results as you type. Press <kbd>/</kbd> on any page to jump here |
| Calendar feed | `/calendar.ics` | Subscribed calendars update automatically |
| For volunteers | `/admin/` | How to edit the site, with an **Open the Editor** button (see below) |

Old learnislam.org links (`/aboutus/`, `/late-policy/`, `/reusebooks/`, `/evaluation-reports/`) redirect to the matching new page.

## Editing content

Volunteers edit the site with **[Pages CMS](https://pagescms.org)**, a free editor with simple forms. They're invited by email and don't need a GitHub account, a password or any technical knowledge. The volunteer how-to lives on the site at **`/admin/`** (also linked as "For Volunteers" in the footer).

Editors **save, check, then publish**:

1. **Save** in the editor. The change goes to the `draft` branch, so families can't see it.
2. **Check** it about two minutes later at **`/preview/`**, a full copy of the site with a dark "Preview" bar.
3. Click **Publish to live site** in the editor's sidebar. Everything on the preview goes live about two minutes later.

Every save is a commit, so every change is recorded and can be undone. The editor's forms and the Publish button are defined in [`.pages.yml`](.pages.yml).

| Section in the editor | What volunteers can change |
|---|---|
| Announcements | Title, message, show-from and hide-after dates, green banner on or off. Expired posts hide by themselves. |
| This Sunday (Emergency) | Override the home page card for weather or closures |
| Calendar | Each Sunday's status (in session, virtual, possible virtual, no school) and note, plus events. Updates the Calendar page, the This Sunday card and the calendar feed. |
| Tuition & Payment | Zelle details and QR code, check payee, tuition and dates |
| Parent Handbook, Curriculum, New Family Questions | The text on those pages |
| Contact, Links & PDFs | Emails, links, PDF uploads, the home page photo and its credit |

### Inviting volunteers

1. Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub, and open **issv-website**.
2. Open its collaborator settings and add the volunteer's email address.
3. Send them the `/admin/` link. They choose **Continue with email** and sign in with what Pages CMS emails them.

(Already done for this repo: the Pages CMS GitHub app is installed on `issv-website` only. On a new account, install it from [github.com/apps/pages-cms](https://github.com/apps/pages-cms/installations/new).)

## Publishing

There are two branches:

| Branch | What it is | Shown at |
|---|---|---|
| `main` | The live site | `/` |
| `draft` | Editors' saved but unpublished changes (the repo's default branch, so the editor opens it) | `/preview/` |

Two workflows run everything:

- **[`deploy.yml`](.github/workflows/deploy.yml)** builds both copies and publishes them to GitHub Pages. It runs on every change to either branch, every night, and on demand (**Actions → Deploy site → Run workflow**). When `main` changes, it also merges `main` into `draft` so the draft stays up to date.
- **[`publish.yml`](.github/workflows/publish.yml)** is the editor's **Publish to live site** button. It merges `draft` into `main` and redeploys.

Code and design changes go straight to `main`. They're live and in the preview after the next deploy.

Browsers may show the previous version for up to 10 minutes because of GitHub Pages caching. A hard refresh (Cmd+Shift+R) shows the latest. If a run fails (a red ✕ in **Actions**), the site keeps showing the last good version. Open the failed run to see why.

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
  pages/                    one file per page, plus calendar.ics.ts and admin.astro (volunteer guide)
  components/               header, footer, hero, photo, email, add-to-calendar…
  layouts/Base.astro        page shell: banners, header, footer, site-wide scripts
  lib/schedule.ts           This Sunday and upcoming-dates logic (build and browser)
  lib/url.ts, images.ts     base-path links, image lookup
  styles/global.css         design tokens and all styles
  assets/photos/            images uploaded in the editor (optimized at build)
public/
  docs/                     PDFs uploaded in the editor
.pages.yml                  editor forms (Pages CMS)
.github/workflows/          deploy.yml (build live + preview), publish.yml (Publish button)
```

### Conventions

- **Content lives in `src/data` and `src/content`, never in page markup.** If something should be editable, add it to a data file and to `.pages.yml`.
- **Styles live in `src/styles/global.css`.** Use the design tokens and existing classes rather than one-off values:
  - **Headings:** three sizes. Page title (the hero), `.h-section` (serif, for section and large-card titles) and `.h-card` (sans, for small cards).
  - **Spacing:** two values. `.pt-block` (`--gap`, 24px) between related blocks and inside grids, and `.pt-major` (`--space-major`, 48px) after the page header or before a section with its own heading.
  - **Page headers:** every page except Home uses `components/Hero.astro`: a short label, the title, one line of description, then any buttons.
  - **Cards:** `.card`, `.card-sm` for compact cards, and `.card-highlight` (green border) for the single most important item on a page.
  - Layout helpers (`stack`, `mb-12`…) are at the end of the file so they override component styles.
- **Internal links go through `u()`** from `src/lib/url.ts`, so they work when the site is served from a sub-path like `/issv-website/`.
- **Dates are `YYYY-MM-DD` strings in Pacific time.** Use the helpers in `src/lib/schedule.ts`.

## How it's built

- **[Astro](https://astro.build)** turns the pages into plain static HTML. There's no server or database, and hosting is free.
- **[Pagefind](https://pagefind.app)** builds the search index during the build. Hand-picked answers in `src/pages/search.astro` add synonyms (for example, "hijab" finds the dress code).
- **[Pages CMS](https://pagescms.org)** is the volunteer editor. It edits the files in `src/data` and `src/content` and commits them to GitHub. It's set to merge, so it never drops fields it doesn't know about.
- **Images** uploaded in the editor are resized and converted to AVIF and WebP at build time, and location data is stripped.
- **No photos of students.** The only photo is of the school building: [Greene Middle School sign](https://commons.wikimedia.org/wiki/File:Greene_middle_school_sign.jpg) by Ovinus Real, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), credited on the photo. Any replacement should also avoid children unless parents have agreed.
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
- [ ] Decision on photos (the preview shows only the school building)
- [ ] Current PDFs and the volunteer sign-up link
- [ ] Donation link, and who manages it
- [ ] OK to publish the school calendar as a subscribable feed
- [ ] Who owns `learnislam.org`, and DNS access

## How it's run

- **One maintainer owns the GitHub repo** ([@mamoonrkhan](https://github.com/mamoonrkhan)). They handle the design and code, and invite editors.
- **School staff and volunteers are editors.** They're invited by email in Pages CMS and update content through `/admin/` (see [Editing content](#editing-content)). They never need a GitHub account.
- **The school owns the domain.** learnislam.org stays registered to the school and simply points at this site.

## Going live on learnislam.org

1. The school's domain admin adds the DNS records for GitHub Pages: four `A` records for `learnislam.org` and a `CNAME` for `www` pointing to `mamoonrkhan.github.io`. See [GitHub's guide](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
2. In this repo, go to **Settings → Pages → Custom domain**, enter `learnislam.org`, save, and tick **Enforce HTTPS** once it's available.
3. Set `previewNotice` to `false` in `src/data/site.json` to remove the preview notice and let search engines index the site.
4. Invite the school's editors in Pages CMS and send them the `/admin/` link.

Keep the old site available for a few weeks in case anything was missed. Old links like `/aboutus/` already redirect.

## If the maintainer steps away

The site keeps running without anyone: hosting is free, there's nothing to update or renew on GitHub's side, and editors keep editing as usual. Only these need someone with GitHub access to this repo:

- inviting or removing editors,
- changing the design or adding pages.

Options, from simplest:

1. **Add a backup admin:** in **Settings → Collaborators**, give a trusted person's GitHub account access. They can then manage editors in Pages CMS too.
2. **Transfer the repo** to the school or a new maintainer (**Settings → Transfer ownership**). They then install the Pages CMS app on their account and re-invite editors.
3. **Move away entirely:** the school points learnislam.org somewhere else. The site is plain files, so any web host can serve the `dist/` folder from `npm run build`.

Netlify and Cloudflare Pages also work as hosts: build command `npm run build`, output folder `dist`, and the environment variable `SITE_URL` set to the site's address (for example `https://learnislam.org`).
