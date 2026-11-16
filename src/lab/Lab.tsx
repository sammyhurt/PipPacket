/**
 * The lab screen: a canvas to cable devices on, a command line for each switch and router, a settings form for each PC,
 * a test message you can watch travel, and (in a mission) the goals, which are checked against the network itself.
 */
import { useEffect, useReducer, useRef, useState, type PointerEvent as RPointer } from "react";

import { noteLab } from "@/app/mastery";
import { go } from "@/app/router";
import { actions, useProgress } from "@/app/store";
import { Arrow, Btn, Check, Pip, Rich, Title } from "@/app/ui";
import { cn } from "@/lib/utils";

import { newSession, prompt, run, type Session } from "./cli";
import { dev, freePort, lineState, makeDevice, maskBits, owners, peer, ping, short, toInt, type Device, type Kind, type Net, type PingResult } from "./engine";
import { missionById, missions, type Mission } from "./missions";

const W = 800;
const H = 420;
const wrap = "gutter mx-auto w-full max-w-6xl";

/* ───────────── the list of missions ───────────── */

export function LabHome() {
  const p = useProgress();
  const nextUp = missions.find((m) => !p.labs[m.id]);
  return (
    <div className={cn(wrap, "max-w-5xl py-6 sm:py-8")}>
      <Title as="h1" eyebrow="Lab">
        Build it and fix it
      </Title>
      <p className="text-soft mt-2 max-w-[64ch]">A network you can cable, configure and break, right here in the browser. Each mission is checked by sending real test messages through what you built.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {missions.map((m, i) => (
          <button key={m.id} type="button" onClick={() => go("lab-" + m.id)} className={cn("chunk press flex flex-col p-5 text-left", m === nextUp && "border-main")}>
            <span className="flex items-center gap-2">
              <span className={cn("grid size-8 place-items-center rounded-full text-sm font-extrabold", p.labs[m.id] ? "bg-main text-main-ink" : "bg-tint")}>{p.labs[m.id] ? <Check className="size-4" /> : i + 1}</span>
              <span className="text-soft text-xs font-bold">
                Mission {i + 1} · about {m.minutes} min
              </span>
            </span>
            <span className="mt-3 text-xl font-bold">{m.title}</span>
            <span className="text-soft mt-1 grow text-sm">{m.story}</span>
            <span className="text-main mt-4 inline-flex items-center gap-1.5 text-sm font-bold">
              {p.labs[m.id] ? "Do it again" : m === nextUp ? "Start" : "Open"} <Arrow />
            </span>
          </button>
        ))}
        <button type="button" onClick={() => go("lab-sandbox")} className="chunk press bg-tint flex flex-col p-5 text-left md:col-span-2">
          <span className="text-xl font-bold">Sandbox</span>
          <span className="text-soft mt-1 text-sm">An empty canvas. Add PCs, switches and routers and try anything.</span>
        </button>
      </div>
      <p className="text-soft mt-6 max-w-[70ch] text-sm">This is a teaching simulator. It understands the commands these missions use, not everything a real Cisco device does. For wider practice use Cisco Packet Tracer or real equipment.</p>
    </div>
  );
}

/* ───────────── pictures of the devices ───────────── */

