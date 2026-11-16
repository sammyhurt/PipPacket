/**
 * Mastery: what a learner can do, shown by getting it right on separate days.
 *   new         nothing yet
 *   practising  seen it and got some right
 *   mastered    right on three different days
 *   review      missed twice running, or mastered long ago and not touched since
 */
import { allQuestions } from "@/content/paths";
import { isReady, skillOfActivity, skillOfLesson, skills, skillByTitle, type Level, type Skill } from "@/content/skills";

import { actions, today, type Band, type Progress } from "./store";

export type State = "new" | "practising" | "mastered" | "review" | "skipped" | "coming";
const DAYS_TO_MASTER = 3;
const STALE_AFTER = 60; // days

const gap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
/** The different days this skill was shown, including the day its lesson was first finished. */
export function daysShown(p: Progress, s: Skill): string[] {
  const d = new Set(p.ev[s.id]?.d || []);
  if (s.lesson && p.done[s.lesson]) d.add(p.done[s.lesson]);
  return [...d].sort();
}
export function stateOf(p: Progress, s: Skill): State {
  if (!isReady(s)) return "coming";
  if (s.activity) return p.stars[s.activity] ? "mastered" : "new"; // for the youngest, finishing it is collecting it
  const days = daysShown(p, s);
  if (!days.length) return s.lesson && p.skipped.includes(s.lesson) ? "skipped" : "new";
  if ((p.ev[s.id]?.m ?? 0) >= 2) return "review";
  if (days.length >= DAYS_TO_MASTER) return gap(days[days.length - 1], today()) > STALE_AFTER ? "review" : "mastered";
  return "practising";
}
export const stateName: Record<State, string> = { new: "New", practising: "Practising", mastered: "Mastered", review: "Needs review", skipped: "Skipped", coming: "Coming" };

/** Record one right or wrong answer for the skill a lesson teaches. */
export function note(lessonId: string, right: boolean) {
  const s = skillOfLesson(lessonId);
  if (s) actions.evidence(s.id, right);
}
export function noteActivity(id: string) {
  const s = skillOfActivity(id);
  if (s) actions.evidence(s.id, true);
}

export const startLevel = (band: Band): Level => (band === "5-7" ? 1 : band === "8-10" ? 2 : band === "11-13" ? 3 : 4);
const met = (p: Progress, s: Skill) => (s.after || []).every((t) => { const pre = skillByTitle(t); return !pre || !isReady(pre) || ["practising", "mastered", "skipped"].includes(stateOf(p, pre)); });
/** What to do next: skills that slipped first, then new ones in order, lowest level first, from the learner's level up. */
export function upNext(p: Progress, count = 3): Skill[] {
  const from = startLevel(p.band);
  const open = skills.filter((s) => s.lesson && s.level >= Math.min(from, 4));
  const review = open.filter((s) => stateOf(p, s) === "review");
  const fresh = open.filter((s) => stateOf(p, s) === "new" && met(p, s)).sort((a, b) => a.level - b.level);
  const blocked = open.filter((s) => stateOf(p, s) === "new" && !met(p, s));
  return [...review, ...fresh, ...blocked].slice(0, count);
}
export const prereqsMet = met;

/** Today's mixed practice: questions from skills you have started, weighted towards the weak ones, topics shuffled together. */
export function todaysQuestions(p: Progress, count = 8) {
  const weight = (s: Skill) => ({ review: 5, practising: 4 - Math.min(2, daysShown(p, s).length), mastered: 1, new: 0, skipped: 0, coming: 0 })[stateOf(p, s)];
  const pool = allQuestions.map((q) => ({ q, w: (() => { const s = skillOfLesson(q.lesson.id); return s ? weight(s) : 0; })() })).filter((x) => x.w > 0);
  const out: typeof allQuestions = [];
  while (out.length < count && pool.length) {
    let r = Math.random() * pool.reduce((a, x) => a + x.w, 0);
    const i = pool.findIndex((x) => (r -= x.w) <= 0);
    out.push(pool.splice(i < 0 ? 0 : i, 1)[0].q);
  }
  return out;
}
/** How many started skills are due for practice today. */
export const dueSkills = (p: Progress) => skills.filter((s) => s.lesson && ["review", "practising"].includes(stateOf(p, s))).length;
export function counts(p: Progress, list: Skill[] = skills) {
  const c = { mastered: 0, practising: 0, review: 0, ready: 0, total: list.length };
  for (const s of list) {
    if (!isReady(s)) continue;
    c.ready++;
    const st = stateOf(p, s);
    if (st === "mastered") c.mastered++;
    else if (st === "practising") c.practising++;
    else if (st === "review") c.review++;
  }
  return c;
}
