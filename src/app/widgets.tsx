/** The hands-on pieces: quiz, put-in-order, binary drill, subnetting trainer, layer diagram. */
import { useEffect, useMemo, useState } from "react";

import type { Question } from "@/content/types";
import { cn } from "@/lib/utils";

import { note } from "./mastery";
import { actions } from "./store";
import { Arrow, Btn, Check, Rich } from "./ui";

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Questions one at a time, with the reason shown after each answer. Calls back with the share answered right. */
export function Quiz({ questions, onDone, doneLabel = "Finish" }: { questions: Question[]; onDone: (score: number, right: boolean[]) => void; doneLabel?: string }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState<boolean[]>([]);
  const cur = questions[i];
  if (!cur) return null;
  const last = i === questions.length - 1;
  const next = () => {
    const all = [...right, picked === cur.answer];
    if (last) return onDone(all.filter(Boolean).length / questions.length, all);
    setRight(all);
    setPicked(null);
    setI(i + 1);
  };
  return (
    <div>
      <p className="text-soft text-xs font-bold tracking-wide">
        Question {i + 1} of {questions.length}
      </p>
      <h3 className="mt-2 text-xl sm:text-2xl">
        <Rich text={cur.q} />
      </h3>
      <div className="mt-4 grid gap-2.5">
        {cur.options.map((o, n) => {
          const show = picked !== null;
          const isRight = n === cur.answer;
          return (
            <button
              key={n}
              type="button"
              disabled={show}
              onClick={() => setPicked(n)}
              className={cn(
                "border-line flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium",
                !show && "bg-card hover:bg-tint",
                show && isRight && "bg-good/15 border-good",
                show && !isRight && picked === n && "bg-bad/15 border-bad",
                show && !isRight && picked !== n && "bg-card opacity-60",
              )}
            >
              <span className="border-line grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-bold">{show && isRight ? <Check className="size-4" /> : String.fromCharCode(65 + n)}</span>
              <span className="min-w-0">
                <Rich text={o} />
              </span>
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="pop mt-4" aria-live="polite">
          <p className={cn("font-bold", picked === cur.answer ? "text-good" : "text-bad")}>{picked === cur.answer ? "Correct." : "Not quite."}</p>
          {cur.why ? (
            <p className="text-soft mt-1 max-w-[66ch]">
              <Rich text={cur.why} />
            </p>
          ) : null}
          <Btn className="mt-4" onClick={next}>
            {last ? doneLabel : "Next question"} <Arrow />
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

/** Tap the steps in the right order. */
export function OrderIt({ prompt, items }: { prompt: string; items: string[] }) {
  const mixed = useMemo(() => {
    let m = shuffle(items);
    if (m.every((x, i) => x === items[i])) m = m.slice().reverse();
    return m;
  }, [items]);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState("");
  const done = picked.length === items.length;
  const tap = (s: string) => {
    if (s === items[picked.length]) {
      setPicked([...picked, s]);
      setWrong("");
    } else setWrong(s);
  };
  return (
    <div className="chunk bg-tint p-4 sm:p-5">
      <p className="text-xs font-bold tracking-wide">Try it</p>
      <p className="mt-1 font-bold">{prompt}</p>
      <ol className="mt-3 grid gap-2">
        {picked.map((s, i) => (
          <li key={s} className="pop border-good bg-good/15 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium">
            <span className="font-mono font-bold">{i + 1}</span> <Rich text={s} />
          </li>
        ))}
      </ol>
      {!done ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {mixed
            .filter((s) => !picked.includes(s))
            .map((s) => (
              <button key={s} type="button" onClick={() => tap(s)} className={cn("border-line bg-card rounded-xl border px-3 py-2 text-left text-sm font-medium", wrong === s && "border-bad bg-bad/15")}>
                <Rich text={s} />
              </button>
            ))}
        </div>
      ) : (
        <p className="text-good mt-3 font-bold">That's the order.</p>
      )}
      <p className="text-soft mt-2 text-sm" aria-live="polite">
        {wrong && !done ? "Not that one yet. What has to happen before it?" : !done ? `Tap what comes ${picked.length ? "next" : "first"}.` : ""}
      </p>
      {picked.length ? (
        <button type="button" className="text-soft mt-1 text-sm underline underline-offset-4" onClick={() => (setPicked([]), setWrong(""))}>
          Start over
        </button>
      ) : null}
    </div>
  );
}

const BITS = [128, 64, 32, 16, 8, 4, 2, 1];
/** Flip eight switches to make a number. */
export function BinaryDrill() {
  const [target, setTarget] = useState(() => 1 + Math.floor(Math.random() * 254));
  const [on, setOn] = useState<boolean[]>(Array(8).fill(false));
  const [streak, setStreak] = useState(0);
  const sum = BITS.reduce((a, b, i) => a + (on[i] ? b : 0), 0);
  const hit = sum === target;
  useEffect(() => {
    if (hit) note("binary", true);
  }, [hit, target]);
  return (
    <div className="chunk bg-tint p-4 sm:p-5">
      <p className="text-xs font-bold tracking-wide">Try it</p>
      <p className="mt-1 font-bold">
        Switch on the bits that add up to <span className="bg-sun rounded-xl px-2 py-0.5 font-code text-on">{target}</span>
      </p>
      <div className="mt-4 grid grid-cols-8 gap-1.5 sm:gap-2">
        {BITS.map((b, i) => (
          <button key={b} type="button" aria-pressed={on[i]} aria-label={`${b}`} disabled={hit} onClick={() => setOn(on.map((v, n) => (n === i ? !v : v)))} className={cn("border-line flex flex-col items-center rounded-xl border py-2 font-code", on[i] ? "bg-main text-main-ink" : "bg-card")}>
            <span className="text-[10px] opacity-80 sm:text-xs">{b}</span>
            <span className="text-xl font-bold sm:text-2xl">{on[i] ? 1 : 0}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 font-code text-sm" aria-live="polite">
        Your total: <strong>{sum}</strong> {hit ? <span className="text-good font-sans font-bold">· Correct, {target} is {on.map((v) => (v ? 1 : 0)).join("")}.</span> : sum > target ? <span className="text-soft font-sans">· Too high.</span> : null}
      </p>
      {hit ? (
        <Btn
          size="sm"
          className="mt-3"
          onClick={() => {
            setTarget(1 + Math.floor(Math.random() * 254));
            setOn(Array(8).fill(false));
            setStreak(streak + 1);
          }}
        >
          Another one <Arrow />
        </Btn>
      ) : null}
      {streak > 1 ? <p className="text-soft mt-2 text-sm">{streak} in a row.</p> : null}
    </div>
  );
}

const toInt = (ip: string) => {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.some((x) => x > 255) ? null : ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
};
const toIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
export function subnetOf(ip: number, prefix: number) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  return { mask, network, broadcast, hosts: 2 ** (32 - prefix) - 2 };
}
function newProblem(hard: boolean) {
  const prefix = hard ? 17 + Math.floor(Math.random() * 14) : 24 + Math.floor(Math.random() * 7);
  const firsts = [10, 172, 192];
  const a = firsts[Math.floor(Math.random() * 3)];
  const b = a === 10 ? Math.floor(Math.random() * 256) : a === 172 ? 16 + Math.floor(Math.random() * 16) : 168;
  const ip = ((a << 24) | (b << 16) | (Math.floor(Math.random() * 256) << 8) | (1 + Math.floor(Math.random() * 254))) >>> 0;
  const s = subnetOf(ip, prefix);
  // never ask about the network or broadcast address itself
  const host = ip === s.network ? ip + 1 : ip === s.broadcast ? ip - 1 : ip;
  return { ip: host, prefix };
}
/** Endless subnetting practice with the working shown after each answer. */
export function SubnetTrainer() {
  const [hard, setHard] = useState(false);
  const [prob, setProb] = useState(() => newProblem(false));
  const [net, setNet] = useState("");
  const [bc, setBc] = useState("");
  const [hosts, setHosts] = useState("");
  const [checked, setChecked] = useState(false);
  const [run, setRun] = useState(0);
  const s = subnetOf(prob.ip, prob.prefix);
  const ok = { net: toInt(net) === s.network, bc: toInt(bc) === s.broadcast, hosts: Number(hosts.replace(/[,\s]/g, "")) === s.hosts };
  const all = ok.net && ok.bc && ok.hosts;
  const octet = Math.min(3, Math.floor((prob.prefix - 1) / 8));
  const maskOctet = (s.mask >>> (24 - octet * 8)) & 255;
  const block = 256 - maskOctet;
  const fresh = (h = hard) => {
    setProb(newProblem(h));
    setNet("");
    setBc("");
    setHosts("");
    setChecked(false);
  };
  const check = () => {
    setChecked(true);
    if (all) {
      actions.subnetRight();
      note("ipv4-subnetting", true);
      setRun(run + 1);
    } else {
      setRun(0);
      note("ipv4-subnetting", false);
    }
  };
  const field = (label: string, v: string, set: (s: string) => void, good: boolean, id: string, ph: string) => (
    <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>
      {label}
      <input id={id} value={v} onChange={(e) => set(e.target.value)} disabled={checked} inputMode="decimal" autoComplete="off" placeholder={ph} className={cn("border-line bg-card h-11 rounded-xl border px-3 font-code text-base font-medium", checked && (good ? "border-good bg-good/10" : "border-bad bg-bad/10"))} />
    </label>
  );
  return (
    <div className="chunk p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-wide">Subnetting trainer</p>
        <div className="border-line flex rounded-full border p-0.5 text-xs font-bold" role="group" aria-label="Difficulty">
          {[false, true].map((h) => (
            <button key={String(h)} type="button" aria-pressed={hard === h} onClick={() => (setHard(h), fresh(h))} className={cn("rounded-full px-3 py-1", hard === h && "bg-ink text-paper")}>
              {h ? "Any octet" : "Last octet"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 font-code text-2xl font-semibold sm:text-3xl">
        {toIp(prob.ip)} <span className="text-main">/{prob.prefix}</span>
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked) check();
        }}
      >
        {field("Network address", net, setNet, ok.net, "sub-net", "0.0.0.0")}
        {field("Broadcast address", bc, setBc, ok.bc, "sub-bc", "0.0.0.0")}
        {field("Usable hosts", hosts, setHosts, ok.hosts, "sub-hosts", "0")}
        <div className="sm:col-span-3">
          {!checked ? (
            <Btn type="submit">Check</Btn>
          ) : (
            <Btn tone="sun" onClick={() => fresh()}>
              Next address <Arrow />
            </Btn>
          )}
        </div>
      </form>
      {checked ? (
        <div className="pop border-line mt-4 border-t pt-4" aria-live="polite">
          <p className={cn("font-bold", all ? "text-good" : "text-bad")}>{all ? `All three right.${run > 1 ? ` ${run} in a row.` : ""}` : "Here is the working."}</p>
          <ol className="text-soft mt-2 grid max-w-[66ch] list-decimal gap-1 pl-5 text-[15px]">
            <li>
              /{prob.prefix} is the mask <code className="text-ink font-code">{toIp(s.mask)}</code>.
            </li>
            <li>
              The octet that matters is number {octet + 1}. Block size: 256 − {maskOctet} = <strong className="text-ink">{block}</strong>.
            </li>
            <li>
              Counting up in {block}s, the block holding this address starts at <code className="text-ink font-code">{toIp(s.network)}</code>. That is the network address.
            </li>
            <li>
              One less than the next block is the broadcast address: <code className="text-ink font-code">{toIp(s.broadcast)}</code>.
            </li>
            <li>
              Host bits: {32 - prob.prefix}. Usable hosts: 2<sup>{32 - prob.prefix}</sup> − 2 = <strong className="text-ink">{s.hosts.toLocaleString("en-US")}</strong> ({toIp(s.network + 1)} to {toIp(s.broadcast - 1)}).
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}

/** A layered diagram, top to bottom. */
export function Stack({ title, rows, note }: { title: string; rows: [string, string][]; note?: string }) {
  return (
    <figure className="chunk overflow-hidden">
      <figcaption className="border-line bg-tint border-b px-4 py-2 text-xs font-bold tracking-wide">{title}</figcaption>
      <div className="grid">
        {rows.map(([a, b], i) => (
          <div key={a} className={cn("grid grid-cols-[minmax(0,10.5rem)_1fr] items-center gap-3 px-4 py-2.5 text-[15px]", i && "border-line border-t")} style={{ background: `color-mix(in srgb, var(--main) ${Math.round(((rows.length - i) / rows.length) * 16)}%, transparent)` }}>
            <strong>{a}</strong>
            <span className="text-soft min-w-0">{b}</span>
          </div>
        ))}
      </div>
      {note ? <p className="border-line text-soft border-t px-4 py-2 text-sm">{note}</p> : null}
    </figure>
  );
}
