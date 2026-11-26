// Typed access to the editable data files in src/data.
// The editor (Pages CMS) leaves out fields that are empty when it saves, so
// anything a volunteer might clear is optional here. Import data from this
// module rather than from the JSON files directly.
import siteData from '../data/site.json';
import paymentData from '../data/payment.json';
import calendarData from '../data/calendar.json';
import sundayData from '../data/sunday.json';
import curriculumData from '../data/curriculum.json';
import handbookData from '../data/handbook.json';
import faqData from '../data/faq.json';
import arrivalData from '../data/arrival.json';
import campusData from '../data/campus.json';
import onlineData from '../data/online.json';
import type { Calendar as ScheduleCalendar, Override } from './schedule';

export interface Site {
  name: string;
  shortName: string;
  tagline: string;
  lead: string;
  previewNotice?: boolean;
  location: string;
  hours: string;
  emailGeneral: string;
  emailRegistration: string;
  absenceFormUrl: string;
  taxId: string;
  address?: string;
  donationUrl?: string;
  volunteerSignupUrl?: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  heroImageCreditUrl?: string;
  pdfCalendar?: string;
  pdfCurriculum?: string;
  pdfGuidelines?: string;
}

export interface Payment {
  tuitionPerChild: number;
  maxChildren: number;
  secondInstallmentDue: string;
  currentFamilies: string;
  newFamilies: string;
  registrationCloses: string;
  zelleEmail: string;
  zelleName: string;
  zelleQr?: string;
  memoFormat: string;
  checkPayee: string;
  checkMemo: string;
  checkWhere: string;
  mailingAddress?: string;
}

export interface Calendar extends ScheduleCalendar {
  schoolYear: string;
  hijriYear: string;
  startTime: string;
  endTime: string;
}

export interface Grade {
  id: string;
  label: string;
  title: string;
  note?: string;
  quran: string[];
  memorize: string[];
  studies: string[];
}

export interface Curriculum {
  lead: string;
  grades: Grade[];
  schedule: { time: string; what: string }[];
  milestones: { when: string; what: string }[];
}

export interface Arrival {
  lead?: string;
  parking?: { name: string; how?: string; best?: boolean }[];
  parkingNote?: string;
  volunteers?: string[];
  pickup?: string[];
  closedCampus?: string;
  greeneRules?: string[];
  sharing?: string;
}

export interface Campus {
  lead?: string;
  rooms?: { grade: string; where?: string }[];
  events?: string;
  offLimits?: string[];
  allowed?: string;
}

export interface Step { title: string; body?: string; }

export interface Online {
  lead?: string;
  students?: Step[];
  etiquette?: string[];
  teachers?: Step[];
  troubleshooting?: { q: string; a?: string }[];
}

export const site = siteData as Site;
const paymentFile = paymentData as Partial<Payment>;
export const payment = { ...paymentFile, maxChildren: paymentFile.maxChildren ?? 8 } as Payment;
export const calendar = calendarData as Calendar;
export const sunday = sundayData as Override;
export const curriculum = curriculumData as Curriculum;
export const handbook = handbookData;
export const faq = faqData;
export const arrival = arrivalData as Arrival;
export const campus = campusData as Campus;
export const online = onlineData as Online;
