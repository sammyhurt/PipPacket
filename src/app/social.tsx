/**
 * The social pieces that need no accounts: a picture of your progress to post, and quiz challenges sent as a link.
 * A challenge link carries only a quiz number and a score ("#challenge-q-4821-7"), never anything about the person.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { allLessons, allQuestions } from "@/content/paths";
import { cn } from "@/lib/utils";

import { go } from "./router";
import { streak, useProgress } from "./store";
import { Arrow, Btn, Check, Tag } from "./ui";
import { Quiz } from "./widgets";

/** Copy text, with a visible fallback for browsers that refuse the clipboard. */
export function CopyBtn({ text, label, tone = "plain" }: { text: string; label: string; tone?: "plain" | "net" }) {
  const [state, setState] = useState<"" | "done" | "manual">("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
      setTimeout(() => setState(""), 2500);
    } catch {
      setState("manual");
    }
  };
  return (
    <span className="inline-flex max-w-full flex-col gap-2">
      <Btn tone={tone} onClick={copy}>
        {state === "done" ? (
          <>
            <Check className="size-4" /> Copied
          </>
        ) : (
          label
        )}
      </Btn>
      {state === "manual" ? <input readOnly value={text} aria-label="Copy this text" onFocus={(e) => e.currentTarget.select()} className="border-edge bg-card h-10 w-72 max-w-full rounded-xl border-2 px-3 font-mono text-xs" /> : null}
    </span>
  );
}

/* ───────────── Share card ───────────── */

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}
/** A 4:5 picture of your progress, drawn in the site's colors, sized for Instagram, TikTok and LinkedIn. */
export function ShareCard() {
  const p = useProgress();
  const [src, setSrc] = useState("");
  const done = Object.keys(p.done).length;
  const days = streak(p);
  const headline = days >= 2 ? `${days}-day streak` : done ? `${done} ${done === 1 ? "stop" : "stops"} done` : "Day one";
  const sub = done ? `${done} of ${allLessons.length} networking stops · ${p.xp} XP` : "Starting the Networking path";
  const caption = `${days >= 2 ? `${days} days in a row` : done ? `${done} stops in` : "Just started"} learning how networks really work. ${p.xp} XP so far. #learningtech #networking #CCNA`;
  useEffect(() => {
    let live = true;
    const draw = () => {
      if (!live) return;
      const W = 1080;
      const H = 1350;
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const c = cv.getContext("2d");
      if (!c) return;
      const ink = "#471f28";
      c.fillStyle = "#f7e9de";
      c.fillRect(0, 0, W, H);
      // hard shadow, then the berry panel
      c.fillStyle = ink;
      roundRect(c, 96, 196, W - 160, 760, 56);
      c.fill();
      c.fillStyle = "#be3c63";
      roundRect(c, 72, 172, W - 160, 760, 56);
      c.fill();
      c.lineWidth = 8;
      c.strokeStyle = ink;
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = "600 34px 'IBM Plex Mono', monospace";
      c.fillText("MY PROGRESS", 136, 270);
      c.font = "800 150px 'Bricolage Grotesque', 'Figtree', sans-serif";
      const words = headline.split(" ");
      let line = "";
      let y = 470;
      for (const w of words) {
        if (c.measureText(line + w).width > W - 300 && line) {
          c.fillText(line.trim(), 130, y);
          y += 150;
          line = "";
        }
        line += w + " ";
      }
      c.fillText(line.trim(), 130, y);
      c.font = "500 44px 'Figtree', sans-serif";
      c.fillText(sub, 136, 850);
      // the trail of stops along the bottom
      const n = Math.min(allLessons.length, 14);
      for (let i = 0; i < n; i++) {
        const x = 110 + i * ((W - 220) / (n - 1));
        const yy = 1060 + (i % 2 ? 34 : 0);
        c.beginPath();
        c.arc(x, yy, 26, 0, Math.PI * 2);
        c.fillStyle = p.done[allLessons[i].id] ? ink : "#fffaf5";
        c.fill();
        c.lineWidth = 6;
        c.strokeStyle = ink;
        c.stroke();
      }
      c.fillStyle = ink;
      c.font = "800 52px 'Bricolage Grotesque', 'Figtree', sans-serif";
      c.fillText("hopcount", 110, 1250);
      c.font = "500 34px 'Figtree', sans-serif";
      c.fillStyle = "#515559";
      c.textAlign = "right";
      c.fillText("Learn how the internet really works", W - 110, 1248);
      setSrc(cv.toDataURL("image/png"));
    };
    (document.fonts?.ready ?? Promise.resolve()).then(draw, draw);
    return () => {
      live = false;
    };
  }, [headline, sub, p.done]);
  return (
    <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
      {src ? <img src={src} alt={`Share card: ${headline}. ${sub}.`} className="border-edge w-full rounded-2xl border-2 shadow-[4px_4px_0_var(--drop)]" /> : <div className="border-line aspect-[4/5] w-full rounded-2xl border-2 border-dashed" />}
      <div>
        <p className="text-soft max-w-[52ch]">Post your progress and bring a friend along. Press and hold the picture (or right-click it) to save it, then paste the caption.</p>
        <p className="border-line bg-card mt-3 max-w-[52ch] rounded-xl border-2 px-3 py-2 text-sm">{caption}</p>
        <div className="mt-3">
          <CopyBtn text={caption} label="Copy the caption" />
        </div>
        <p className="text-soft mt-3 text-sm">The picture is made in your browser. Nothing is uploaded.</p>
      </div>
    </div>
  );
}

