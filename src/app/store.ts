/**
 * Everything a learner has done, kept in their own browser: no accounts and nothing sent anywhere.
 * If the browser refuses storage (private window), the site still works for the visit.
 */
import { useSyncExternalStore } from "react";

export interface Progress {
  done: Record<string, string>; // lesson id -> day finished
  best: Record<string, number>; // lesson id -> best quiz score, 0..1
  skipped: string[]; // lessons the placement quiz let you pass over
  placed: boolean;
  xp: number;
  days: string[]; // days with any study, for the streak
  boxes: Record<string, { box: number; due: string }>; // flashcard key -> spaced-repetition slot
  subnet: number; // subnetting answers right, all time
  theme: "" | "light" | "dark";
  band: Band; // who is learning; "" until they choose
  stars: Record<string, number>; // kids' activities finished -> stars earned
  ev: Record<string, { d: string[]; m: number }>; // skill id -> days answered right, and misses in a row
}
export type Band = "" | "5-7" | "8-10" | "11-13" | "14-17" | "adult";
/** Under 13: no sharing, no links out, no tracking of any kind. */
export const isChild = (b: Band) => b === "5-7" || b === "8-10" || b === "11-13";
export const isLittle = (b: Band) => b === "5-7" || b === "8-10";
const KEY = "pippacket-progress-v1";
const blank: Progress = { done: {}, best: {}, skipped: [], placed: false, xp: 0, days: [], boxes: {}, subnet: 0, theme: "", band: "", stars: {}, ev: {} };

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => new Date(Date.parse(day) + n * 864e5).toISOString().slice(0, 10);

let state: Progress = blank;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...blank, ...(JSON.parse(raw) as Partial<Progress>) };
} catch {
  /* start fresh */
}
const subs = new Set<() => void>();
function set(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* kept for this visit only */
  }
  subs.forEach((f) => f());
}
export const useProgress = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => blank,
  );
export const getProgress = () => state;

const touch = (p: Progress): Progress => (p.days.includes(today()) ? p : { ...p, days: [...p.days, today()].slice(-400) });

export const actions = {
  finishLesson(id: string, score: number) {
    const first = !state.done[id];
    const better = score > (state.best[id] ?? -1);
    set(touch({ ...state, done: first ? { ...state.done, [id]: today() } : state.done, best: better ? { ...state.best, [id]: score } : state.best, skipped: state.skipped.filter((x) => x !== id), xp: state.xp + (first ? 10 : 0) + (better && score === 1 ? 5 : 0) }));
    return first;
  },
  place(skipped: string[]) {
    set({ ...state, placed: true, skipped });
  },
  /** Flashcard answer: knew it -> the card moves up a box and comes back later; missed -> back to box 1, due again today. */
  card(key: string, knew: boolean) {
    const gaps = [0, 1, 3, 7, 16, 35];
    const box = knew ? Math.min(5, (state.boxes[key]?.box ?? 0) + 1) : 1;
    set(touch({ ...state, boxes: { ...state.boxes, [key]: { box, due: addDays(today(), knew ? gaps[box] : 0) } }, xp: state.xp + (knew ? 1 : 0) }));
  },
  subnetRight() {
    set(touch({ ...state, subnet: state.subnet + 1, xp: state.xp + 2 }));
  },
  /** One right or wrong answer for a skill. Right answers count once per day; a right answer clears the run of misses. */
  evidence(skill: string, right: boolean) {
    const cur = state.ev[skill] || { d: [], m: 0 };
    const next = right ? { d: cur.d.includes(today()) ? cur.d : [...cur.d, today()].slice(-12), m: 0 } : { d: cur.d, m: cur.m + 1 };
    set(touch({ ...state, ev: { ...state.ev, [skill]: next } }));
  },
  band(band: Band) {
    set({ ...state, band });
  },
  star(id: string, n: number) {
    set(touch({ ...state, stars: { ...state.stars, [id]: Math.max(n, state.stars[id] ?? 0) } }));
  },
  theme(theme: Progress["theme"]) {
    set({ ...state, theme });
  },
  reset() {
    set({ ...blank, theme: state.theme, band: state.band });
  },
};

/** Days in a row with study, counting today or yesterday as the latest. */
export function streak(p: Progress) {
  let n = 0;
  let d = today();
  if (!p.days.includes(d)) d = addDays(d, -1);
  while (p.days.includes(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
