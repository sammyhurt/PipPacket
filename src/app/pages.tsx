import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

import { bandById, bands, teachingSources } from "@/content/kids";
import { allCards, allLessons, lessonById, net, paths, placement, stageOf } from "@/content/paths";
import { reviews } from "@/content/reviews";
import { isReady, levels, skillOfLesson, skills, strands, type Level, type Skill } from "@/content/skills";
import type { Block, Lesson } from "@/content/types";
import { cn } from "@/lib/utils";

import { counts, dueSkills, note, prereqsMet, startLevel, stateName, stateOf, todaysQuestions, upNext, type State } from "./mastery";
import { go } from "./router";
import { ChallengeInvite, People, seededQuestions, ShareCard } from "./social";
import { actions, getProgress, isChild, streak, today, useProgress, type Progress } from "./store";
import { Arrow, Bar, Btn, Check, Display, Eyebrow, Pip, Reveal, Rich, Tag, Title } from "./ui";
import { BinaryDrill, OrderIt, Quiz, Stack, SubnetTrainer } from "./widgets";

const wrap = "gutter mx-auto w-full max-w-5xl";
const isDone = (p: Progress, id: string) => !!p.done[id];
const nextLesson = (p: Progress) => allLessons.find((l) => !isDone(p, l.id) && !p.skipped.includes(l.id)) || allLessons.find((l) => !isDone(p, l.id));
const fmtDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/* ───────────── Home ───────────── */

