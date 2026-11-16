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
          <code key={i} className="bg-tint font-code rounded-md px-1.5 py-0.5 text-[0.86em] break-words">
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

/** The small label above a headline. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-main text-[13px] font-bold tracking-wide", className)}>{children}</p>;
}
export function Display({ children, as: T = "h2", className }: { children: string; as?: "h1" | "h2" | "h3"; className?: string }) {
  return <T className={cn("text-[clamp(1.75rem,4vw,2.5rem)]", className)}>{children}</T>;
}
export function Title({ eyebrow, children, as, size, className }: { eyebrow?: string; children: string; as?: "h1" | "h2"; size?: string; className?: string }) {
  return (
    <div className={className}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Display as={as} className={cn(eyebrow && "mt-1.5", size)}>
        {children}
      </Display>
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
      { rootMargin: "0px 0px -40px 0px" },
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
  net: "bg-main text-main-ink shadow-[0_8px_18px_-10px_var(--main)] hover:brightness-110",
  sun: "bg-pink text-on hover:brightness-105",
  ai: "bg-lav text-on",
  plain: "border border-line bg-card text-ink hover:border-peri",
  ink: "bg-ink text-paper hover:opacity-90",
};
export function Btn({ tone = "net", size = "md", className, ...rest }: { tone?: keyof typeof tones; size?: "sm" | "md" | "lg" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl text-center font-semibold transition-[filter,border-color,opacity] duration-200 disabled:opacity-50", size === "sm" ? "min-h-9 px-3.5 py-1.5 text-sm" : size === "lg" ? "min-h-13 px-6 py-3 text-base" : "min-h-11 px-5 py-2.5 text-[15px]", tones[tone], className)}
    />
  );
}
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("bg-tint inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>{children}</span>;
}
export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("bg-tint h-2 overflow-hidden rounded-full", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="bg-main h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
export const Check = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Arrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Pip: a message with a face. The mascot, and the picture of what a packet is. Drawn here, in the palette. */
export const Pip = ({ className, happy }: { className?: string; happy?: boolean }) => (
  <svg viewBox="0 0 80 64" className={className} aria-hidden>
    <rect x="4" y="8" width="72" height="50" rx="10" fill="var(--pink)" stroke="var(--on)" strokeWidth="3" />
    <path d="M6 14l34 24 34-24" fill="none" stroke="var(--on)" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="29" cy="40" r="3.5" fill="var(--on)" />
    <circle cx="51" cy="40" r="3.5" fill="var(--on)" />
    <path d={happy ? "M31 47q9 9 18 0" : "M33 49q7 4 14 0"} fill="none" stroke="var(--on)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
