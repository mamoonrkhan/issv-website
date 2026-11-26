# Islamic School of Silicon Valley: a new website (proposal)

This is a proposed new website for the Islamic School of Silicon Valley (ISSV). It's built to answer families' everyday questions quickly, on any phone, and to let volunteers keep it up to date without any technical skills.

**See it live:** https://mamoonrkhan.github.io/issv-website/

> **This is a proposal, not the school's official site.** Every page says so, and search engines are asked not to list it. Once the school approves it, one setting turns the notice off (see [Going live](#going-live-on-learnislamorg)).

## What families get

- **"This Sunday" at a glance.** The home page shows whether there's school this Sunday (in person, online or cancelled), along with announcements and a button to report an absence.
- **A School Day guide.** Where to park at Greene, who the green-vest volunteers are, how pick-up works, a campus map of our classrooms, and where lunch and Dhuhr prayer are.
- **Online class help.** Step-by-step guides and two short narrated videos, one for students and parents and one for teachers, on joining classes with Google Classroom and Google Meet.
- **The calendar on their phone.** One tap adds every school date to Google, Apple or Outlook calendars, and it stays up to date on its own.
- **Everything else in one place:** curriculum by grade, the parent handbook, registration and tuition (with Zelle and check instructions), and a search box that understands everyday words, so "hijab" finds the dress code.

Links from the old learnislam.org site, like `/aboutus/`, still work and go to the matching new page.

## How volunteers update it

No coding, no GitHub account and no password to remember.