/* ───────────── Challenges ───────────── */

/** The same ten questions for everyone who opens the same quiz number. */
export function seededQuestions(seed: number, count = 10) {
  let s = seed >>> 0 || 1;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const pool = allQuestions.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
export const challengeLink = (seed: number, score: number) => `${location.href.split("#")[0]}#challenge-q-${seed}-${score}`;

export function ChallengeInvite({ seed, right, total }: { seed: number; right: number; total: number }) {
  return (
    <div className="border-line mt-6 border-t-2 pt-5">
      <h3 className="text-xl font-extrabold">Challenge a friend</h3>
      <p className="text-soft mt-1 max-w-[56ch]">
        Send this link. They get the same {total} questions and see your {right} to beat.
      </p>
      <div className="mt-3">
        <CopyBtn tone="net" text={challengeLink(seed, right)} label="Copy challenge link" />
      </div>
    </div>
  );
}

/** What a friend sees when they open a challenge link. */
export function Challenge({ code }: { code: string }) {
  const m = code.match(/^(\d{1,9})-(\d{1,2})$/);
  const seed = m ? Number(m[1]) : 0;
  const theirs = m ? Number(m[2]) : 0;
  const qs = useMemo(() => seededQuestions(seed), [seed]);
  const [mine, setMine] = useState<number | null>(null);
  const [going, setGoing] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  if (!m || theirs > qs.length)
    return (
      <div className="gutter mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-4xl font-extrabold">That challenge link is incomplete.</h1>
        <p className="text-soft mt-2">Ask your friend to copy it again.</p>
        <Btn className="mt-6" onClick={() => go("practice-quiz")}>
          Start your own quiz <Arrow />
        </Btn>
      </div>
    );
  return (
    <div ref={top} className="gutter mx-auto max-w-2xl py-10">
      <Tag className="bg-main text-main-ink">Challenge</Tag>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
        A friend scored {theirs} out of {qs.length}. Your turn.
      </h1>
      {mine === null && !going ? (
        <>
          <p className="text-soft mt-3 max-w-[56ch]">Same ten questions, covering networking from the basics to CCNA level. Each answer comes with the reason, so you learn something even when you miss.</p>
          <Btn size="lg" className="mt-6" onClick={() => setGoing(true)}>
            Take the challenge <Arrow />
          </Btn>
        </>
      ) : mine === null ? (
        <div className="chunk mt-6 p-5 sm:p-7">
          <Quiz questions={qs} doneLabel="See who won" onDone={(s) => setMine(Math.round(s * qs.length))} />
        </div>
      ) : (
        <div className="chunk pop mt-6 p-6">
          <h2 className="text-3xl font-extrabold">{mine > theirs ? "You win." : mine === theirs ? "It's a tie." : "They keep the lead."}</h2>
          <p className={cn("mt-2 font-mono text-lg font-semibold")}>
            You {mine} · Friend {theirs}
          </p>
          <p className="text-soft mt-2 max-w-[56ch]">{mine >= theirs ? "Send it back and see if they can answer." : "The map covers every one of these topics in five-minute stops."}</p>
          <div className="mt-5 flex flex-wrap items-start gap-3">
            <CopyBtn tone="net" text={challengeLink(seed, mine)} label="Send my score back" />
            <Btn tone="plain" onClick={() => go("map")}>
              See the map <Arrow />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── People strip ───────────── */

/** Real people only. Until Bernie supplies them, the cards say what goes there. */
export function People() {
  const slots = ["A network engineer and how she got her first role", "A cloud engineer who changed careers", "Someone working on AI infrastructure today"];
  return (
    <section>
      <h2 className="text-3xl font-extrabold sm:text-4xl">People who started where you are</h2>
      <p className="text-soft mt-2 max-w-[60ch]">Tech needs more women in it. Meet engineers who began with no background and are doing this work now.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {slots.map((s, i) => (
          <div key={s} className="border-line flex flex-col rounded-[18px] border-2 border-dashed p-5">
            <span className={cn("border-edge grid size-14 place-items-center rounded-full border-2 font-mono text-xs font-bold text-[#471f28]", ["bg-net", "bg-cloud", "bg-ai"][i])}>photo</span>
            <p className="mt-4 font-bold">{s}</p>
            <p className="text-soft mt-1 text-sm">Her name, role and two lines in her own words go here.</p>
            <span className="text-soft mt-3 font-mono text-[11px] font-semibold tracking-wide uppercase">Placeholder · needs a real person</span>
          </div>
        ))}
      </div>
    </section>
  );
}
