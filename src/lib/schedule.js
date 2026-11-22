// Pure date and calendar helpers shared by the build and the browser.
// All dates are ISO strings (YYYY-MM-DD) in the school's time zone.

export const TZ = 'America/Los_Angeles';

/** Today's date in Palo Alto as YYYY-MM-DD. */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** Current hour (0–23) in Palo Alto. */
function hourNow(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(now));
}

function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso, n) {
  const d = parts(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Nov 29" */
export function shortDate(iso) {
  return parts(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "Oct 4–11", "Dec 27 – Jan 3", or "Nov 29". */
export function dateRange(start, end) {
  if (!end || end === start) return shortDate(start);
  const a = parts(start), b = parts(end);
  if (a.getUTCMonth() === b.getUTCMonth()) return `${shortDate(start)}–${b.getUTCDate()}`;
  return `${shortDate(start)} – ${shortDate(end)}`;
}

/** The Sunday families care about: today if it's Sunday before 2 PM, else the next one. */
export function upcomingSunday(now = new Date()) {
  const today = todayISO(now);
  const dow = parts(today).getUTCDay();
  if (dow === 0 && hourNow(now) < 14) return today;
  return addDays(today, dow === 0 ? 7 : 7 - dow);
}

export const STATUS = {
  'in-session': { badge: 'In session', tone: 'green', title: 'School is in session', detail: 'Arrive by 10:00 AM for assembly. Pick-up at 1:30 PM after Dhuhr.' },
  'virtual': { badge: 'Virtual', tone: 'gold', title: 'Virtual class day', detail: 'Classes on Zoom. Join 10:00–10:15 AM to test your connection; first period at 10:15.' },
  'possible-virtual': { badge: 'Possible virtual', tone: 'gold', title: 'Class may be on Zoom', detail: 'We’ll confirm by email the week before. Plan for school as usual until then.' },
  'no-school': { badge: 'No school', tone: 'red', title: 'No school', detail: 'Classes resume the following Sunday. Enjoy the break.' },
};

/**
 * What to show in the "This Sunday" card.
 * @param {{sundays: {date:string,status:string,note:string}[]}} calendar
 * @param {{enabled:boolean,date:string,status:string,title:string,message:string}} override
 */
export function thisSunday(calendar, override, now = new Date()) {
  const date = upcomingSunday(now);
  const label = shortDate(date);
  if (override?.enabled && (!override.date || override.date === date)) {
    const s = STATUS[override.status] || STATUS['no-school'];
    return { date, label, status: override.status, badge: s.badge, tone: s.tone, title: override.title || s.title, detail: override.message || s.detail };
  }
  const entry = calendar.sundays.find((s) => s.date === date);
  if (!entry) {
    const next = calendar.sundays.find((s) => s.date > date && s.status !== 'no-school');
    return {
      date, label, status: 'no-school', badge: 'No school', tone: 'red', title: 'No class this Sunday',
      detail: next ? `Next school day: ${shortDate(next.date)}.` : 'See you next school year. Check the calendar for dates.',
    };
  }
  const s = STATUS[entry.status] || STATUS['in-session'];
  let title = s.title;
  let detail = s.detail;
  if (entry.status === 'no-school' && entry.note) title = `No school · ${entry.note}`;
  else if (entry.note && entry.status !== 'in-session') detail = entry.note;
  else if (entry.note) detail = `${entry.note}. ${s.detail}`;
  return { date, label, status: entry.status, badge: s.badge, tone: s.tone, title, detail };
}

/** Dated items after `after` for the "Coming up" list. */
export function comingUp(calendar, after, limit = 4) {
  const items = [];
  for (const s of calendar.sundays) {
    if (s.status === 'no-school') items.push({ date: s.date, title: `No school · ${s.note || 'Holiday'}` });
    else if (s.status === 'possible-virtual') items.push({ date: s.date, title: 'Possible virtual day' });
    else if (s.status === 'virtual') items.push({ date: s.date, title: 'Virtual class day' });
  }
  for (const e of calendar.events) items.push({ date: e.date, title: e.title });
  const seen = new Set();
  return items
    .filter((i) => i.date > after)
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((i) => (seen.has(i.date + i.title) ? false : seen.add(i.date + i.title)))
    .slice(0, limit)
    .map((i) => ({ ...i, label: shortDate(i.date) }));
}

/** True when an announcement should be visible on `today`. */
export function isLive(showFrom, hideAfter, today) {
  return (!showFrom || showFrom <= today) && (!hideAfter || hideAfter >= today);
}