1. A volunteer gets an email invitation to **[Pages CMS](https://pagescms.org)**, a free online editor.
2. They open the **For Volunteers** page (linked at the bottom of every page, at `/admin/`) and click **Open the Editor**.
3. They change what they need in simple forms and click **Save**. The website updates by itself in about a minute.

Every change is saved in a history, so any mistake can be undone.

**What volunteers can change:**

| In the editor | What it controls |
|---|---|
| Announcements | Short notices on the home page, with start and end dates. Urgent ones can show as a banner on every page. |
| This Sunday (Emergency) | Overrides the home page card for weather or a last-minute closure |
| Calendar | Each Sunday's status (in session, virtual, maybe virtual, no school) and school events. Updates families' phone calendars too. |
| Tuition & Payment | Tuition, due dates, Zelle and check details |
| School Day guides | Parking, pick-up, campus, lunch and online class instructions, including room numbers for each grade |
| Parent Handbook, Curriculum, New Family Questions | The text on those pages |
| Contact, Links & PDFs | Email addresses (including the online-class help address), links, PDFs and the home page photo |

**Inviting a volunteer** (done by the site maintainer): sign in at [app.pagescms.org](https://app.pagescms.org), open **issv-website**, add the person's email under collaborators, and send them the `/admin/` link. They sign in with **Continue with email**.

## Before launch: what we need from the school

- [ ] Zelle email or phone, the name exactly as Zelle shows it, and the QR code from the bank app
- [ ] Check payee name and mailing address
- [ ] Confirmed tuition installment dates
- [ ] Room numbers for each grade (for the campus map page)
- [ ] The school logo, or approval of the new emblem
- [ ] Photos we're allowed to use (the preview shows only the school building, no students)
- [ ] Current PDFs, the volunteer sign-up link and the donation link
- [ ] OK to publish the school calendar as a subscribable feed
- [ ] Who manages the learnislam.org domain

## Going live on learnislam.org

1. The school's domain manager points learnislam.org at this site (four `A` records and a `CNAME` for `www` to `mamoonrkhan.github.io`, per [GitHub's guide](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
2. In this repository, go to **Settings → Pages → Custom domain**, enter `learnislam.org`, and turn on **Enforce HTTPS** when it appears.
3. Turn off the proposal notice: set `previewNotice` to `false` in `src/data/site.json`.
4. Invite the school's editors and send them the `/admin/` link.

Keep the old site available for a few weeks in case anything was missed.

## Who runs it

- **The school owns the domain.** learnislam.org stays registered to the school and simply points here.
- **Staff and volunteers are editors.** They update content through the editor and never need to touch code.
- **One maintainer** ([@mamoonrkhan](https://github.com/mamoonrkhan)) looks after the design and code, and invites editors.

**If the maintainer steps away, the site keeps running.** Hosting is free and nothing needs renewing, and editors keep editing as usual. Only inviting editors or changing the design needs someone with access to this repository. The options, simplest first:

1. **Add a backup admin** under **Settings → Collaborators**.
2. **Transfer the repository** to the school or a new maintainer (**Settings → Transfer ownership**). They then install the Pages CMS app and re-invite editors.
3. **Host it elsewhere.** The site is plain files, so any web host can serve it (see [For developers](#for-developers)).

## Privacy and accessibility

- **No tracking, no cookies, no ads.** Nothing a family types (like the tuition calculator) leaves their browser.
- **No photos of students.** The only photo is of the school building: [Greene Middle School sign](https://commons.wikimedia.org/wiki/File:Greene_middle_school_sign.jpg) by Ovinus Real, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- **Accessible.** Readable contrast, keyboard navigation, captions on every video, and descriptions for the campus map.
- **Credits.** Parking rules come from Greene Middle School's "Getting to School" page, and the campus map is adapted from Greene's student map. Both are credited on the pages that use them.

---

## For developers

### Running it locally

Needs [Node.js](https://nodejs.org) 22.23 or newer (24 recommended).

```sh
npm install
npm run dev       # http://localhost:4321 (search works only after a build)
npm run build     # build to dist/ and create the search index
npm run preview   # serve the build
npm run check     # type-check
```

### Publishing

Automatic. [`deploy.yml`](.github/workflows/deploy.yml) builds the site and publishes it to GitHub Pages in about 40 seconds: on every change (including editor saves), every night (so the This Sunday card and expired announcements stay current), and on demand from **Actions → Deploy site → Run workflow**. If a build fails, the last good version stays up. GitHub Pages may cache the old version for up to 10 minutes.

To host elsewhere (Netlify, Cloudflare Pages and so on), use build command `npm run build`, output folder `dist`, and set `SITE_URL` to the site's address.

### What it's built with

- **[Astro](https://astro.build)** generates plain static HTML, so there's no server or database.
- **[Pagefind](https://pagefind.app)** builds the search index. Hand-picked synonyms live in `src/pages/search.astro`.
- **[Pages CMS](https://pagescms.org)** edits the files in `src/data` and `src/content`. Its forms are defined in [`.pages.yml`](.pages.yml).
- **Fonts:** Inter, plus Amiri for Arabic, served from the site itself.
- **Videos:** animated scenes with an open-source AI voice (Kokoro). To edit or re-render them, see [`video/README.md`](video/README.md).

### Where things are

```
src/
  data/                  everything the editor changes (JSON)
  content/announcements/ one file per announcement
  pages/                 one file per page; school-day/ holds the School Day guides
  components/            header, footer, campus map, hero, …
  layouts/Base.astro     the frame around every page
  lib/content.ts         typed access to src/data
  lib/schedule.ts        "This Sunday" and upcoming-dates logic
  styles/global.css      all styles and design tokens
public/videos/           rendered guide videos, captions and posters
video/                   video sources and the render script
.pages.yml               the editor's forms
```

### House rules

- **Content goes in `src/data`, not in page markup.** To make something editable, add it to a data file and to `.pages.yml`, and read it through `src/lib/content.ts`. Mark fields that can be blank as optional, because the editor drops empty fields when saving.
- **Styles use the tokens and classes in `global.css`:**
  - Headings come in three sizes: the page title, `.h-section` and `.h-card`.
  - Spacing has two steps: `.pt-block` (24px) and `.pt-major` (56px).
  - Cards are `.card`, `.card-sm`, and `.card-highlight` for the single most important item on a page.
  - Every page except Home starts with `components/Hero.astro`.
- **Internal links go through `u()`** from `src/lib/url.ts`, so they work under the `/issv-website/` preview path.
- **Dates are `YYYY-MM-DD` in Pacific time.** Use the helpers in `src/lib/schedule.ts`.
