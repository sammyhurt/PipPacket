import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Lesson text with **bold** and `code`. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((s, i) =>
        s.startsWith("**") ? (
          <strong key={i} className="font-bold">
            {s.slice(2, -2)}
          </strong>
        ) : s.startsWith("`") ? (
          <code key={i} className="bg-tint font-code rounded-sm px-1.5 py-0.5 text-[0.86em] break-words">
            {s.slice(1, -1)}
          </code>
        ) : s.startsWith("*") && s.length > 2 ? (
          <em key={i}>{s.slice(1, -1)}</em>
        ) : (
          s
        ),
      )}
    </>
  );
}

/** The small wide-spaced label above a headline. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-label text-soft text-[11px] tracking-[0.28em] uppercase", className)}>{children}</p>;
}
/** The headline style from thebrices.co: a script first letter, then Playfair capitals. */
export function Display({ children, as: T = "h2", className }: { children: string; as?: "h1" | "h2" | "h3"; className?: string }) {
  return (
    <T className={cn("text-[clamp(2rem,5vw,3.6rem)] leading-[1.15] tracking-[0.02em] uppercase", className)}>
      <span className="font-script relative inline-block pr-[0.2em] align-[-0.2em] text-[2.1em] leading-[0] tracking-normal normal-case">{children.charAt(0)}</span>
      <span>{children.slice(1)}</span>
    </T>
  );
}
/** Label, headline and the fine rule under it. */
export function Title({ eyebrow, children, as, size, className }: { eyebrow?: string; children: string; as?: "h1" | "h2"; size?: string; className?: string }) {
  return (
    <div className={className}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Display as={as} className={cn(eyebrow && "mt-4", size)}>
        {children}
      </Display>
      <div className="bg-ink/20 mt-6 h-px w-full max-w-md" />
    </div>
  );
}
/** Fade and rise into view on scroll. Anything already on screen when the page opens simply shows. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add("rise");
    el.style.transitionDelay = `${delay}s`;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const tones = {
  net: "bg-main text-main-ink shadow-[0_12px_24px_-14px_var(--drop)] hover:brightness-110",
  sun: "bg-sun text-[#471f28] hover:brightness-105",
  ai: "bg-ai text-ai-ink",
  plain: "border border-edge text-ink hover:bg-tint",
  ink: "bg-ink text-paper hover:opacity-90",
};
export function Btn({ tone = "net", size = "md", className, ...rest }: { tone?: keyof typeof tones; size?: "sm" | "md" | "lg" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn("font-label inline-flex items-center justify-center gap-2.5 rounded-full text-center tracking-[0.2em] uppercase transition-[filter,background-color,opacity] duration-300 disabled:opacity-50", size === "sm" ? "min-h-9 px-4 py-2 text-[10px]" : size === "lg" ? "min-h-13 px-7 py-3.5 text-[12px]" : "min-h-11 px-5 py-2.5 text-[11px]", tones[tone], className)}
    />
  );
}
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("border-edge font-label inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] tracking-[0.2em] uppercase", className)}>{children}</span>;
}
export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("bg-ink/12 h-1.5 overflow-hidden rounded-full", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="bg-main h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
export const Check = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Arrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
