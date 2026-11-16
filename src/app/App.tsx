import { useEffect } from "react";

import { cn } from "@/lib/utils";

import { About, Home, LessonPage, MapPage, Me, Missing, PathPlan, Practice, Start } from "./pages";
import { go, useRoute } from "./router";
import { Challenge } from "./social";
import { actions, streak, useProgress } from "./store";

const NAV: [string, string][] = [
  ["map", "Map"],
  ["practice-cards", "Practice"],
  ["me", "Progress"],
];

export default function App() {
  const route = useRoute();
  const p = useProgress();
  // an explicit light/dark choice wins over the device setting; no choice follows the device
  useEffect(() => {
    if (p.theme) document.documentElement.dataset.theme = p.theme;
  }, [p.theme]);
  const dark = p.theme ? p.theme === "dark" : typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  const page =
    route === "" ? <Home /> : route === "map" ? <MapPage /> : route === "start" ? <Start /> : route === "me" ? <Me /> : route === "about" ? <About /> : route.startsWith("lesson-") ? <LessonPage id={route.slice(7)} /> : route.startsWith("practice-") ? <Practice tool={route.slice(9)} /> : route.startsWith("path-") ? <PathPlan id={route.slice(5)} /> : route.startsWith("challenge-q-") ? <Challenge code={route.slice(12)} /> : <Missing />;
  const active = (id: string) => route === id || (id === "map" && route.startsWith("lesson-")) || (id.startsWith("practice") && route.startsWith("practice"));
  return (
    <div className="flex min-h-dvh flex-col">
      {/* floating glass pills, as on thebrices.co */}
      <header className="pointer-events-none sticky z-20 pt-3" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="gutter mx-auto flex max-w-6xl items-center justify-between gap-2">
          <button type="button" onClick={() => go("")} aria-label="Hopcount, home" className="glass pointer-events-auto rounded-full px-4 py-2.5 text-[13px] tracking-[0.18em] whitespace-nowrap uppercase sm:px-5">
            <span className="min-[520px]:hidden">H</span>
            <span className="hidden min-[520px]:inline">Hopcount</span>
          </button>
          <nav className="glass font-label pointer-events-auto flex items-center gap-0.5 rounded-full p-1 text-[10px] tracking-[0.16em] uppercase sm:text-[11px] sm:tracking-[0.2em]" aria-label="Main">
            {NAV.map(([id, name]) => (
              <button key={id} type="button" onClick={() => go(id)} aria-current={active(id) ? "page" : undefined} className={cn("rounded-full px-3 py-2 transition-colors sm:px-4", active(id) ? "bg-ink text-paper" : "hover:bg-ink/8")}>
                {name}
              </button>
            ))}
          </nav>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="glass font-label hidden rounded-full px-3.5 py-2.5 text-[11px] tracking-[0.16em] uppercase md:inline" title="Experience points and day streak">
              {p.xp} XP{streak(p) > 1 ? ` · ${streak(p)} days` : ""}
            </span>
            <button type="button" onClick={() => actions.theme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="glass grid size-10 shrink-0 place-items-center rounded-full text-sm">
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>
      <main className={cn("grow", route !== "" && "read")} key={route}>
        {page}
      </main>
      <footer className="border-edge border-t">
        <div className="gutter font-label text-soft mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 py-7 text-sm">
          <span>Hopcount (working name). A free study aid, not affiliated with Cisco.</span>
          <button type="button" onClick={() => go("about")} className="underline underline-offset-4">
            How this site works
          </button>
        </div>
      </footer>
    </div>
  );
}
