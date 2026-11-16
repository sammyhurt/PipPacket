import { useEffect, type ReactNode } from "react";

import { bandById } from "@/content/kids";
import { cn } from "@/lib/utils";

import { GrownUps, KidsHome, LightsGame, PipGame } from "./kids";
import { About, Home, LessonPage, MapPage, Me, Missing, PathPlan, Practice, Start, Who } from "./pages";
import { go, useRoute } from "./router";
import { Challenge } from "./social";
import { actions, isChild, isLittle, useProgress } from "./store";
import { Pip } from "./ui";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const ICONS = {
  home: icon("M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"),
  learn: icon("M5 19c3-1 3-5 6-6s3-5 6-6M5 19h.01M12 13h.01M19 6h.01"),
  practice: icon("M13 3L5 14h6l-1 7 8-11h-6z"),
  progress: icon("M5 20V10M12 20V4M19 20v-7"),
  people: icon("M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
};

export default function App() {
  const route = useRoute();
  const p = useProgress();
  // an explicit light/dark choice wins over the device setting; no choice follows the device
  useEffect(() => {
    if (p.theme) document.documentElement.dataset.theme = p.theme;
  }, [p.theme]);
  const dark = p.theme ? p.theme === "dark" : typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  const little = isLittle(p.band);
  const band = bandById(p.band);

  let page: ReactNode;
  if (!p.band && !route.startsWith("challenge-q-")) page = <Who />;
  else if (route === "who") page = little ? <GrownUps><Who /></GrownUps> : <Who />;
  else if (route === "about") page = little ? <GrownUps><About /></GrownUps> : <About />;
  else if (little) page = route === "play-pip" ? <PipGame /> : route === "play-lights" ? <LightsGame /> : <KidsHome />;
  else if (route === "") page = <Home />;
  else if (route === "map") page = <MapPage />;
  else if (route === "start") page = <Start />;
  else if (route === "me") page = <Me />;
  else if (route.startsWith("lesson-")) page = <LessonPage id={route.slice(7)} />;
  else if (route.startsWith("practice-")) page = <Practice tool={route.slice(9)} />;
  else if (route.startsWith("path-")) page = <PathPlan id={route.slice(5)} />;
  else if (route.startsWith("challenge-q-") && !isChild(p.band)) page = <Challenge code={route.slice(12)} />;
  else if (route === "play-pip") page = <PipGame />;
  else if (route === "play-lights") page = <LightsGame />;
  else page = <Missing />;

  const nav: [string, string, ReactNode][] = little
    ? [
        ["", "Play", ICONS.home],
        ["who", "Grown-ups", ICONS.people],
      ]
    : [
        ["", "Home", ICONS.home],
        ["map", "Learn", ICONS.learn],
        ["practice-today", "Practice", ICONS.practice],
        ["me", "Progress", ICONS.progress],
      ];
  const active = (id: string) => route === id || (id === "" && route.startsWith("play-")) || (id === "map" && (route.startsWith("lesson-") || route === "start" || route.startsWith("path-"))) || (id.startsWith("practice") && route.startsWith("practice"));
  const Logo = (
    <button type="button" onClick={() => go("")} className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight" aria-label="PipPacket, home">
      <Pip className="w-9" happy />
      PipPacket
    </button>
  );
  const Theme = (
    <button type="button" onClick={() => actions.theme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="border-line bg-card grid size-9 shrink-0 place-items-center rounded-lg border text-sm">
      {dark ? "☀" : "☾"}
    </button>
  );
  const WhoBtn = band ? (
    <button type="button" onClick={() => go("who")} className="border-line bg-card hover:border-peri flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left">
      <span className={cn("text-on grid size-9 shrink-0 place-items-center rounded-lg text-xs font-extrabold", { pink: "bg-pink", aqua: "bg-aqua", sky: "bg-sky", lav: "bg-lav", peri: "bg-peri" }[band.color])}>{band.id === "adult" ? "18+" : band.id}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{band.name}</span>
        <span className="text-soft block text-xs">{little ? "Grown-ups: change" : "Change who's learning"}</span>
      </span>
    </button>
  ) : null;

  if (!p.band)
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="gutter mx-auto flex h-16 w-full max-w-4xl items-center justify-between">
          {Logo}
          {Theme}
        </header>
        <main className="grow">{page}</main>
      </div>
    );

  return (
    <div className="min-h-dvh lg:pl-60">
      {/* desktop: a fixed side menu */}
      <aside className="border-line bg-card fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r p-4 lg:flex">
        <div className="px-2 py-2">{Logo}</div>
        <nav className="mt-6 grid gap-1" aria-label="Main">
          {nav.map(([id, name, ic]) => (
            <button key={id} type="button" onClick={() => go(id)} aria-current={active(id) ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold", active(id) ? "bg-tint text-main" : "text-soft hover:bg-tint hover:text-ink")}>
              {ic} {name}
            </button>
          ))}
        </nav>
        <div className="mt-auto grid gap-3">
          {WhoBtn}
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={() => go("about")} className="text-soft hover:text-ink text-sm font-semibold">
              How it works
            </button>
            {Theme}
          </div>
        </div>
      </aside>

      {/* phone: a top bar and a bottom tab bar */}
      <header className="border-line bg-paper/90 sticky z-20 border-b backdrop-blur lg:hidden" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="gutter flex h-14 items-center justify-between gap-2">
          {Logo}
          <div className="flex items-center gap-2">
            {band ? (
              <button type="button" onClick={() => go("who")} className="bg-tint rounded-full px-3 py-1.5 text-xs font-bold">
                {band.id === "adult" ? "Adult" : "Ages " + band.id}
              </button>
            ) : null}
            {Theme}
          </div>
        </div>
      </header>

      <main key={route} className="pb-24 lg:pb-10">
        {page}
        {!little ? (
          <p className="gutter text-soft mx-auto max-w-5xl pt-6 text-xs">
            PipPacket. A free study aid, not affiliated with Cisco.{" "}
            <button type="button" onClick={() => go("about")} className="underline underline-offset-4 lg:hidden">
              How it works
            </button>
          </p>
        ) : null}
      </main>

      <nav className="border-line bg-card fixed inset-x-0 bottom-0 z-20 border-t lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} aria-label="Main">
        <div className="gutter mx-auto flex max-w-md justify-around">
          {nav.map(([id, name, ic]) => (
            <button key={id} type="button" onClick={() => go(id)} aria-current={active(id) ? "page" : undefined} className={cn("flex min-w-16 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold", active(id) ? "text-main" : "text-soft")}>
              {ic} {name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
