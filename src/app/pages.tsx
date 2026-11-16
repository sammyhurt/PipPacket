import { useEffect, useMemo, useState, type ReactNode } from "react";

import { bandById, bands, teachingSources } from "@/content/kids";
import { allCards, allLessons, lessonById, net, paths, placement, stageOf } from "@/content/paths";
import type { Block, Lesson } from "@/content/types";
import { cn } from "@/lib/utils";

import { go } from "./router";
import { ChallengeInvite, People, seededQuestions, ShareCard } from "./social";
import { actions, getProgress, isChild, streak, today, useProgress, type Progress } from "./store";
import { Arrow, Bar, Btn, Check, Display, Eyebrow, Reveal, Rich, Tag, Title } from "./ui";
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
  const lessons = young ? net.stages[0].lessons : allLessons;
  const next = lessons.find((l) => !isDone(p, l.id) && !p.skipped.includes(l.id)) || lessons.find((l) => !isDone(p, l.id));
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
        <div className="chunk flex flex-col p-6 sm:p-7">
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
              See all stops
            </Btn>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Bar value={lessons.length ? doneCount / lessons.length : 0} className="grow" />
            <span className="text-soft text-sm font-semibold">
              {doneCount} of {lessons.length} stops
            </span>
          </div>
        </div>
        <div className="grid gap-4">
          <button type="button" onClick={() => go("practice-cards")} className="chunk press bg-aqua/40 p-5 text-left">
            <Eyebrow>Today's practice</Eyebrow>
            <p className="mt-1 text-xl font-bold">{due ? `${due} flashcard${due === 1 ? "" : "s"} due` : "Flashcards"}</p>
            <p className="text-soft mt-1 text-sm">{due ? "Two minutes keeps them in your memory." : "Finish a stop and its cards appear here."}</p>
          </button>
          <button type="button" onClick={() => go(young ? "practice-binary" : "practice-subnet")} className="chunk press bg-pink/40 p-5 text-left">
            <Eyebrow>Quick drill</Eyebrow>
            <p className="mt-1 text-xl font-bold">{young ? "Binary switches" : "Subnetting trainer"}</p>
            <p className="text-soft mt-1 text-sm">{young ? "Flip eight switches to make a number." : "Endless addresses, with the working shown."}</p>
          </button>
        </div>
      </section>

      {young ? (
        <section className="chunk bg-tint p-5">
          <p className="font-bold">More for ages 11 to 13 is on the way</p>
          <p className="text-soft mt-1 text-sm">Guided challenges and small projects are being built. The seven “Start from zero” stops are ready now.</p>
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
      <Display as="h1" className="mt-3">Networking</Display>
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

      {(p.band === "11-13" ? net.stages.slice(0, 1) : net.stages).map((stage) => {
        const sd = stage.lessons.filter((l) => isDone(p, l.id)).length;
        return (
          <section key={stage.id} className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Tag className={stage.lessons.length ? "bg-card" : "text-soft border-line bg-transparent"}>{stage.level}</Tag>
                <Display className={cn("mt-3 text-[clamp(1.3rem,2.6vw,1.7rem)]", !stage.lessons.length && "text-soft")}>{stage.title}</Display>
                <p className="text-soft mt-1 text-[15px]">{stage.blurb}</p>
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
                  <li key={t} className="border-line text-soft flex items-center gap-3 rounded-xl border border-dashed px-4 py-2.5 text-[15px]">
                    <span className="border-line size-3 shrink-0 rounded-full border" /> {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
      <section className={cn("mt-12", p.band === "11-13" && "hidden")}>
        <Tag className="text-soft border-line bg-transparent">After CCNA</Tag>
        <Display className="text-soft mt-3 text-[clamp(1.3rem,2.6vw,1.7rem)]">CCNP Enterprise and expert scenarios</Display>
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
            <span className={cn("press border-line grid size-16 shrink-0 place-items-center rounded-full border font-mono text-lg font-bold", done ? "bg-ink text-paper" : here ? "bg-main bob text-main-ink" : skipped ? "bg-tint text-soft border-dashed" : "bg-card")}>{done ? <Check className="size-7" /> : i + 1}</span>
            <span className="min-w-0">
              {here ? <span className="bg-main text-main-ink mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold tracking-wide">You are here</span> : null}
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

      <section className="chunk mt-12 p-5 sm:p-7" id="check">
        {result ? (
          <div className="pop" aria-live="polite">
            <p className="text-xs font-bold tracking-wide">Stop complete</p>
            <h2 className="mt-1 text-3xl font-bold">
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
            <p className="mb-4 text-xs font-bold tracking-wide">Check yourself</p>
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

      <h2 className="mt-10 text-2xl font-bold">By stage</h2>
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
