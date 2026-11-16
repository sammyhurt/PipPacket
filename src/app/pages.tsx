import { useEffect, useMemo, useState, type ReactNode } from "react";

import { allCards, allLessons, lessonById, net, paths, placement, stageOf } from "@/content/paths";
import type { Block, Lesson } from "@/content/types";
import { cn } from "@/lib/utils";

import { go } from "./router";
import { ChallengeInvite, People, seededQuestions, ShareCard } from "./social";
import { actions, streak, today, useProgress, type Progress } from "./store";
import { Arrow, Bar, Btn, Check, Display, Eyebrow, Reveal, Rich, Tag, Title } from "./ui";
import { BinaryDrill, OrderIt, Quiz, Stack, SubnetTrainer } from "./widgets";

const wrap = "gutter mx-auto w-full max-w-5xl";
const isDone = (p: Progress, id: string) => !!p.done[id];
const nextLesson = (p: Progress) => allLessons.find((l) => !isDone(p, l.id) && !p.skipped.includes(l.id)) || allLessons.find((l) => !isDone(p, l.id));
const fmtDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/* ───────────── Home ───────────── */

export function Home() {
  const p = useProgress();
  const started = p.placed || Object.keys(p.done).length > 0;
  const next = nextLesson(p);
  const doneCount = allLessons.filter((l) => isDone(p, l.id)).length;
  const band = "py-16 sm:py-24";
  return (
    <>
      <section className={cn(wrap, "grid items-center gap-12 pt-10 pb-16 sm:pt-16 sm:pb-24 md:grid-cols-[1.45fr_1fr] md:gap-14")}>
        <div>
          <Eyebrow>Networking · Cloud · AI infrastructure</Eyebrow>
          <Display as="h1" className="mt-6 text-[clamp(2.1rem,5vw,3.5rem)] leading-[1.18]">
            Learn how the internet really works
          </Display>
          <div className="bg-ink/20 mt-7 h-px w-full max-w-md" />
          <p className="text-soft mt-7 max-w-[50ch] text-lg leading-relaxed sm:text-xl">Short stops on a map instead of long chapters. Each one explains an idea in plain words, lets you try it, then checks it stuck. Start from zero and keep going to certification level.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {started && next ? (
              <Btn size="lg" onClick={() => go("lesson-" + next.id)}>
                Continue: {next.title} <Arrow />
              </Btn>
            ) : (
              <Btn size="lg" onClick={() => go("start")}>
                Find my starting point <Arrow />
              </Btn>
            )}
            <Btn size="lg" tone="plain" onClick={() => go("map")}>
              See the map
            </Btn>
          </div>
          <p className="font-label text-soft mt-5 text-sm">{started ? `${doneCount} of ${allLessons.length} stops done · ${p.xp} XP${streak(p) > 1 ? ` · ${streak(p)}-day streak` : ""}` : "Free, no sign-up. Two minutes and eight questions to skip what you already know."}</p>
        </div>
        <MiniMap />
      </section>

      <section className={cn("bg-tint", band)}>
        <div className={wrap}>
          <Reveal>
            <Title eyebrow="Three paths, one map each">Pick a path</Title>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {paths.map((path, n) => {
              const total = path.stages.reduce((a, s) => a + s.lessons.length, 0);
              const ready = total > 0;
              return (
                <Reveal key={path.id} delay={n * 0.06} className="flex">
                  <button type="button" onClick={() => go(ready ? "map" : "path-" + path.id)} className="chunk press flex w-full flex-col p-7 text-left">
                    <span className={cn("grid size-12 place-items-center rounded-full text-[#471f28]", path.color === "net" ? "bg-net" : path.color === "cloud" ? "bg-cloud" : "bg-ai")}>
                      {path.id === "net" ? (
                        <span className="font-code text-sm font-medium">{"</>"}</span>
                      ) : path.id === "cloud" ? (
                        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
                          <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17.5 18.5H7z" />
                        </svg>
                      ) : (
                        <span className="font-label text-sm font-bold tracking-wider">AI</span>
                      )}
                    </span>
                    <h3 className="mt-6 text-2xl tracking-[0.04em] uppercase">{path.name}</h3>
                    <p className="text-soft mt-2 grow">{path.goal}</p>
                    <span className="font-label mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase">{ready ? `${total} stops ready` : "Being built · see the plan"} <Arrow /></span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className={cn(wrap, band)}>
        <Reveal>
          <Title eyebrow="How a stop works">Read it, try it, keep it</Title>
        </Reveal>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["Read for five minutes", "One idea per stop, explained with an everyday comparison before any jargon."],
            ["Try it straight away", "Flip bits, put steps in order, work out a subnet. You learn it by doing it."],
            ["Make it stick", "A short quiz ends each stop. Flashcards bring back whatever you missed."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <p className="font-script text-main text-6xl leading-none">{i + 1}</p>
              <h3 className="mt-3 text-xl tracking-[0.04em] uppercase">{t}</h3>
              <p className="text-soft mt-2">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={cn("bg-tint", band)}>
        <Reveal className={wrap}>
          <People />
        </Reveal>
      </section>

      <section className={cn(wrap, band)}>
        <Reveal className="bg-sun rounded-sm p-8 text-[#471f28] sm:p-12">
          <p className="font-label text-[11px] tracking-[0.28em] uppercase">Kept current</p>
          <h2 className="mt-4 text-3xl tracking-[0.02em] uppercase sm:text-4xl">Built on the new CCNA, version 2.0</h2>
          <p className="mt-4 max-w-[68ch] text-lg">
            Cisco's CCNA exam changes on <strong>3 February 2027</strong>. The certification stops on this map follow the new official topic list. Taking the exam before then? Version 1.1 still applies, and the “Start from zero” stops cover the extra theory it asks for.
          </p>
          <button type="button" className="font-label mt-6 text-[11px] tracking-[0.2em] uppercase underline underline-offset-8" onClick={() => go("about")}>
            How we keep lessons accurate
          </button>
        </Reveal>
      </section>
    </>
  );
}

function MiniMap() {
  const p = useProgress();
  const stops = allLessons.slice(0, 6);
  return (
    <div className="chunk relative overflow-hidden p-7 sm:p-8" aria-hidden>
      <Eyebrow>Networking · first stops</Eyebrow>
      <div className="relative mt-4 grid gap-3">
        <div className="border-line absolute top-4 bottom-4 left-[19px] border-l border-dashed" />
        {stops.map((l, i) => {
          const done = isDone(p, l.id);
          const here = !done && stops.slice(0, i).every((x) => isDone(p, x.id) || p.skipped.includes(x.id));
          return (
            <div key={l.id} className="relative flex items-center gap-3" style={{ marginLeft: [0, 18, 36, 18][i % 4] }}>
              <span className={cn("border-edge grid size-10 shrink-0 place-items-center rounded-full border font-mono text-sm font-bold", done ? "bg-ink text-paper" : here ? "bg-main bob text-main-ink" : "bg-card")}>{done ? <Check /> : i + 1}</span>
              <span className={cn("truncate text-[15px] font-semibold", !done && !here && "text-soft")}>{l.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── The map ───────────── */

export function MapPage() {
  const p = useProgress();
  const next = nextLesson(p);
  const done = allLessons.filter((l) => isDone(p, l.id)).length;
  useEffect(() => {
    if (next && done) document.getElementById("stop-" + next.id)?.scrollIntoView({ block: "center" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Tag className="bg-net text-net-ink">Path</Tag>
      <Display as="h1" className="mt-5">Networking</Display>
      <p className="text-soft mt-2 max-w-[60ch]">{net.goal} Follow the trail in order, or jump to any stop.</p>
      <div className="mt-5 flex items-center gap-3">
        <Bar value={done / allLessons.length} className="grow" />
        <span className="font-mono text-sm font-semibold">
          {done}/{allLessons.length}
        </span>
      </div>
      {!p.placed && !done ? (
        <div className="chunk bg-tint mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="font-semibold">Not sure where to begin?</p>
          <Btn size="sm" onClick={() => go("start")}>
            Find my starting point
          </Btn>
        </div>
      ) : null}

      {net.stages.map((stage) => {
        const sd = stage.lessons.filter((l) => isDone(p, l.id)).length;
        return (
          <section key={stage.id} className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Tag className={stage.lessons.length ? "bg-card" : "text-soft border-line bg-transparent"}>{stage.level}</Tag>
                <Display className={cn("mt-4 text-[clamp(1.45rem,3.2vw,2.1rem)]", !stage.lessons.length && "text-soft")}>{stage.title}</Display>
                <p className="text-soft mt-4 text-[15px]">{stage.blurb}</p>
              </div>
              {stage.lessons.length ? (
                <span className="font-mono text-sm font-semibold">
                  {sd}/{stage.lessons.length}
                </span>
              ) : (
                <Tag className="text-soft border-line bg-transparent">Coming next</Tag>
              )}
            </div>
            {stage.lessons.length ? <Trail lessons={stage.lessons} nextId={next?.id} /> : null}
            {stage.planned ? (
              <ul className="mt-4 grid gap-2">
                {stage.planned.map((t) => (
                  <li key={t} className="border-line text-soft flex items-center gap-3 rounded-sm border border-dashed px-4 py-2.5 text-[15px]">
                    <span className="border-line size-3 shrink-0 rounded-full border" /> {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
      <section className="mt-12">
        <Tag className="text-soft border-line bg-transparent">After CCNA</Tag>
        <Display className="text-soft mt-4 text-[clamp(1.45rem,3.2vw,2.1rem)]">CCNP Enterprise and expert scenarios</Display>
        <p className="text-soft mt-1 text-[15px]">Advanced routing, design and troubleshooting cases. Planned once the CCNA trail is complete.</p>
      </section>
    </div>
  );
}

const ROW = 104;
const XS = [14, 30, 46, 30];
/** The winding trail: stops placed left to right and back, joined by one dashed road. */
function Trail({ lessons, nextId }: { lessons: Lesson[]; nextId?: string }) {
  const p = useProgress();
  const pts = lessons.map((_, i) => [XS[i % 4], i * ROW + 40] as const);
  const d = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `C ${pts[i - 1][0]} ${pts[i - 1][1] + ROW / 2}, ${x} ${y - ROW / 2}, ${x} ${y}`)).join(" ");
  return (
    <div className="relative mt-6" style={{ height: lessons.length * ROW }}>
      <svg className="absolute inset-0 size-full" viewBox={`0 0 100 ${lessons.length * ROW}`} preserveAspectRatio="none" aria-hidden>
        <path d={d} fill="none" stroke="var(--line)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" vectorEffect="non-scaling-stroke" />
      </svg>
      {lessons.map((l, i) => {
        const done = isDone(p, l.id);
        const here = l.id === nextId;
        const skipped = !done && p.skipped.includes(l.id);
        return (
          <button key={l.id} id={"stop-" + l.id} type="button" onClick={() => go("lesson-" + l.id)} className="group absolute flex -translate-y-1/2 items-center gap-3 text-left" style={{ left: `calc(${XS[i % 4]}% - 32px)`, top: i * ROW + 40, right: 0 }}>
            <span className={cn("press border-edge grid size-16 shrink-0 place-items-center rounded-full border font-mono text-lg font-bold", done ? "bg-ink text-paper" : here ? "bg-main bob text-main-ink" : skipped ? "bg-tint text-soft border-dashed" : "bg-card")}>{done ? <Check className="size-7" /> : i + 1}</span>
            <span className="min-w-0">
              {here ? <span className="bg-main text-main-ink mb-1 inline-block rounded-full px-2 py-0.5 font-label text-[9px] tracking-[0.22em] uppercase">You are here</span> : null}
              <span className="block text-[15px] leading-tight font-bold group-hover:underline sm:text-base">{l.title}</span>
              <span className="text-soft block text-xs">
                {l.minutes} min{done ? ` · quiz ${Math.round((p.best[l.id] ?? 0) * 100)}%` : skipped ? " · skipped by your placement" : ""}
              </span>
            </span>
          </button>
        );
      })}
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
      return <h2 className="mt-4 text-2xl font-normal">{b.text}</h2>;
    case "analogy":
      return (
        <aside className="border-main bg-main/10 rounded-sm border-l-2 px-5 py-4">
          <p className="text-main font-label text-[11px] tracking-[0.24em] uppercase">Think of it like this</p>
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
              <span className="border-edge bg-card mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-bold">{i + 1}</span>
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
                  <th key={i} className="border-edge border-b px-3.5 py-2.5 font-label text-[11px] tracking-[0.24em] uppercase">
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
        <figure className="border-edge overflow-hidden rounded-sm border">
          {b.label ? <figcaption className="bg-code-bg text-code-fg/60 border-b border-white/10 px-4 pt-2.5 pb-2 font-label text-[10px] tracking-[0.22em] uppercase">{b.label}</figcaption> : null}
          <pre className="bg-code-bg text-code-fg overflow-x-auto px-4 py-3.5 font-code text-[13.5px] leading-relaxed">{b.text}</pre>
        </figure>
      );
    case "tip":
      return (
        <aside className="border-edge bg-ai text-ai-ink rounded-sm border px-5 py-3.5">
          <p className="text-[16px] leading-relaxed">
            <strong>Tip. </strong>
            <Rich text={b.text} />
          </p>
        </aside>
      );
    case "watch":
      return (
        <aside className="border-bad bg-bad/10 rounded-sm border px-5 py-3.5">
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
  const after = allLessons[i + 1];
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
        {isDone(p, id) ? (
          <Tag className="bg-good/15 border-good text-good">
            <Check className="size-3.5" /> Done
          </Tag>
        ) : null}
      </div>
      <h1 className="mt-5 text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.1]">{lesson.title}</h1>
      <div className="bg-ink/20 mt-6 h-px w-full max-w-md" />
      <p className="text-soft mt-3 text-lg">
        <strong className="text-ink">After this stop you can:</strong> {lesson.hook.charAt(0).toLowerCase() + lesson.hook.slice(1)}
      </p>
      {lesson.objective ? <p className="border-line text-soft mt-3 border-l-4 pl-3 text-sm">{lesson.objective}</p> : null}

      <div className="prose-lesson mt-10 grid gap-5">
        {lesson.blocks.map((b, n) => (
          <BlockView key={n} b={b} />
        ))}
      </div>

      <section className="chunk mt-12 p-5 sm:p-7" id="check">
        {result ? (
          <div className="pop" aria-live="polite">
            <p className="font-label text-[11px] tracking-[0.24em] uppercase">Stop complete</p>
            <h2 className="mt-1 text-3xl font-normal">
              {result.score === 1 ? "Perfect score." : result.score >= 0.6 ? "Nice work." : "Done. Worth another look."} {Math.round(result.score * 100)}%
            </h2>
            <p className="text-soft mt-2">
              {result.first ? "+10 XP for the stop. " : ""}
              {result.score === 1 ? "+5 XP for a perfect quiz. " : "Retake the quiz any time to improve your score. "}
              The flashcards for this stop are now in your practice deck.
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
            <p className="mb-4 font-label text-[11px] tracking-[0.24em] uppercase">Check yourself</p>
            <Quiz key={id + quizKey} questions={lesson.quiz} doneLabel="Finish this stop" onDone={(score) => setResult({ score, first: actions.finishLesson(id, score) })} />
          </>
        )}
      </section>

      <footer className="border-line text-soft mt-10 border-t pt-5 text-sm">
        <p>
          <strong className="text-ink">Facts last checked:</strong> {fmtDay(lesson.checked)}
        </p>
        <ul className="mt-2 grid gap-1">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {s.label}
              </a>
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
      <Tag className="bg-sun text-[#471f28]">Starting point</Tag>
      <Display as="h1" className="mt-5">Where should you begin?</Display>
      {res ? (
        <div className="chunk pop mt-6 p-6">
          <h2 className="text-2xl font-normal">Start here: {res.at.title}</h2>
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
    ["cards", "Flashcards"],
    ["quiz", "Quick quiz"],
    ["subnet", "Subnetting"],
    ["binary", "Binary"],
  ];
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Display as="h1" className="mt-5">Practice</Display>
      <p className="text-soft mt-2">Short drills that make the lessons stick.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([id, name]) => (
          <button key={id} type="button" role="tab" aria-selected={tool === id} onClick={() => go("practice-" + id)} className={cn("border-edge rounded-full border px-4 py-1.5 text-sm font-bold", tool === id ? "bg-ink text-paper" : "bg-card")}>
            {name}
          </button>
        ))}
      </div>
      <div className="mt-6">{tool === "cards" ? <Cards /> : tool === "quiz" ? <QuickQuiz /> : tool === "subnet" ? <SubnetTrainer /> : <BinaryDrill />}</div>
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
    setFlipped(false);
    setSeen(seen + 1);
  };
  if (!card)
    return (
      <div className="chunk p-6">
        <h2 className="text-2xl font-normal">All caught up.</h2>
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
          <span className="text-soft font-label text-[11px] tracking-[0.24em] uppercase">{flipped ? "Answer" : "Question"}</span>
          <span className={cn("mt-2 block font-normal", flipped ? "text-xl sm:text-2xl" : "font-display text-3xl sm:text-4xl")}>
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

function QuickQuiz() {
  const [seed, setSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000));
  const [score, setScore] = useState<number | null>(null);
  // every quiz has a number; the same number always gives the same ten questions, so a friend can take the same one
  const qs = useMemo(() => seededQuestions(seed), [seed]);
  return (
    <div className="chunk p-5 sm:p-7">
      {score === null ? (
        <Quiz key={seed} questions={qs} onDone={(s) => setScore(s)} doneLabel="See my score" />
      ) : (
        <div className="pop">
          <h2 className="text-3xl font-normal">
            {Math.round(score * qs.length)} of {qs.length} right
          </h2>
          <p className="text-soft mt-2">{score === 1 ? "Clean sweep." : "Each explanation told you why. Another round uses a fresh mix."}</p>
          <Btn className="mt-4" onClick={() => (setScore(null), setSeed(1000 + Math.floor(Math.random() * 9000)))}>
            Another round <Arrow />
          </Btn>
          <ChallengeInvite seed={seed} right={Math.round(score * qs.length)} total={qs.length} />
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
      <Display as="h1" className="mt-5">Your progress</Display>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [String(p.xp), "XP"],
          [String(streak(p)), streak(p) === 1 ? "day streak" : "day streak"],
          [`${Object.keys(p.done).length}/${allLessons.length}`, "stops done"],
        ].map(([n, l]) => (
          <div key={l} className="chunk p-4 text-center">
            <p className="font-display text-3xl font-normal sm:text-4xl">{n}</p>
            <p className="text-soft font-label text-[10px] tracking-[0.22em] uppercase">{l}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-normal">Badges</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {badges.map(([name, how, got]) => (
          <div key={name} className={cn("flex items-center gap-3 rounded-sm border p-3.5", got ? "border-edge bg-card" : "border-line border-dashed")}>
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full border", got ? "border-edge bg-sun text-[#471f28]" : "border-line text-soft")}>{got ? <Check /> : "?"}</span>
            <span>
              <span className={cn("block font-bold", !got && "text-soft")}>{name}</span>
              <span className="text-soft block text-sm">{how}</span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-normal">Share it</h2>
      <div className="mt-4">
        <ShareCard />
      </div>

      <h2 className="mt-10 text-2xl font-normal">By stage</h2>
      <div className="mt-4 grid gap-4">
        {net.stages
          .filter((s) => s.lessons.length)
          .map((s) => {
            const n = done(s.lessons.map((l) => l.id));
            return (
              <div key={s.id}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>
                    {s.level}: {s.title}
                  </span>
                  <span className="font-mono">
                    {n}/{s.lessons.length}
                  </span>
                </div>
                <Bar value={n / s.lessons.length} className="mt-1.5" />
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
      <Tag className={path.color === "cloud" ? "bg-cloud text-[#471f28]" : "bg-ai text-ai-ink"}>Being built</Tag>
      <Display as="h1" className="mt-5">{path.name}</Display>
      <p className="text-soft mt-2 max-w-[60ch]">{path.goal} This path is planned and not written yet. Here is what it will cover.</p>
      <ol className="mt-6 grid gap-2">
        {path.outline.map((t, i) => (
          <li key={t} className="border-line flex items-center gap-3 rounded-sm border border-dashed px-4 py-3">
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
  const Q = ({ q, children }: { q: string; children: ReactNode }) => (
    <div className="border-line border-t pt-4">
      <h2 className="text-xl font-normal">{q}</h2>
      <div className="text-soft mt-1.5 grid max-w-[66ch] gap-2">{children}</div>
    </div>
  );
  return (
    <div className={cn(wrap, "max-w-3xl py-10")}>
      <Display as="h1" className="mt-5">How this site works</Display>
      <div className="mt-8 grid gap-6">
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
      <Display as="h1" className="mt-5">That stop isn't on the map.</Display>
      <Btn className="mt-6" onClick={() => go("map")}>
        Back to the map <Arrow />
      </Btn>
    </div>
  );
}