export function Home() {
  const p = useProgress();
  const band = bandById(p.band);
  const young = p.band === "11-13";
  const lessons = allLessons;
  const next = lessonById(upNext(p, 8).find((x) => x.lesson)?.lesson || "");
  const mastery = counts(p);
  const dueToday = dueSkills(p);
  const doneCount = lessons.filter((l) => isDone(p, l.id)).length;
  const started = p.placed || doneCount > 0;
  const due = allCards.filter((c) => p.done[c.lesson.id] && (!p.boxes[c.key] || p.boxes[c.key].due <= today())).length;
  return (
    <div className={cn(wrap, "grid gap-6 py-6 sm:py-8")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Title as="h1" eyebrow={band ? band.name : undefined} size="text-[clamp(1.6rem,3.6vw,2.2rem)]">
          {started ? "Welcome back" : "Learn how the internet really works"}
        </Title>
        <p className="text-soft text-sm font-semibold">
          {p.xp} XP{streak(p) > 1 ? ` · ${streak(p)}-day streak` : ""}
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="chunk relative flex flex-col p-6 sm:p-7">
          <Pip className="absolute top-5 right-5 hidden w-16 sm:block" happy />
          <Eyebrow>{started ? "Continue" : "Start here"}</Eyebrow>
          {started && next ? (
            <>
              <h2 className="mt-1.5 text-2xl sm:text-3xl">{next.title}</h2>
              <p className="text-soft mt-2 max-w-[56ch]">
                {next.minutes} minutes. After this stop you can {next.hook.charAt(0).toLowerCase() + next.hook.slice(1)}
              </p>
            </>
          ) : next ? (
            <>
              <h2 className="mt-1.5 text-2xl sm:text-3xl">{young ? "Your first stop: " + next.title : "Find your starting point"}</h2>
              <p className="text-soft mt-2 max-w-[56ch]">{young ? "Five minutes, one idea, then a short quiz that explains every answer." : "Eight quick questions, about two minutes. You skip what you already know and start at the right stop."}</p>
            </>
          ) : (
            <>
              <h2 className="mt-1.5 text-2xl sm:text-3xl">You've finished every stop that's ready</h2>
              <p className="text-soft mt-2">More are being written. Keep your streak going with practice.</p>
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {next ? (
              <Btn size="lg" onClick={() => go(started || young ? "lesson-" + next.id : "start")}>
                {started ? "Continue" : young ? "Start" : "Take the placement quiz"} <Arrow />
              </Btn>
            ) : null}
            <Btn size="lg" tone="plain" onClick={() => go("map")}>
              See the skill tree
            </Btn>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Bar value={lessons.length ? doneCount / lessons.length : 0} className="grow" />
            <span className="text-soft text-sm font-semibold">
              {doneCount} of {lessons.length} stops · {mastery.mastered} mastered
            </span>
          </div>
        </div>
        <div className="grid gap-4">
          <button type="button" onClick={() => go("practice-today")} className="chunk press bg-aqua/40 p-5 text-left">
            <Eyebrow>Today's practice</Eyebrow>
            <p className="mt-1 text-xl font-bold">{dueToday ? `${dueToday} skill${dueToday === 1 ? "" : "s"} to practise` : "Mixed practice"}</p>
            <p className="text-soft mt-1 text-sm">{dueToday ? `Eight mixed questions, aimed at what you're weakest on.${due ? ` ${due} flashcard${due === 1 ? "" : "s"} due too.` : ""}` : "Finish a stop and its skill joins your daily mix."}</p>
          </button>
          <button type="button" onClick={() => go("lab")} className="chunk press bg-pink/40 p-5 text-left">
            <Eyebrow>Lab</Eyebrow>
            <p className="mt-1 text-xl font-bold">Build it and fix it</p>
            <p className="text-soft mt-1 text-sm">Cable a network, configure a switch, and watch your message travel.</p>
          </button>
        </div>
      </section>

      {young ? (
        <section className="chunk bg-tint p-5">
          <p className="font-bold">More for ages 11 to 13 is on the way</p>
          <p className="text-soft mt-1 text-sm">Guided challenges and small projects for level 3 are being built. The level 4 foundations are ready now and written to be followed from age 11.</p>
        </section>
      ) : (
        <section>
          <h2 className="text-xl">Paths</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {paths.map((path) => {
              const total = path.stages.reduce((a, s) => a + s.lessons.length, 0);
              const ready = total > 0;
              const d = path.stages.flatMap((s) => s.lessons).filter((l) => isDone(p, l.id)).length;
              return (
                <button key={path.id} type="button" onClick={() => go(ready ? "map" : "path-" + path.id)} className="chunk press flex flex-col p-5 text-left">
                  <span className={cn("text-on grid size-11 place-items-center rounded-xl", path.color === "net" ? "bg-sky" : path.color === "cloud" ? "bg-aqua" : "bg-lav")}>
                    {path.id === "net" ? (
                      <span className="font-code text-sm font-medium">{"</>"}</span>
                    ) : path.id === "cloud" ? (
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                        <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17.5 18.5H7z" />
                      </svg>
                    ) : (
                      <span className="text-sm font-extrabold">AI</span>
                    )}
                  </span>
                  <h3 className="mt-4 text-lg">{path.name}</h3>
                  <p className="text-soft mt-1 grow text-sm">{path.goal}</p>
                  {ready ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Bar value={d / total} className="grow" />
                      <span className="text-soft text-xs font-semibold">
                        {d}/{total}
                      </span>
                    </div>
                  ) : (
                    <Tag className="mt-4 self-start">Being built</Tag>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!isChild(p.band) ? (
        <>
          <Reveal>
            <People />
          </Reveal>
          <Reveal className="chunk bg-lav/30 p-6">
            <Eyebrow>Kept current</Eyebrow>
            <h2 className="mt-1 text-xl">Built on the new CCNA, version 2.0</h2>
            <p className="text-soft mt-2 max-w-[70ch]">
              Cisco's CCNA exam changes on <strong className="text-ink">3 February 2027</strong>. The certification stops follow the new official topic list. Taking the exam before then? Version 1.1 still applies, and the “Start from zero” stops cover the extra theory it asks for.
            </p>
            <button type="button" className="text-main mt-3 text-sm font-bold" onClick={() => go("about")}>
              How lessons are kept accurate →
            </button>
          </Reveal>
        </>
      ) : null}
    </div>
  );
}

/* ───────────── Who's learning? ───────────── */

export function Who() {
  const p = useProgress();
  const fills = { pink: "bg-pink", aqua: "bg-aqua", sky: "bg-sky", lav: "bg-lav", peri: "bg-peri" };
  return (
    <div className={cn(wrap, "max-w-4xl py-8 sm:py-12")}>
      <Title as="h1" eyebrow="Welcome">
        Who's learning?
      </Title>
      <p className="text-soft mt-2 max-w-[60ch]">Pick an age and the site changes how it teaches: what you see, how much there is to read, and what kind of activities you get. You can switch at any time.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bands.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={p.band === b.id}
            onClick={() => {
              actions.band(b.id);
              go("");
            }}
            className={cn("chunk press flex flex-col p-5 text-left", p.band === b.id && "border-main")}
          >
            <span className={cn("text-on self-start rounded-xl px-3 py-1.5 text-lg font-extrabold", fills[b.color])}>{b.name}</span>
            <span className="mt-3 block text-lg font-bold">{b.short}</span>
            <span className="text-soft mt-1 block text-sm">{b.what}</span>
          </button>
        ))}
      </div>
      <p className="text-soft mt-6 text-sm">No sign-up and no names. The choice is saved in this browser only.</p>
    </div>
  );
}

/* ───────────── Learn: the skill tree ───────────── */

const dot: Record<State, string> = { mastered: "bg-main text-main-ink", practising: "bg-aqua text-on", review: "bg-pink text-on", skipped: "bg-tint text-soft", new: "border-2 border-peri bg-card text-soft", coming: "border-2 border-dashed border-line text-soft" };
function StateDot({ st, className }: { st: State; className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold", dot[st], className)} aria-hidden>
      {st === "mastered" ? <Check className="size-4" /> : st === "review" ? "!" : st === "practising" ? "•" : st === "skipped" ? "–" : ""}
    </span>
  );
}
const fillOf = { pink: "bg-pink", aqua: "bg-aqua", sky: "bg-sky", lav: "bg-lav", peri: "bg-peri" } as const;

export function MapPage() {
  const p = useProgress();
  const base = startLevel(p.band);
  // adults who already know the foundations open on the certification level
  const foundationsDone = skills.filter((x) => x.level === 4 && x.lesson).every((x) => stateOf(p, x) !== "new");
  const [level, setLevel] = useState<Level>(base === 4 && foundationsDone ? 5 : base);
  const next = upNext(p, 3);
  const c = counts(p);
  const openSkill = (x: Skill) => go(x.lesson ? "lesson-" + x.lesson : x.lab ? "lab-" + x.lab : "play-" + x.activity);
  return (
    <div className={cn(wrap, "py-6 sm:py-8")}>
      <Title as="h1" eyebrow="Learn">
        The skill tree
      </Title>
      <p className="text-soft mt-2 max-w-[64ch]">Eleven strands of knowledge, six levels of depth. Every skill you master lights up, and the same tree grows with you from first steps to professional.</p>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          [c.mastered, "Mastered", "bg-main text-main-ink"],
          [c.practising, "Practising", "bg-aqua text-on"],
          [c.review, "Need review", "bg-pink text-on"],
        ].map(([n, l, cls]) => (
          <div key={l as string} className="chunk flex items-center gap-3 p-3">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold", cls as string)}>{n}</span>
            <span className="text-sm font-semibold">{l}</span>
          </div>
        ))}
      </div>

      {!p.placed && !Object.keys(p.done).length && base >= 4 ? (
        <div className="chunk bg-tint mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="font-semibold">Not sure where to begin? Eight questions find your starting point.</p>
          <Btn size="sm" onClick={() => go("start")}>
            Take the placement quiz
          </Btn>
        </div>
      ) : null}

      {next.length ? (
        <section className="mt-8">
          <h2 className="text-xl">Up next for you</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {next.map((x, i) => {
              const st = stateOf(p, x);
              return (
                <button key={x.id} type="button" onClick={() => openSkill(x)} className={cn("chunk press flex flex-col p-4 text-left", i === 0 && "border-main")}>
                  <span className="flex items-center gap-2">
                    <StateDot st={st} />
                    <span className="text-soft text-xs font-bold">
                      {strands.find((t) => t.id === x.strand)!.name} · Level {x.level}
                    </span>
                  </span>
                  <span className="mt-3 text-lg leading-snug font-bold">{x.title}</span>
                  <span className="text-main mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
                    {st === "review" ? "Review it" : i === 0 ? "Start" : "Open"} <Arrow />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl">The whole tree at a glance</h2>
        <p className="text-soft mt-1 text-sm">Each dot is a skill. Pick a level to see its skills below.</p>
        <div className="chunk mt-3 overflow-x-auto p-3 sm:p-4">
          <div className="grid min-w-[34rem] grid-cols-[minmax(8rem,1.4fr)_repeat(6,minmax(0,1fr))] items-center gap-x-2 gap-y-1.5 text-xs">
            <span />
            {levels.map((l) => (
              <button key={l.n} type="button" aria-pressed={level === l.n} onClick={() => setLevel(l.n)} className={cn("rounded-lg px-1 py-1.5 text-center font-bold", level === l.n ? "bg-main text-main-ink" : "bg-tint hover:bg-lav/40")}>
                <span className="block">Level {l.n}</span>
                <span className="block font-semibold opacity-80">{l.name}</span>
              </button>
            ))}
            {strands.map((t) => (
              <Fragment key={t.id}>
                <span className="flex items-center gap-2 py-1 text-[13px] font-semibold">
                  <span className={cn("size-3 shrink-0 rounded-full", fillOf[t.color])} /> {t.name}
                </span>
                {levels.map((l) => (
                  <span key={l.n} className={cn("flex flex-wrap justify-center gap-1 rounded-lg py-1.5", level === l.n && "bg-tint")}>
                    {skills
                      .filter((x) => x.strand === t.id && x.level === l.n)
                      .map((x) => {
                        const st = stateOf(p, x);
                        return <span key={x.id} title={`${x.title}: ${stateName[st]}`} className={cn("size-2.5 rounded-full", st === "mastered" ? "bg-main" : st === "practising" ? "bg-aqua ring-peri ring-1" : st === "review" ? "bg-pink ring-1 ring-[var(--bad)]" : st === "coming" ? "bg-line" : "bg-peri/60")} />;
                      })}
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <Eyebrow>Level {level}</Eyebrow>
            <h2 className="mt-1 text-2xl">{levels[level - 1].name}</h2>
            <p className="text-soft text-sm">{levels[level - 1].who}</p>
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Choose a level">
            {levels.map((l) => (
              <button key={l.n} type="button" aria-pressed={level === l.n} aria-label={`Level ${l.n}, ${l.name}`} onClick={() => setLevel(l.n)} className={cn("size-9 rounded-full text-sm font-bold", level === l.n ? "bg-main text-main-ink" : "bg-tint")}>
                {l.n}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {strands.map((t) => {
            const list = skills.filter((x) => x.strand === t.id && x.level === level);
            if (!list.length) return null;
            return (
              <div key={t.id} className="chunk p-4">
                <p className="flex items-center gap-2 font-bold">
                  <span className={cn("text-on grid size-7 place-items-center rounded-lg text-xs font-extrabold", fillOf[t.color])}>{t.id}</span>
                  {t.name}
                </p>
                <ul className="mt-3 grid gap-1.5">
                  {list.map((x) => {
                    const st = stateOf(p, x);
                    const wait = st === "new" && !prereqsMet(p, x);
                    const inner = (
                      <>
                        <StateDot st={st} />
                        <span className="min-w-0 grow">
                          <span className={cn("block leading-snug font-semibold", !isReady(x) && "text-soft")}>{x.title}</span>
                          <span className="text-soft block text-xs">
                            {isReady(x) ? stateName[st] : "Being written"}
                            {x.lab && !x.lesson ? " · lab mission" : ""}
                            {x.topic ? ` · ${x.topic}` : ""}
                            {wait ? ` · best after “${x.after![0]}”` : ""}
                          </span>
                        </span>
                        {isReady(x) ? <Arrow className="text-soft shrink-0" /> : null}
                      </>
                    );
                    return (
                      <li key={x.id}>
                        {isReady(x) ? (
                          <button type="button" onClick={() => openSkill(x)} className="hover:bg-tint flex w-full items-center gap-3 rounded-xl p-2 text-left">
                            {inner}
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 p-2">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ───────────── A lesson ───────────── */

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return (
        <p className="text-[17px] leading-relaxed">
          <Rich text={b.text} />
        </p>
      );
    case "h":
      return <h2 className="mt-4 text-2xl font-bold">{b.text}</h2>;
    case "analogy":
      return (
        <aside className="border-main bg-main/10 rounded-xl border-l-2 px-5 py-4">
          <p className="text-main text-xs font-bold tracking-wide">Think of it like this</p>
          <p className="mt-1 text-[17px] leading-relaxed">
            <Rich text={b.text} />
          </p>
        </aside>
      );
    case "list":
      return (
        <ul className="grid max-w-[66ch] list-disc gap-1.5 pl-5 text-[17px] leading-relaxed">
          {b.items.map((x) => (
            <li key={x}>
              <Rich text={x} />
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="grid max-w-[68ch] gap-2.5">
          {b.items.map((x, i) => (
            <li key={x} className="flex gap-3 text-[17px] leading-relaxed">
              <span className="border-line bg-card mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-bold">{i + 1}</span>
              <span className="min-w-0">
                <Rich text={x} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="chunk overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="bg-tint">
                {b.head.map((x, i) => (
                  <th key={i} className="border-line border-b px-3.5 py-2.5 text-xs font-bold tracking-wide">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className={i ? "border-line border-t" : ""}>
                  {r.map((c, j) => (
                    <td key={j} className={cn("px-3.5 py-2.5 align-top", j === 0 && r.length > 1 && "font-semibold")}>
                      <Rich text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <figure className="border-line overflow-hidden rounded-xl border">
          {b.label ? <figcaption className="bg-code-bg text-code-fg/60 border-b border-white/10 px-4 pt-2.5 pb-2 text-xs font-bold tracking-wide">{b.label}</figcaption> : null}
          <pre className="bg-code-bg text-code-fg overflow-x-auto px-4 py-3.5 font-code text-[13.5px] leading-relaxed">{b.text}</pre>
        </figure>
      );
    case "tip":
      return (
        <aside className="border-line bg-ai text-ai-ink rounded-xl border px-5 py-3.5">
          <p className="text-[16px] leading-relaxed">
            <strong>Tip. </strong>
            <Rich text={b.text} />
          </p>
        </aside>
      );
    case "watch":
      return (
        <aside className="border-bad bg-bad/10 rounded-xl border px-5 py-3.5">
          <p className="text-[16px] leading-relaxed">
            <strong>Watch out. </strong>
            <Rich text={b.text} />
          </p>
        </aside>
      );
    case "stack":
      return <Stack title={b.title} rows={b.rows} note={b.note} />;
    case "try":
      return b.widget === "order" ? <OrderIt prompt={b.prompt} items={b.items} /> : b.widget === "binary" ? <BinaryDrill /> : <SubnetTrainer />;
  }
}

export function LessonPage({ id }: { id: string }) {
  const lesson = lessonById(id);
  const p = useProgress();
  const [result, setResult] = useState<null | { score: number; first: boolean }>(null);
  const [quizKey, setQuizKey] = useState(0);
  useEffect(() => setResult(null), [id]);
  if (!lesson) return <Missing />;
  const stage = stageOf(id)!;
  const i = allLessons.indexOf(lesson);
  const after = lessonById(upNext(p, 3).find((x) => x.lesson !== id)?.lesson || "") || allLessons[i + 1];
  const skill = skillOfLesson(id);
  const review = reviews[id];
  const inStage = stage.lessons.indexOf(lesson);
  return (
    <article className={cn(wrap, "max-w-3xl py-8 sm:py-10")}>
      <button type="button" onClick={() => go("map")} className="text-soft text-sm font-semibold underline underline-offset-4">
        ← Networking map
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tag className="bg-net text-net-ink">{stage.level}</Tag>
        <Tag className="bg-card">
          Stop {inStage + 1} of {stage.lessons.length}
        </Tag>
        <Tag className="bg-card">{lesson.minutes} min</Tag>
        {skill && stateOf(p, skill) !== "new" ? <Tag className={stateOf(p, skill) === "mastered" ? "bg-main text-main-ink" : stateOf(p, skill) === "review" ? "bg-pink text-on" : "bg-aqua text-on"}>{stateName[stateOf(p, skill)]}</Tag> : null}
        {review ? (
          <Tag className="bg-good/15 text-good">
            <Check className="size-3.5" /> Reviewed by {review.by}
          </Tag>
        ) : (
          <Tag className="text-soft">Not yet reviewed by an engineer</Tag>
        )}
      </div>
      <h1 className="mt-4 text-[clamp(1.9rem,4.6vw,2.8rem)]">{lesson.title}</h1>
            <p className="text-soft mt-3 text-lg">
        <strong className="text-ink">After this stop you can:</strong> {lesson.hook.charAt(0).toLowerCase() + lesson.hook.slice(1)}
      </p>
      {lesson.objective ? <p className="border-line text-soft mt-3 border-l-4 pl-3 text-sm">{lesson.objective}</p> : null}

      <div className="prose-lesson mt-10 grid gap-5">
        {lesson.blocks.map((b, n) => (
          <BlockView key={n} b={b} />
        ))}
      </div>

      {skill?.lab ? (
        <aside className="chunk bg-pink/30 mt-10 flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-lg font-bold">Now do it for real</p>
            <p className="text-soft text-sm">This skill has a lab mission: build it, break it and fix it on a simulated network.</p>
          </div>
          <Btn onClick={() => go("lab-" + skill.lab)}>
            Open the lab <Arrow />
          </Btn>
        </aside>
      ) : null}

      <section className="chunk mt-12 p-5 sm:p-7" id="check">
        {result ? (
          <div className="pop" aria-live="polite">
            <Pip className="bob mb-3 w-16" happy />
            <p className="text-xs font-bold tracking-wide">Stop complete</p>
            <h2 className="mt-1 text-3xl font-bold">
              {result.score === 1 ? "Perfect score." : result.score >= 0.6 ? "Nice work." : "Done. Worth another look."} {Math.round(result.score * 100)}%
            </h2>
            <p className="text-soft mt-2">
              {result.first ? "+10 XP for the stop. " : ""}
              {result.score === 1 ? "+5 XP for a perfect quiz. " : "Retake the quiz any time to improve your score. "}
              This skill is now in your daily practice. Get it right on three different days and it counts as mastered.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {after ? (
                <Btn onClick={() => go("lesson-" + after.id)}>
                  Next stop: {after.title} <Arrow />
                </Btn>
              ) : (
                <Btn onClick={() => go("map")}>
                  Back to the map <Arrow />
                </Btn>
              )}
              {result.score < 1 ? (
                <Btn tone="plain" onClick={() => (setResult(null), setQuizKey(quizKey + 1))}>
                  Retake the quiz
                </Btn>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs font-bold tracking-wide">Check yourself</p>
            <Quiz key={id + quizKey} questions={lesson.quiz} doneLabel="Finish this stop" onDone={(score) => (note(id, score >= 0.6), setResult({ score, first: actions.finishLesson(id, score) }))} />
          </>
        )}
      </section>

      <footer className="border-line text-soft mt-10 border-t pt-5 text-sm">
        <p>
          <strong className="text-ink">Facts last checked:</strong> {fmtDay(lesson.checked)}
          {review ? ` · Reviewed by ${review.by} on ${fmtDay(review.on)}` : " · Awaiting review by a certified engineer"}
        </p>
        <ul className="mt-2 grid gap-1">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              {isChild(p.band) ? (
                s.label
              ) : (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {s.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3">Written as a study aid and not affiliated with Cisco. Practice questions are original, not taken from any exam.</p>
      </footer>
    </article>
  );
}

/* ───────────── Placement ───────────── */

export function Start() {
  const [res, setRes] = useState<null | { skip: string[]; at: Lesson; msg: string }>(null);
  const zeroIds = net.stages[0].lessons.map((l) => l.id);
  const finish = (_: number, right: boolean[]) => {
    const tier = (t: number) => placement.map((q, i) => (q.tier === t ? right[i] : null)).filter((x) => x !== null) as boolean[];
    const pass = (t: number, need: number) => tier(t).filter(Boolean).length >= need;
    let skip: string[] = [];
    let msg = "We'll start at the very beginning. Every stop takes a few minutes.";
    if (pass(0, 2)) {
      skip = zeroIds.slice(0, 4);
      msg = "You know the basics. We'll pick up at binary and the building blocks you'll need for subnetting.";
      if (pass(1, 2)) {
        skip = zeroIds;
        msg = pass(2, 2) ? "You're already working at certification level. Start on the CCNA trail and move fast: the quizzes will show any gaps." : "Your fundamentals are solid. Start on the CCNA trail.";
      }
    }
    const at = allLessons.find((l) => !skip.includes(l.id))!;
    actions.place(skip);
    setRes({ skip, at, msg });
  };
  return (
    <div className={cn(wrap, "max-w-2xl py-10")}>
      <Tag className="bg-sun text-on">Starting point</Tag>
      <Display as="h1" className="mt-3">Where should you begin?</Display>
      {res ? (
        <div className="chunk pop mt-6 p-6">
          <h2 className="text-2xl font-bold">Start here: {res.at.title}</h2>
          <p className="text-soft mt-2">{res.msg}</p>
          {res.skip.length ? <p className="text-soft mt-2 text-sm">We marked {res.skip.length} earlier stops as skipped. They stay open if you want a refresher.</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Btn onClick={() => go("lesson-" + res.at.id)}>
              Go to my first stop <Arrow />
            </Btn>
            <Btn tone="plain" onClick={() => go("map")}>
              See the map
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <p className="text-soft mt-2">Eight quick questions. Not sure? Pick “I'm not sure yet”. Guessing only sends you to stops that are too hard.</p>
          <div className="chunk mt-6 p-5 sm:p-7">
            <Quiz questions={placement} onDone={finish} doneLabel="Show my starting point" />
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────── Practice ───────────── */

export function Practice({ tool }: { tool: string }) {
  const tabs: [string, string][] = [
    ["today", "Today"],
    ["cards", "Flashcards"],
    ["quiz", "Quick quiz"],
    ["subnet", "Subnetting"],
    ["binary", "Binary"],
  ];
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Display as="h1" className="mt-3">Practice</Display>
      <p className="text-soft mt-2">Short drills that make the lessons stick.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([id, name]) => (
          <button key={id} type="button" role="tab" aria-selected={tool === id} onClick={() => go("practice-" + id)} className={cn("border-line rounded-full border px-4 py-1.5 text-sm font-bold", tool === id ? "bg-ink text-paper" : "bg-card")}>
            {name}
          </button>
        ))}
      </div>
      <div className="mt-6">{tool === "today" ? <Today /> : tool === "cards" ? <Cards /> : tool === "quiz" ? <QuickQuiz /> : tool === "subnet" ? <SubnetTrainer /> : <BinaryDrill />}</div>
    </div>
  );
}

function Cards() {
  const p = useProgress();
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(0);
  // cards from finished stops; if nothing is finished yet, offer the first stop's cards as a taste
  const pool = useMemo(() => {
    const mine = allCards.filter((c) => p.done[c.lesson.id]);
    return mine.length ? mine : allCards.filter((c) => c.lesson.id === allLessons[0].id);
  }, [p.done]);
  const due = pool.filter((c) => !p.boxes[c.key] || p.boxes[c.key].due <= today());
  const card = due[0];
  const answer = (knew: boolean) => {
    actions.card(card.key, knew);
    note(card.lesson.id, knew);
    setFlipped(false);
    setSeen(seen + 1);
  };
  if (!card)
    return (
      <div className="chunk p-6">
        <h2 className="text-2xl font-bold">All caught up.</h2>
        <p className="text-soft mt-2">
          No cards are due today{seen ? `. You reviewed ${seen} just now` : ""}. Finish more stops to add cards, or come back tomorrow.
        </p>
        <Btn className="mt-4" onClick={() => go("map")}>
          Back to the map <Arrow />
        </Btn>
      </div>
    );
  return (
    <div>
      <p className="text-soft mb-3 text-sm">
        {due.length} due today · from “{card.lesson.title}”{!Object.keys(p.done).length ? " (a sample: finish stops to build your own deck)" : ""}
      </p>
      <button type="button" onClick={() => setFlipped(!flipped)} className="chunk press grid min-h-56 w-full place-items-center p-6 text-center" aria-live="polite">
        <span>
          <span className="text-soft text-xs font-bold tracking-wide">{flipped ? "Answer" : "Question"}</span>
          <span className={cn("mt-2 block font-bold", flipped ? "text-xl sm:text-2xl" : "font-display text-3xl sm:text-4xl")}>
            <Rich text={flipped ? card.back : card.front} />
          </span>
          {!flipped ? <span className="text-soft mt-4 block text-sm">Say the answer in your head, then tap to check.</span> : null}
        </span>
      </button>
      {flipped ? (
        <div className="pop mt-4 flex flex-wrap gap-3">
          <Btn tone="plain" onClick={() => answer(false)}>
            Missed it
          </Btn>
          <Btn onClick={() => answer(true)}>
            <Check /> Knew it
          </Btn>
        </div>
      ) : null}
      <p className="text-soft mt-4 text-sm">Cards you know come back after longer and longer gaps. Cards you miss come back today.</p>
    </div>
  );
}

/** Today's mixed practice: eight questions across the skills you have started, weakest first, with the result per skill. */
function Today() {
  const p = useProgress();
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<null | { skill: Skill; right: boolean; before: State }[]>(null);
  const qs = useMemo(() => todaysQuestions(getProgress()), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  if (qs.length < 3)
    return (
      <div className="chunk p-6">
        <h2 className="text-2xl">Nothing to practise yet</h2>
        <p className="text-soft mt-2 max-w-[56ch]">Daily practice mixes questions from the skills you have started. Finish a stop or two and come back.</p>
        <Btn className="mt-4" onClick={() => go("map")}>
          Open the skill tree <Arrow />
        </Btn>
      </div>
    );
  return (
    <div className="chunk p-5 sm:p-7">
      {result === null ? (
        <>
          <p className="text-soft mb-4 text-sm">Mixed on purpose: switching between topics is harder in the moment and makes them stick.</p>
          <Quiz
            key={round}
            questions={qs}
            doneLabel="See how I did"
            onDone={(_, right) => {
              const before = qs.map((q) => stateOf(getProgress(), skillOfLesson(q.lesson.id)!));
              qs.forEach((q, n) => note(q.lesson.id, right[n]));
              setResult(qs.map((q, n) => ({ skill: skillOfLesson(q.lesson.id)!, right: right[n], before: before[n] })));
            }}
          />
        </>
      ) : (
        <div className="pop">
          <h2 className="text-3xl">
            {result.filter((r) => r.right).length} of {result.length} right
          </h2>
          <ul className="mt-4 grid gap-2">
            {[...new Map(result.map((r) => [r.skill.id, r])).values()].map((r) => {
              const now = stateOf(p, r.skill);
              return (
                <li key={r.skill.id} className="flex items-center gap-3">
                  <StateDot st={now} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{r.skill.title}</span>
                    <span className="text-soft block text-xs">{now === r.before ? stateName[now] : `${stateName[r.before]} → ${stateName[now]}`}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <Btn className="mt-5" onClick={() => (setResult(null), setRound(round + 1))}>
            Another round <Arrow />
          </Btn>
        </div>
      )}
    </div>
  );
}

function QuickQuiz() {
  const [seed, setSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000));
  const [score, setScore] = useState<number | null>(null);
  // every quiz has a number; the same number always gives the same ten questions, so a friend can take the same one
  const qs = useMemo(() => seededQuestions(seed), [seed]);
  return (
    <div className="chunk p-5 sm:p-7">
      {score === null ? (
        <Quiz key={seed} questions={qs} onDone={(sc, right) => (qs.forEach((q, n) => note(q.lesson.id, right[n])), setScore(sc))} doneLabel="See my score" />
      ) : (
        <div className="pop">
          <h2 className="text-3xl font-bold">
            {Math.round(score * qs.length)} of {qs.length} right
          </h2>
          <p className="text-soft mt-2">{score === 1 ? "Clean sweep." : "Each explanation told you why. Another round uses a fresh mix."}</p>
          <Btn className="mt-4" onClick={() => (setScore(null), setSeed(1000 + Math.floor(Math.random() * 9000)))}>
            Another round <Arrow />
          </Btn>
          {isChild(getProgress().band) ? null : <ChallengeInvite seed={seed} right={Math.round(score * qs.length)} total={qs.length} />}
        </div>
      )}
    </div>
  );
}

/* ───────────── Progress ───────────── */

export function Me() {
  const p = useProgress();
  const [sure, setSure] = useState(false);
  const done = (ids: string[]) => ids.filter((id) => p.done[id]).length;
  const zeroIds = net.stages[0].lessons.map((l) => l.id);
  const d1 = net.stages[1].lessons.map((l) => l.id);
  const badges: [string, string, boolean][] = [
    ["First stop", "Finish any stop", Object.keys(p.done).length >= 1],
    ["Off the ground", "Finish every “Start from zero” stop", done(zeroIds) === zeroIds.length],
    ["Subnet sharp", "Get 10 subnetting answers right", p.subnet >= 10],
    ["Three in a row", "Study three days running", streak(p) >= 3],
    ["Perfectionist", "Score 100% on five quizzes", Object.values(p.best).filter((s) => s === 1).length >= 5],
    ["Domain 1 cleared", "Finish CCNA domain 1", done(d1) === d1.length],
  ];
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Display as="h1" className="mt-3">Your progress</Display>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [String(p.xp), "XP"],
          [String(streak(p)), streak(p) === 1 ? "day streak" : "day streak"],
          [`${Object.keys(p.done).length}/${allLessons.length}`, "stops done"],
        ].map(([n, l]) => (
          <div key={l} className="chunk p-4 text-center">
            <p className="font-display text-3xl font-bold sm:text-4xl">{n}</p>
            <p className="text-soft text-xs font-bold tracking-wide">{l}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-bold">Badges</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {badges.map(([name, how, got]) => (
          <div key={name} className={cn("flex items-center gap-3 rounded-xl border p-3.5", got ? "border-line bg-card" : "border-line border-dashed")}>
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full border", got ? "border-line bg-sun text-on" : "border-line text-soft")}>{got ? <Check /> : "?"}</span>
            <span>
              <span className={cn("block font-bold", !got && "text-soft")}>{name}</span>
              <span className="text-soft block text-sm">{how}</span>
            </span>
          </div>
        ))}
      </div>

      {isChild(p.band) ? null : (
        <>
          <h2 className="mt-10 text-2xl font-bold">Share it</h2>
          <div className="mt-4">
            <ShareCard />
          </div>
        </>
      )}

      <h2 className="mt-10 text-2xl font-bold">By strand</h2>
      <p className="text-soft mt-1 text-sm">Mastered skills out of those with a lesson ready. More skills open as lessons are written.</p>
      <div className="mt-4 grid gap-4">
        {strands.map((t) => {
          const c = counts(
            p,
            skills.filter((x) => x.strand === t.id),
          );
          if (!c.ready) return null;
          return (
            <div key={t.id}>
              <div className="flex justify-between gap-3 text-sm font-semibold">
                <span>{t.name}</span>
                <span className="text-soft">
                  {c.mastered} mastered · {c.practising} practising{c.review ? ` · ${c.review} to review` : ""} · {c.ready} ready of {c.total}
                </span>
              </div>
              <Bar value={c.mastered / c.ready} className="mt-1.5" />
            </div>
          );
        })}
      </div>

      <div className="border-line text-soft mt-12 border-t pt-5 text-sm">
        <p>Your progress is saved in this browser only. Nothing is sent anywhere, and there is no account. Clearing your browser data, or using another device, starts you fresh.</p>
        {sure ? (
          <p className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-ink font-semibold">Erase all progress on this device?</span>
            <Btn size="sm" tone="ink" onClick={() => (actions.reset(), setSure(false))}>
              Yes, erase it
            </Btn>
            <Btn size="sm" tone="plain" onClick={() => setSure(false)}>
              Keep it
            </Btn>
          </p>
        ) : (
          <button type="button" className="mt-3 underline underline-offset-4" onClick={() => setSure(true)}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────── Other pages ───────────── */

export function PathPlan({ id }: { id: string }) {
  const path = paths.find((x) => x.id === id);
  if (!path || !path.outline) return <Missing />;
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Tag className={path.color === "cloud" ? "bg-cloud text-on" : "bg-ai text-ai-ink"}>Being built</Tag>
      <Display as="h1" className="mt-3">{path.name}</Display>
      <p className="text-soft mt-2 max-w-[60ch]">{path.goal} This path is planned and not written yet. Here is what it will cover.</p>
      <ol className="mt-6 grid gap-2">
        {path.outline.map((t, i) => (
          <li key={t} className="border-line flex items-center gap-3 rounded-xl border border-dashed px-4 py-3">
            <span className="text-soft font-mono text-sm font-bold">{String(i + 1).padStart(2, "0")}</span> {t}
          </li>
        ))}
      </ol>
      <p className="text-soft mt-6">Both paths build on networking, so the Networking trail is the best place to start today.</p>
      <Btn className="mt-4" onClick={() => go("map")}>
        Open the Networking map <Arrow />
      </Btn>
    </div>
  );
}

export function About() {
  const p = useProgress();
  const Q = ({ q, children }: { q: string; children: ReactNode }) => (
    <div className="border-line border-t pt-4">
      <h2 className="text-xl font-bold">{q}</h2>
      <div className="text-soft mt-1.5 grid max-w-[66ch] gap-2">{children}</div>
    </div>
  );
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Display as="h1" className="mt-3">How this site works</Display>
      <div className="mt-8 grid gap-6">
        <Q q="Why “PipPacket”?">
          <p>Pip is the little message you help deliver in the youngest learners' first game, and a packet is what every message on the internet is made of. Pip was also the name of a real proposal in the early 1990s for the next version of the Internet Protocol.</p>
          {isChild(p.band) ? null : (
            <p className="text-sm">
              <a href="https://www.rfc-editor.org/rfc/rfc1621.html" target="_blank" rel="noreferrer" className="underline underline-offset-4">
                RFC 1621: Pip Near-term Architecture
              </a>
            </p>
          )}
        </Q>
        <Q q="Where do the lessons come from?">
          <p>Every certification stop is tied to one line of the official exam topic list, and its facts are checked against that list, the internet standards (RFCs) and vendor documentation. Each lesson shows its sources and the date it was last checked.</p>
        </Q>
        <Q q="Which CCNA version is this?">
          <p>The certification trail follows CCNA 200-301 version 2.0, which Cisco starts testing on 3 February 2027. Until then the exam uses version 1.1. The “Start from zero” stops cover the theory that version 1.1 lists and version 2.0 assumes you already know.</p>
        </Q>
        <Q q="Are these real exam questions?">
          <p>No. Every practice question is original and written to teach the topic. Copies of live exam questions are against the exam rules and are never used here.</p>
        </Q>
        <Q q="Is this enough to pass?">
          <p>Use it alongside an official course or book and hands-on practice in a lab or simulator. This site is a study aid. It is not affiliated with or endorsed by Cisco, and lessons can contain mistakes.</p>
        </Q>
        <Q q="How does it teach different ages?">
          <p>Each age group gets its own way of learning, following what educators recommend for that age: play and listening for the youngest, puzzles and building next, then real vocabulary and guided practice.</p>
          <div className="mt-2 grid gap-3">
            {bands.map((b) => (
              <div key={b.id} className="chunk p-4">
                <p className="text-ink font-bold">
                  {b.name}: {b.short.toLowerCase()}
                </p>
                <ul className="mt-1.5 list-disc pl-5 text-sm">
                  {b.how.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm">Based on:</p>
          <ul className="grid gap-1 text-sm">
            {teachingSources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Q>
        <Q q="Is it safe for children?">
          <p>For under-13s the site has no accounts, asks for no names, shows no links to other websites, and turns off sharing and friend challenges. Pictures are drawings, never photos of children. A sum stands between children and the grown-ups' pages.</p>
        </Q>
        <Q q="What do you collect about me?">
          <p>Nothing. There are no accounts. Your progress is stored in your own browser and never leaves it.</p>
        </Q>
      </div>
    </div>
  );
}

export function Missing() {
  return (
    <div className={cn(wrap, "max-w-2xl py-16 text-center")}>
      <Display as="h1" className="mt-3">That stop isn't on the map.</Display>
      <Btn className="mt-6" onClick={() => go("map")}>
        Back to the map <Arrow />
      </Btn>
    </div>
  );
}
