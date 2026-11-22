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
- [Handing it over to the school](#handing-it-over-to-the-school)

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

Each save becomes a commit in this repo, so every change is recorded and can be undone. The editor's forms are defined in [`.pages.yml`](.pages.yml).

| Section in the editor | What volunteers can change |
|---|---|
| Announcements | Title, message, show-from and hide-after dates, green banner on or off. Expired posts hide by themselves. |
| This Sunday (Emergency) | Override the home page card for weather or closures |
| Calendar | Each Sunday's status (in session, virtual, possible virtual, no school) and note, plus events. Updates the Calendar page, the This Sunday card and the calendar feed. |
| Tuition & Payment | Zelle details and QR code, check payee, tuition and dates |
| Parent Handbook, Curriculum, New Family Questions | The text on those pages |
| Contact, Links & PDFs | Emails, links, PDF uploads, the home page photo and its credit |

### One-time setup (repo owner, about 5 minutes, all in the browser)

1. **Turn on automatic publishing**, so saves go live by themselves:
   1. On GitHub, open [`ci/deploy.yml`](ci/deploy.yml) and click the copy icon to copy its contents.
   2. Go back to the repo's main page and choose **Add file → Create new file**.
   3. Name it `.github/workflows/deploy.yml` (typing each `/` creates a folder), paste, and click **Commit changes**.
   4. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. **Connect the editor:** go to [app.pagescms.org](https://app.pagescms.org), choose **Sign in with GitHub**, and when asked, install the Pages CMS app on this repository only.
3. **Invite volunteers:** open the repository in Pages CMS, find its collaborator settings, and add each volunteer's email address. Then send them the `/admin/` link.

Volunteers then just open `/admin/`, click **Open the Editor**, choose **Continue with email**, and sign in with what Pages CMS emails them.

## Publishing

Once automatic publishing is on (setup step 1 above), the site rebuilds on every save and every night. The nightly rebuild keeps the This Sunday card and announcement dates current.

Until then, the live site is a built copy on the `gh-pages` branch, and someone with the code has to republish it after edits:

```sh
npm install      # first time only
npm run deploy
```

After automatic publishing is on, `npm run deploy` and the `gh-pages` branch are no longer needed.

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
scripts/publish-gh-pages.mjs  `npm run deploy`
ci/deploy.yml               GitHub Actions workflow (see Publishing)
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

## Handing it over to the school

1. Transfer the repo to a school-owned GitHub account (**Settings → Transfer ownership**).
2. Install the Pages CMS app on the new account and re-invite volunteers.
3. Add the school's domain under **Settings → Pages → Custom domain** and point its DNS at GitHub Pages.
4. Turn off the preview notice.
5. Give at least one school-appointed backup person GitHub access to the repo, so more than one person can manage editors.

Netlify and Cloudflare Pages work too: build command `npm run build`, output folder `dist`, environment variable `SITE_URL` set to the site’s address (for example `https://learnislam.org`).
