import type { APIRoute } from 'astro';
import calendar from '../data/calendar.json';
import site from '../data/site.json';
import { addDays } from '../lib/schedule.js';

// Subscribable iCalendar feed built from src/data/calendar.json.
const TZID = 'America/Los_Angeles';
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', `TZID:${TZID}`,
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0800', 'TZOFFSETTO:-0700', 'TZNAME:PDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0700', 'TZOFFSETTO:-0800', 'TZNAME:PST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const ymd = (iso: string) => iso.replace(/-/g, '');
const hm = (t: string) => t.replace(':', '') + '00';

/** Fold lines longer than 75 octets, per RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export const GET: APIRoute = () => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ISSV//School calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(site.shortName + ' school calendar')}`, `X-WR-TIMEZONE:${TZID}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
    ...VTIMEZONE,
  ];
  const event = (uid: string, props: string[]) => lines.push('BEGIN:VEVENT', `UID:${uid}@issv`, `DTSTAMP:${stamp}`, ...props, 'END:VEVENT');

  for (const s of calendar.sundays) {
    if (s.status === 'no-school') {
      event(`sunday-${s.date}`, [`DTSTART;VALUE=DATE:${ymd(s.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(s.date, 1))}`, `SUMMARY:${esc('No school · ' + (s.note || 'Holiday'))}`, 'TRANSP:TRANSPARENT']);
      continue;
    }
    const name = `${site.shortName} school`;
    const summary = s.status === 'virtual' ? `${name} (virtual, on Zoom)` : s.status === 'possible-virtual' ? `${name} (possible virtual day)` : name;
    const desc = [s.note, s.status === 'possible-virtual' ? 'We’ll confirm by email the week before.' : ''].filter(Boolean).join(' ');
    event(`sunday-${s.date}`, [
      `DTSTART;TZID=${TZID}:${ymd(s.date)}T${hm(calendar.startTime)}`,
      `DTEND;TZID=${TZID}:${ymd(s.date)}T${hm(calendar.endTime)}`,
      `SUMMARY:${esc(summary)}`,
      ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []),
      `LOCATION:${esc(s.status === 'virtual' ? 'Zoom (link sent by email)' : site.address || site.location)}`,
    ]);
  }
  for (const e of calendar.events) {
    const end = addDays(e.end || e.date, 1);
    event(`event-${e.date}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, [`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(end)}`, `SUMMARY:${esc(e.title)}`, 'TRANSP:TRANSPARENT']);
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
