/**
 * Learning for the youngest: listen, tap and play. Nothing here asks for a name, an account or anything typed about
 * the child, and nothing links out of the site. A simple question stands between a child and the grown-ups' pages.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { kidActivities, type KidActivity } from "@/content/kids";
import { cn } from "@/lib/utils";

import { go } from "./router";
import { actions, useProgress } from "./store";
import { Arrow, Btn, Check, Pip } from "./ui";

const fill = { pink: "bg-pink", aqua: "bg-aqua", sky: "bg-sky", lav: "bg-lav", peri: "bg-peri" } as const;

/* ───────────── reading aloud ───────────── */

/** Read a sentence aloud with the device's own voice, if it has one. Silent if it doesn't. */
export function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.1;
    s.speak(u);
  } catch {
    /* no voice on this device */
  }
}
const hush = () => {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* nothing to stop */
  }
};
function Say({ text, auto, big }: { text: string; auto: boolean; big?: boolean }) {
  useEffect(() => {
    if (auto) speak(text);
    return hush;
  }, [text, auto]);
  return (
    <div className="flex items-start gap-3">
      <button type="button" onClick={() => speak(text)} aria-label="Read this to me" className="bg-main text-main-ink grid size-12 shrink-0 place-items-center rounded-full">
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <p className={cn("font-bold", big ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")} aria-live="polite">
        {text}
      </p>
    </div>
  );
}

/* ───────────── pictures (all drawn here; no photos of children, ever) ───────────── */

const House = ({ color, label }: { color: string; label: string }) => (
  <g aria-label={label}>
    <path d="M-34 0L0 -30 34 0v34h-68z" fill={color} stroke="var(--on)" strokeWidth="3" strokeLinejoin="round" />
    <rect x="-9" y="10" width="18" height="24" rx="3" fill="var(--card)" stroke="var(--on)" strokeWidth="3" />
  </g>
);
const Helper = ({ state }: { state: "wait" | "next" | "done" | "closed" }) => (
  <g>
    <line x1="0" y1="-26" x2="0" y2="-42" stroke="var(--on)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="0" cy="-46" r="5" fill={state === "next" ? "var(--main)" : "var(--card)"} stroke="var(--on)" strokeWidth="3" />
    <rect x="-28" y="-26" width="56" height="50" rx="14" fill={state === "done" ? "var(--aqua)" : state === "closed" ? "var(--line)" : state === "next" ? "var(--lav)" : "var(--card)"} stroke="var(--on)" strokeWidth="3" />
    {state === "closed" ? <path d="M-12 -12l24 24M12 -12l-24 24" stroke="var(--bad)" strokeWidth="5" strokeLinecap="round" /> : state === "done" ? <path d="M-11 0l8 8 15-17" fill="none" stroke="var(--on)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : <><circle cx="-9" cy="-4" r="3.5" fill="var(--on)" /><circle cx="9" cy="-4" r="3.5" fill="var(--on)" /><path d="M-8 9q8 6 16 0" fill="none" stroke="var(--on)" strokeWidth="3" strokeLinecap="round" /></>}
  </g>
);
const Star = ({ on, className }: { on: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill={on ? "var(--pink)" : "none"} stroke="var(--on)" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

/* ───────────── ages 5 to 7: Help Pip get there ───────────── */

// where things sit on the picture (a 600 x 340 drawing)
const HOME = [70, 250] as const;
const GRAN = [530, 250] as const;
const TOP = [[190, 120], [300, 70], [410, 120]] as const; // the first way
const LOW = [[190, 300], [300, 320], [410, 300]] as const; // the other way

/** Tap each glowing helper to pass Pip along. Then one helper closes and the child finds another way. */
export function PipGame() {
  const p = useProgress();
  const [step, setStep] = useState(0); // 0 hello, 1 first trip, 2 arrived, 3 second trip (one helper closed), 4 done
  const [hop, setHop] = useState(0); // how many helpers Pip has passed on this trip
  const [oops, setOops] = useState(false);
  const [voice, setVoice] = useState(true);
  const second = step === 3;
  const line =
    step === 0
      ? "This is Pip. Pip is a message. Pip wants to visit Grandma!"
      : step === 1
        ? ["Tap the glowing helper to pass Pip along.", "Good! Tap the next helper.", "One more helper!"][hop] || ""
        : step === 2
          ? "Pip made it! Helpers pass messages along, one to the next."
          : step === 3
            ? oops
              ? "That helper is closed. Try a different way!"
              : ["Oh no! One helper is closed. Find another way for Pip.", "Yes! Keep going.", "Almost there!"][hop] || ""
            : "You did it! Messages can always find another way.";
  const route = second ? LOW : TOP;
  const at = step === 0 ? HOME : step === 2 || step === 4 ? GRAN : hop === 0 ? HOME : route[hop - 1];
  const tap = (which: "top" | "low", i: number) => {
    if (step !== 1 && step !== 3) return;
    if (second && which === "top") return void setOops(true);
    if (!second && which === "low") return;
    if (i !== hop) return;
    setOops(false);
    if (hop === 2) {
      setHop(0);
      setStep(second ? 4 : 2);
      if (second) actions.star("pip", 3);
    } else setHop(hop + 1);
  };
  const state = (which: "top" | "low", i: number): "wait" | "next" | "done" | "closed" => {
    if (second && which === "top") return i === 1 ? "closed" : "wait";
    const mine = (which === "low") === second && (step === 1 || step === 3);
    if (!mine) return step === 2 && which === "top" ? "done" : step === 4 && which === "low" ? "done" : "wait";
    return i < hop ? "done" : i === hop ? "next" : "wait";
  };
  const path = (pts: readonly (readonly [number, number])[]) => `M ${HOME[0]} ${HOME[1]} ` + pts.map(([x, y]) => `L ${x} ${y}`).join(" ") + ` L ${GRAN[0]} ${GRAN[1]}`;
  return (
    <KidFrame title="Help Pip get there" voice={voice} setVoice={setVoice}>
      <Say text={line} auto={voice} big />
      <div className="bg-tint relative mt-5 overflow-hidden rounded-3xl">
        <svg viewBox="0 0 600 360" className="block w-full" role="img" aria-label="Pip's trip from home to Grandma, past the helpers">
          <path d={path(TOP)} fill="none" stroke="var(--peri)" strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" opacity={second ? 0.35 : 1} />
          {step >= 3 ? <path d={path(LOW)} fill="none" stroke="var(--peri)" strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" /> : null}
          <g transform={`translate(${HOME[0]} ${HOME[1]})`}>
            <House color="var(--sky)" label="Home" />
          </g>
          <g transform={`translate(${GRAN[0]} ${GRAN[1]})`}>
            <House color="var(--lav)" label="Grandma's house" />
          </g>
          {(["top", "low"] as const).map((which) =>
            (which === "top" ? TOP : LOW).map(([x, y], i) =>
              which === "low" && step < 3 ? null : (
                <g key={which + i} transform={`translate(${x} ${y})`} style={{ cursor: "pointer" }} role="button" tabIndex={0} aria-label={state(which, i) === "closed" ? "Closed helper" : `Helper ${i + 1}`} onClick={() => tap(which, i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tap(which, i)}>
                  <circle r="46" fill="transparent" />
                  <g className={cn(state(which, i) === "next" && "glow")} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                    <Helper state={state(which, i)} />
                  </g>
                </g>
              ),
            ),
          )}
          <g style={{ transform: `translate(${at[0] - 36}px, ${at[1] - 92}px)`, transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <svg width="72" height="58" viewBox="0 0 80 64" className={step === 2 || step === 4 ? "bob" : undefined}>
              <rect x="4" y="8" width="72" height="50" rx="10" fill="var(--pink)" stroke="var(--on)" strokeWidth="3" />
              <path d="M6 14l34 24 34-24" fill="none" stroke="var(--on)" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="29" cy="40" r="3.5" fill="var(--on)" />
              <circle cx="51" cy="40" r="3.5" fill="var(--on)" />
              <path d={step === 2 || step === 4 ? "M31 46q9 9 18 0" : "M33 49q7 4 14 0"} fill="none" stroke="var(--on)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </g>
        </svg>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {step === 0 ? (
          <KidBtn onClick={() => setStep(1)}>Let's go</KidBtn>
        ) : step === 2 ? (
          <KidBtn onClick={() => (setStep(3), setHop(0))}>Send Pip again</KidBtn>
        ) : step === 4 ? (
          <>
            <span className="flex gap-1" aria-label="Three stars">
              {[0, 1, 2].map((i) => (
                <Star key={i} on className="pop size-12" />
              ))}
            </span>
            <KidBtn onClick={() => go("")}>All done</KidBtn>
            <Btn tone="plain" size="lg" onClick={() => (setStep(0), setHop(0), setOops(false))}>
              Play again
            </Btn>
          </>
        ) : (
          <p className="text-soft text-lg font-semibold">{second ? "Tap a helper on the open path." : "Tap the helper that glows."}</p>
        )}
      </div>
      {p.band !== "5-7" ? null : <p className="text-soft mt-6 text-sm">For the grown-up: this shows that a message reaches its destination by being passed between devices, and that a network can route around a broken link. Ask: “What happened when a helper closed?”</p>}
    </KidFrame>
  );
}

/* ───────────── ages 8 to 10: Light-switch numbers ───────────── */

const WORTH = [8, 4, 2, 1];
const ROUNDS = [1, 2, 3, 5, 6, 9, 12, 15];
export function LightsGame() {
  const [round, setRound] = useState(-1); // -1 is the introduction
  const [on, setOn] = useState([false, false, false, false]);
  const [voice, setVoice] = useState(false);
  const target = ROUNDS[round];
  const sum = WORTH.reduce((a, w, i) => a + (on[i] ? w : 0), 0);
  const hit = round >= 0 && round < ROUNDS.length && sum === target;
  const done = round >= ROUNDS.length;
  useEffect(() => {
    if (done) actions.star("lights", 3);
  }, [done]);
  const line = round < 0 ? "Computers only know two things: ON and OFF. With just four lights, they can count all the way to 15." : done ? "Code cracked! You just counted the way every computer does. It's called binary." : hit ? `Yes! ${on.map((v) => (v ? "on" : "off")).join(", ")} makes ${target}.` : `Turn on the lights that add up to ${target}.`;
  return (
    <KidFrame title="Light-switch numbers" voice={voice} setVoice={setVoice}>
      <Say text={line} auto={voice} />
      {round < 0 ? (
        <>
          <p className="text-soft mt-4 max-w-[52ch] text-lg">Each light is worth a number. The first is worth 8, then 4, then 2, then 1. Switch a light on and its number counts. Add up the lights that are on.</p>
          <KidBtn className="mt-5" onClick={() => setRound(0)}>
            Start cracking
          </KidBtn>
        </>
      ) : done ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="flex gap-1" aria-label="Three stars">
            {[0, 1, 2].map((i) => (
              <Star key={i} on className="pop size-12" />
            ))}
          </span>
          <KidBtn onClick={() => go("")}>All done</KidBtn>
          <Btn tone="plain" size="lg" onClick={() => (setRound(0), setOn([false, false, false, false]))}>
            Play again
          </Btn>
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-lg font-bold">
              Make <span className="bg-pink text-on rounded-xl px-3 py-1 text-2xl">{target}</span>
            </p>
            <p className="text-soft text-sm font-semibold" aria-label={`Puzzle ${round + 1} of ${ROUNDS.length}`}>
              {round + 1} / {ROUNDS.length}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-4">
            {WORTH.map((w, i) => (
              <button key={w} type="button" disabled={hit} aria-pressed={on[i]} aria-label={`Light worth ${w}`} onClick={() => setOn(on.map((v, n) => (n === i ? !v : v)))} className={cn("border-line flex flex-col items-center gap-2 rounded-3xl border-2 p-3 transition-colors sm:p-5", on[i] ? "bg-aqua border-peri" : "bg-card")}>
                <svg viewBox="0 0 48 64" className="h-20 sm:h-24" aria-hidden>
                  {on[i] ? <circle cx="24" cy="24" r="23" fill="var(--pink)" opacity="0.7" /> : null}
                  <path d="M24 6a16 16 0 0 0-9 29v7h18v-7a16 16 0 0 0-9-29z" fill={on[i] ? "#fff6a8" : "var(--card)"} stroke="var(--on)" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M17 48h14M19 54h10" stroke="var(--on)" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="text-2xl font-extrabold">{w}</span>
                <span className="text-soft text-xs font-bold">{on[i] ? "ON" : "OFF"}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-lg font-semibold" aria-live="polite">
            Lights on add up to <strong>{sum}</strong>
            {!hit && sum > target ? <span className="text-soft"> · too many, switch one off</span> : null}
          </p>
          {hit ? (
            <KidBtn
              className="pop mt-4"
              onClick={() => {
                setRound(round + 1);
                setOn([false, false, false, false]);
              }}
            >
              {round === ROUNDS.length - 1 ? "Finish" : "Next puzzle"}
            </KidBtn>
          ) : null}
        </>
      )}
    </KidFrame>
  );
}

/* ───────────── shared kid pieces ───────────── */

function KidBtn({ children, className, onClick }: { children: ReactNode; className?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("bg-main text-main-ink inline-flex min-h-14 items-center gap-2 rounded-2xl px-7 text-xl font-bold shadow-[0_10px_20px_-12px_var(--main)]", className)}>
      {children} <Arrow className="size-5" />
    </button>
  );
}
function KidFrame({ title, voice, setVoice, children }: { title: string; voice: boolean; setVoice: (v: boolean) => void; children: ReactNode }) {
  return (
    <div className="gutter mx-auto w-full max-w-3xl py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go("")} className="text-soft text-base font-bold">
          ← Back
        </button>
        <h1 className="sr-only">{title}</h1>
        <button type="button" aria-pressed={voice} onClick={() => (voice && hush(), setVoice(!voice))} className={cn("rounded-full px-4 py-2 text-sm font-bold", voice ? "bg-aqua text-on" : "bg-tint")}>
          Read to me: {voice ? "on" : "off"}
        </button>
      </div>
      {children}
    </div>
  );
}

/** The home screen for the two youngest groups: big picture cards, stars, nothing else. */
export function KidsHome() {
  const p = useProgress();
  const mine = kidActivities.filter((a) => a.band === p.band);
  const stars = mine.reduce((n, a) => n + (p.stars[a.id] ?? 0), 0);
  const little = p.band === "5-7";
  return (
    <div className="gutter mx-auto w-full max-w-4xl py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className={cn(little ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>{little ? "Let's play!" : "Pick a puzzle"}</h1>
        <p className="bg-pink text-on flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold" aria-label={`${stars} stars`}>
          <Star on className="size-6" /> {stars}
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mine.map((a) => (
          <ActivityCard key={a.id} a={a} stars={p.stars[a.id] ?? 0} little={little} />
        ))}
      </div>
    </div>
  );
}
function ActivityCard({ a, stars, little }: { a: KidActivity; stars: number; little: boolean }) {
  const body = (
    <>
      <span className={cn("grid aspect-[5/3] w-full place-items-center rounded-2xl", fill[a.color], !a.ready && "opacity-50")}>{a.id === "pip" ? <Pip className="w-24" happy /> : a.id === "lights" ? <span className="text-on text-5xl font-extrabold tracking-widest">1 0 1</span> : <span className="text-on text-lg font-bold">Coming soon</span>}</span>
      <span className={cn("mt-4 block font-bold", little ? "text-2xl" : "text-xl")}>{a.title}</span>
      <span className="text-soft mt-1 block">{a.blurb}</span>
      <span className="mt-3 flex items-center gap-1">
        {a.ready ? [0, 1, 2].map((i) => <Star key={i} on={i < stars} className="size-6" />) : <span className="text-soft text-sm font-semibold">Being made</span>}
        {a.ready && stars ? <Check className="text-good ml-1" /> : null}
      </span>
    </>
  );
  return a.ready ? (
    <button type="button" onClick={() => go("play-" + a.id)} className="chunk press p-4 text-left">
      {body}
    </button>
  ) : (
    <div className="border-line rounded-2xl border border-dashed p-4">{body}</div>
  );
}

/** A sum a five-year-old can't do stands between children and the grown-ups' pages. */
export function GrownUps({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], []);
  if (open) return <>{children}</>;
  return (
    <div className="gutter mx-auto w-full max-w-md py-12">
      <h1 className="text-3xl">For grown-ups</h1>
      <p className="text-soft mt-2">To change who is learning or read how the site works, answer this first.</p>
      <form
        className="chunk mt-6 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(v) === a * b) setOpen(true);
          else setV("");
        }}
      >
        <label htmlFor="gate" className="text-lg font-bold">
          What is {a} × {b}?
        </label>
        <div className="mt-3 flex gap-2">
          <input id="gate" value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" autoComplete="off" className="border-line bg-card h-11 w-28 rounded-xl border px-3 text-lg font-semibold" />
          <Btn type="submit">Continue</Btn>
        </div>
      </form>
      <button type="button" className="text-soft mt-5 font-bold" onClick={() => go("")}>
        ← Back to playing
      </button>
    </div>
  );
}