function Shape({ kind }: { kind: Kind }) {
  if (kind === "pc")
    return (
      <>
        <rect x="-26" y="-22" width="52" height="36" rx="5" fill="var(--card)" stroke="var(--on)" strokeWidth="2.5" />
        <rect x="-19" y="-15" width="38" height="22" rx="2" fill="var(--aqua)" />
        <path d="M-8 14v7M8 14v7M-16 22h32" stroke="var(--on)" strokeWidth="2.5" strokeLinecap="round" />
      </>
    );
  if (kind === "switch")
    return (
      <>
        <rect x="-40" y="-17" width="80" height="34" rx="8" fill="var(--lav)" stroke="var(--on)" strokeWidth="2.5" />
        <path d="M-24 -5h18m-5 -5l5 5-5 5M24 6H6m5 -5l-5 5 5 5" fill="none" stroke="var(--on)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  return (
    <>
      <circle r="26" fill="var(--sky)" stroke="var(--on)" strokeWidth="2.5" />
      <path d="M-14 0h28M0 -14v28M-9 -5l-5 5 5 5M9 -5l5 5-5 5M-5 -9l5 -5 5 5M-5 9l5 5 5 -5" fill="none" stroke="var(--on)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/* ───────────── a running lab ───────────── */

const saveKey = (id: string) => "pippacket-lab-" + id;
function load(id: string, m?: Mission): Net {
  try {
    const raw = localStorage.getItem(saveKey(id));
    if (raw) return JSON.parse(raw) as Net;
  } catch {
    /* start fresh */
  }
  return m ? m.start() : { devices: [], links: [] };
}

export function LabRun({ id }: { id: string }) {
  const mission = missionById(id);
  const netRef = useRef<Net>(null as unknown as Net);
  if (!netRef.current) netRef.current = load(id, mission);
  const net = netRef.current;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const changed = () => {
    try {
      localStorage.setItem(saveKey(id), JSON.stringify(net));
    } catch {
      /* kept for this visit only */
    }
    bump();
  };
  const [sel, setSel] = useState<string>("");
  const [tab, setTab] = useState<"mission" | "device">(mission ? "mission" : "device");
  const [cabling, setCabling] = useState<"" | "pick" | string>(""); // "", waiting for the first device, or its id
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fly, setFly] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [justDone, setJustDone] = useState(false);
  const sessions = useRef<Record<string, { s: Session; log: string[] }>>({});
  const svg = useRef<SVGSVGElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const selected = net.devices.find((d) => d.id === sel);
  const live = mission ? mission.goals.map((g) => g.test(net)) : [];
  const allDone = !!mission && live.every((r) => r.ok);
  // credit is for finishing the work in this sitting, not for reopening a network that was already complete
  const credited = useRef(allDone);
  useEffect(() => {
    if (allDone && mission && !credited.current) {
      credited.current = true;
      noteLab(mission.skills);
      if (actions.lab(mission.id)) setJustDone(true);
    }
  }, [allDone, mission]);

  /** Send a test message and animate it along the path it really takes. */
  const send = (fromId: string, dst: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const r: PingResult = ping(net, fromId, dst);
    const from = dev(net, fromId);
    const pts = r.path.map((d) => dev(net, d)).map((d) => ({ x: d.x, y: d.y }));
    const route = r.ok ? [...pts, ...pts.slice(0, -1).reverse()] : pts;
    setMsg(null);
    setFly({ ...route[0], show: true });
    route.forEach((pt, i) => timers.current.push(window.setTimeout(() => setFly({ ...pt, show: true }), 60 + i * 520)));
    timers.current.push(
      window.setTimeout(
        () => {
          setFly((f) => ({ ...f, show: false }));
          setMsg(r.ok ? { ok: true, text: `${from.name} → ${dst}: the message arrived and the reply came back.` } : { ok: false, text: `${from.name} → ${dst}: no reply. ${r.why}` });
        },
        160 + route.length * 520,
      ),
    );
  };

  /* dragging devices; clicking selects, or picks an end for a cable */
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const toSvg = (e: { clientX: number; clientY: number }) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    return { x: e.clientX * m.a + e.clientY * m.c + m.e, y: e.clientX * m.b + e.clientY * m.d + m.f };
  };
  const down = (e: RPointer, d: Device) => {
    const pt = toSvg(e);
    drag.current = { id: d.id, dx: d.x - pt.x, dy: d.y - pt.y, moved: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: RPointer) => {
    const g = drag.current;
    if (!g) return;
    const pt = toSvg(e);
    const d = dev(net, g.id);
    const nx = Math.max(46, Math.min(W - 46, pt.x + g.dx));
    const ny = Math.max(40, Math.min(H - 56, pt.y + g.dy));
    if (Math.abs(nx - d.x) + Math.abs(ny - d.y) > 3) g.moved = true;
    if (g.moved) {
      d.x = nx;
      d.y = ny;
      bump();
    }
  };
  const up = (d: Device) => {
    const g = drag.current;
    drag.current = null;
    if (g?.moved) return changed();
    if (cabling === "pick") return setCabling(d.id);
    if (cabling && cabling !== d.id) {
      const a = dev(net, cabling);
      const [pa, pb] = [freePort(net, a), freePort(net, d)];
      if (!pa || !pb) setMsg({ ok: false, text: `${!pa ? a.name : d.name} has no free port.` });
      else {
        net.links.push({ a: { d: a.id, i: pa.name }, b: { d: d.id, i: pb.name } });
        setMsg({ ok: true, text: `Cabled ${a.name} ${short(pa.name)} to ${d.name} ${short(pb.name)}.` });
        changed();
      }
      return setCabling("");
    }
    setSel(d.id);
    setTab("device");
  };
  const add = (kind: Kind) => {
    const n = net.devices.filter((d) => d.kind === kind).length + 1;
    const name = (kind === "pc" ? "PC" : kind === "switch" ? "S" : "R") + n;
    const d = makeDevice(kind, "d" + Date.now().toString(36), name, 120 + ((net.devices.length * 130) % 560), kind === "pc" ? 310 : 120);
    net.devices.push(d);
    setSel(d.id);
    setTab("device");
    changed();
  };
  const remove = (d: Device) => {
    net.links = net.links.filter((l) => l.a.d !== d.id && l.b.d !== d.id);
    net.devices = net.devices.filter((x) => x !== d);
    setSel("");
    changed();
  };
  const reset = () => {
    try {
      localStorage.removeItem(saveKey(id));
    } catch {
      /* nothing saved */
    }
    netRef.current = mission ? mission.start() : { devices: [], links: [] };
    credited.current = false;
    sessions.current = {};
    setSel("");
    setMsg(null);
    setJustDone(false);
    bump();
  };

  if (id !== "sandbox" && !mission)
    return (
      <div className={cn(wrap, "max-w-2xl py-16 text-center")}>
        <h1 className="text-3xl">That mission isn't in the lab.</h1>
        <Btn className="mt-6" onClick={() => go("lab")}>
          All missions <Arrow />
        </Btn>
      </div>
    );
  const idx = mission ? missions.indexOf(mission) : -1;
  const after = missions[idx + 1];

  return (
    <div className={cn(wrap, "py-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={() => go("lab")} className="text-soft text-sm font-semibold">
            ← All missions
          </button>
          <h1 className="mt-1 text-2xl sm:text-3xl">{mission ? mission.title : "Sandbox"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!mission ? (
            <>
              <Btn size="sm" tone="plain" onClick={() => add("pc")}>+ PC</Btn>
              <Btn size="sm" tone="plain" onClick={() => add("switch")}>+ Switch</Btn>
              <Btn size="sm" tone="plain" onClick={() => add("router")}>+ Router</Btn>
            </>
          ) : null}
          <Btn size="sm" tone={cabling ? "net" : "plain"} aria-pressed={!!cabling} onClick={() => setCabling(cabling ? "" : "pick")}>
            {cabling ? "Cancel cable" : "Cable"}
          </Btn>
          <Btn size="sm" tone="plain" onClick={reset}>
            Start over
          </Btn>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="chunk bg-tint relative overflow-x-auto">
            <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[640px] touch-pan-x touch-pan-y select-none" role="img" aria-label="The network. Devices can be dragged; click one to open it.">
              {net.links.map((l, n) => {
                const [a, b] = [dev(net, l.a.d), dev(net, l.b.d)];
                const [ia, ib] = [a.ifaces.find((i) => i.name === l.a.i)!, b.ifaces.find((i) => i.name === l.b.i)!];
                const upLine = lineState(net, a, ia) === "up";
                const at = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
                // port marks sit clear of the device pictures: further out from a switch, which has several
                const [la, lb] = [at(a.kind === "pc" ? 0.2 : 0.36), at(b.kind === "pc" ? 0.8 : 0.64)];
                return (
                  <g key={n}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={upLine ? "var(--peri)" : "var(--bad)"} strokeWidth="3" strokeDasharray={upLine ? undefined : "6 7"} />
                    {[[la, a, ia] as const, [lb, b, ib] as const].map(([pt, d, i], k) => (
                      <g key={k}>
                        <circle cx={pt.x} cy={pt.y} r="5" fill={lineState(net, d, i) === "up" ? "var(--good)" : "var(--bad)"} />
                        {d.kind !== "pc" ? (
                          <text x={pt.x} y={pt.y - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--soft)">
                            {short(i.name)}
                            {d.kind === "switch" ? (i.mode === "trunk" ? " · trunk" : i.vlan !== 1 ? ` · v${i.vlan}` : "") : ""}
                          </text>
                        ) : null}
                      </g>
                    ))}
                  </g>
                );
              })}
              {net.devices.map((d) => {
                const ip = d.kind === "pc" ? d.ifaces[0].ip : owners(net).find((o) => o.d === d)?.ip;
                const picked = sel === d.id || cabling === d.id;
                return (
                  <g key={d.id} transform={`translate(${d.x} ${d.y})`} onPointerDown={(e) => down(e, d)} onPointerMove={move} onPointerUp={() => up(d)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && up(d)} role="button" tabIndex={0} aria-label={`${d.name}${ip ? ", " + ip : ""}`} style={{ cursor: cabling ? "crosshair" : "grab", touchAction: "none" }}>
                    <rect x="-52" y="-36" width="104" height="92" rx="14" fill={picked ? "var(--card)" : "transparent"} stroke={picked ? "var(--main)" : "transparent"} strokeWidth="2.5" />
                    <Shape kind={d.kind} />
                    <text y="38" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="var(--ink)">
                      {d.name}
                    </text>
                    <text y="52" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--soft)">
                      {ip || (d.kind === "pc" ? "no address" : "")}
                    </text>
                  </g>
                );
              })}
              <g style={{ transform: `translate(${fly.x - 22}px, ${fly.y - 52}px)`, transition: "transform 0.5s ease-in-out", opacity: fly.show ? 1 : 0, pointerEvents: "none" }}>
                <svg width="44" height="36" viewBox="0 0 80 64">
                  <rect x="4" y="8" width="72" height="50" rx="10" fill="var(--pink)" stroke="var(--on)" strokeWidth="4" />
                  <path d="M6 14l34 24 34-24" fill="none" stroke="var(--on)" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </g>
              {!net.devices.length ? (
                <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--soft)">
                  Add a PC and a switch to begin.
                </text>
              ) : null}
            </svg>
          </div>
          <p className={cn("mt-3 min-h-12 rounded-xl px-4 py-3 text-sm font-semibold", cabling ? "bg-lav/40" : msg ? (msg.ok ? "bg-good/15 text-good" : "bg-bad/10 text-bad") : "bg-tint text-soft")} aria-live="polite">
            {cabling === "pick" ? "Cable: click the first device." : cabling ? `Cable from ${dev(net, cabling).name}: now click the device at the other end.` : msg ? msg.text : "Click a device to open it. Drag devices to tidy up. A dashed red line is a link that is down."}
          </p>
        </div>

        <div className="chunk min-w-0 overflow-hidden">
          <div className="border-line flex border-b" role="tablist">
            {(mission ? (["mission", "device"] as const) : (["device"] as const)).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex-1 px-4 py-3 text-sm font-bold", tab === t ? "text-main border-main border-b-2" : "text-soft")}>
                {t === "mission" ? `Mission${mission ? ` · ${live.filter((r) => r.ok).length}/${live.length}` : ""}` : selected ? selected.name : "Device"}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-5">
            {tab === "mission" && mission ? (
              <MissionPanel m={mission} results={live} done={allDone} fresh={justDone} after={after} />
            ) : selected ? (
              <DevicePanel key={selected.id} net={net} d={selected} sessions={sessions.current} changed={changed} send={send} remove={() => remove(selected)} canRemove={!mission} />
            ) : (
              <p className="text-soft text-sm">Click a device on the canvas to open it. PCs have address settings and a test message. Switches and routers have a command line.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionPanel({ m, results, done, fresh, after }: { m: Mission; results: { ok: boolean; why?: string }[]; done: boolean; fresh: boolean; after?: Mission }) {
  const [hints, setHints] = useState(0);
  const [know, setKnow] = useState(true);
  return (
    <div>
      {done ? (
        <div className="pop bg-good/15 mb-4 rounded-xl p-4">
          <p className="flex items-center gap-3 text-lg font-bold">
            <Pip className="bob w-12" happy /> Mission complete{fresh ? " · +20 XP" : ""}
          </p>
          <p className="mt-2 text-sm">{m.done}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {after ? (
              <Btn size="sm" onClick={() => go("lab-" + after.id)}>
                Next: {after.title} <Arrow />
              </Btn>
            ) : null}
            <Btn size="sm" tone="plain" onClick={() => go("map")}>
              Skill tree
            </Btn>
          </div>
        </div>
      ) : null}
      <p className="text-[15px]">{m.story}</p>
      <h2 className="mt-4 text-sm font-bold">Goals</h2>
      <ul className="mt-2 grid gap-2">
        {m.goals.map((g, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", results[i].ok ? "bg-good text-paper" : "border-peri border-2")}>{results[i].ok ? <Check className="size-3" /> : null}</span>
            <span className="min-w-0">
              <span className={cn("font-semibold", results[i].ok && "text-soft")}>{g.text}</span>
              {!results[i].ok && results[i].why ? <span className="text-soft block text-xs">{results[i].why}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="mt-5 flex w-full items-center justify-between text-left text-sm font-bold" aria-expanded={know} onClick={() => setKnow(!know)}>
        What you need to know <span className="text-soft">{know ? "–" : "+"}</span>
      </button>
      {know ? (
        <>
          <ul className="text-soft mt-2 grid list-disc gap-1.5 pl-5 text-sm">
            {m.know.map((k) => (
              <li key={k}>
                <Rich text={k} />
              </li>
            ))}
          </ul>
          {m.commands ? <pre className="bg-code-bg text-code-fg font-code mt-3 overflow-x-auto rounded-xl p-3 text-[12.5px] leading-relaxed">{m.commands.join("\n")}</pre> : null}
        </>
      ) : null}
      <div className="mt-4">
        {m.hints.slice(0, hints).map((h, i) => (
          <p key={i} className="bg-pink/40 mb-2 rounded-xl px-3 py-2 text-sm">
            <strong>Hint {i + 1}. </strong>
            <Rich text={h} />
          </p>
        ))}
        {hints < m.hints.length ? (
          <button type="button" className="text-main text-sm font-bold" onClick={() => setHints(hints + 1)}>
            {hints ? "Another hint" : "Stuck? Show a hint"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DevicePanel({ net, d, sessions, changed, send, remove, canRemove }: { net: Net; d: Device; sessions: Record<string, { s: Session; log: string[] }>; changed: () => void; send: (from: string, dst: string) => void; remove: () => void; canRemove: boolean }) {
  const others = owners(net).filter((o) => o.d !== d);
  const [target, setTarget] = useState(others[0]?.ip || "");
  const unplug = (i: string) => {
    net.links = net.links.filter((l) => !((l.a.d === d.id && l.a.i === i) || (l.b.d === d.id && l.b.i === i)));
    changed();
  };
  const pinger = (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (target) send(d.id, target.trim());
      }}
    >
      <label htmlFor="lab-target" className="text-sm font-bold">
        Send a test message to
      </label>
      <div className="mt-1.5 flex gap-2">
        <input id="lab-target" list="lab-ips" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.20" autoComplete="off" className="border-line bg-card font-code h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm" />
        <datalist id="lab-ips">
          {others.map((o) => (
            <option key={o.d.id + o.via} value={o.ip}>
              {o.d.name}
            </option>
          ))}
        </datalist>
        <Btn size="sm" type="submit">
          Send
        </Btn>
      </div>
    </form>
  );
  if (d.kind === "pc") {
    const i = d.ifaces[0];
    const p = peer(net, d.id, i.name);
    const field = (label: string, id: string, v: string | undefined, set: (s: string | undefined) => void, bad: boolean, ph: string) => (
      <label className="grid gap-1 text-sm font-bold" htmlFor={id}>
        {label}
        <input
          id={id}
          value={v || ""}
          placeholder={ph}
          inputMode="decimal"
          autoComplete="off"
          onChange={(e) => {
            set(e.target.value.trim() || undefined);
            changed();
          }}
          className={cn("border-line bg-card font-code h-10 rounded-xl border px-3 text-sm font-medium", bad && "border-bad")}
        />
      </label>
    );
    return (
      <div>
        <div className="grid gap-3">
          {field("IP address", "pc-ip", i.ip, (s) => (i.ip = s), !!i.ip && toInt(i.ip) === null, "192.168.1.10")}
          {field("Subnet mask", "pc-mask", i.mask, (s) => (i.mask = s), !!i.mask && maskBits(i.mask) === null, "255.255.255.0")}
          {field("Default gateway (optional)", "pc-gw", d.gateway, (s) => (d.gateway = s), !!d.gateway && toInt(d.gateway) === null, "192.168.1.1")}
        </div>
        <p className="text-soft mt-3 text-sm">
          {p ? `Cabled to ${p.d.name} ${short(p.i.name)}. ` : "Not cabled. Use Cable above, then click this PC and a switch. "}
          {p ? (
            <button type="button" className="underline underline-offset-4" onClick={() => unplug(i.name)}>
              Unplug
            </button>
          ) : null}
        </p>
        {pinger}
        {canRemove ? (
          <button type="button" className="text-soft mt-4 text-sm underline underline-offset-4" onClick={remove}>
            Remove this PC
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div>
      <Terminal net={net} d={d} store={(sessions[d.id] ||= { s: newSession(), log: [`${d.name} is ready. Type ? to see the commands available here.`] })} changed={changed} />
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-bold">Ports and cables</summary>
        <ul className="mt-2 grid gap-1 text-sm">
          {d.ifaces.map((i) => {
            const p = peer(net, d.id, i.name);
            const st = lineState(net, d, i);
            return (
              <li key={i.name} className="flex items-center gap-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", st === "up" ? "bg-good" : st === "down" ? "bg-line" : "bg-bad")} />
                <span className="font-code w-14 text-xs">{short(i.name)}</span>
                <span className="text-soft min-w-0 flex-1 truncate">{p ? `${p.d.name} ${short(p.i.name)}` : "empty"}</span>
                {p ? (
                  <button type="button" className="text-soft text-xs underline underline-offset-4" onClick={() => unplug(i.name)}>
                    Unplug
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </details>
      {pinger}
      {canRemove ? (
        <button type="button" className="text-soft mt-4 text-sm underline underline-offset-4" onClick={remove}>
          Remove this device
        </button>
      ) : null}
    </div>
  );
}

function Terminal({ net, d, store, changed }: { net: Net; d: Device; store: { s: Session; log: string[] }; changed: () => void }) {
  const [line, setLine] = useState("");
  const hist = useRef<string[]>([]);
  const at = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  });
  const submit = () => {
    const cmd = line;
    const pr = prompt(d, store.s);
    const out = run(net, d, store.s, cmd);
    store.log.push(pr + cmd, ...(out ? [out] : []));
    if (store.log.length > 400) store.log.splice(0, store.log.length - 400);
    if (cmd.trim()) hist.current.push(cmd);
    at.current = hist.current.length;
    setLine("");
    changed();
  };
  return (
    <div className="bg-code-bg text-code-fg font-code overflow-hidden rounded-xl text-[12.5px] leading-relaxed" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}>
      <div ref={box} className="h-64 overflow-auto p-3 whitespace-pre sm:h-72" aria-live="polite">
        {store.log.join("\n")}
      </div>
      <form
        className="flex items-center gap-1 border-t border-white/10 px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="lab-cli" className="shrink-0">
          {prompt(d, store.s)}
        </label>
        <input
          id="lab-cli"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              at.current = Math.max(0, Math.min(hist.current.length, at.current + (e.key === "ArrowUp" ? -1 : 1)));
              setLine(hist.current[at.current] || "");
            }
          }}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label={`Command line on ${d.name}`}
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </form>
    </div>
  );
}
