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
      <header className="border-edge bg-paper/90 sticky top-0 z-20 border-b-2 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="gutter mx-auto flex h-14 max-w-5xl items-center gap-2 sm:gap-4">
          <button type="button" onClick={() => go("")} className="font-display flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="border-edge bg-main text-main-ink grid size-8 place-items-center rounded-lg border-2 font-mono text-sm">h</span>
            <span className="hidden min-[480px]:inline">hopcount</span>
          </button>
          <nav className="ml-auto flex items-center gap-0.5 sm:gap-1" aria-label="Main">
            {NAV.map(([id, name]) => (
              <button key={id} type="button" onClick={() => go(id)} aria-current={active(id) ? "page" : undefined} className={cn("rounded-full px-2.5 py-1.5 text-sm font-bold sm:px-3", active(id) ? "bg-ink text-paper" : "hover:bg-tint")}>
                {name}
              </button>
            ))}
          </nav>
          <span className="border-edge bg-sun hidden items-center gap-1 rounded-full border-2 px-2.5 py-0.5 font-mono text-xs font-bold text-[#471f28] sm:inline-flex" title="Experience points and day streak">
            {p.xp} XP{streak(p) > 1 ? ` · ${streak(p)}d` : ""}
          </span>
          <button type="button" onClick={() => actions.theme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="border-edge bg-card grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm">
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>
      <main className="grow" key={route}>
        {page}
      </main>
      <footer className="border-line border-t-2">
        <div className="gutter text-soft mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 py-5 text-sm">
          <span>Hopcount (working name). A free study aid, not affiliated with Cisco.</span>
          <button type="button" onClick={() => go("about")} className="underline underline-offset-4">
            How this site works
          </button>
        </div>
      </footer>
    </div>
  );
}
