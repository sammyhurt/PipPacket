import type { ButtonHTMLAttributes, ReactNode } from "react";

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
          <code key={i} className="bg-tint rounded-md px-1.5 py-0.5 font-mono text-[0.88em] break-words">
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

const tones = {
  net: "bg-main text-main-ink",
  sun: "bg-sun text-[#471f28]",
  ai: "bg-ai text-ai-ink",
  plain: "bg-card text-ink",
  ink: "bg-ink text-paper",
};
export function Btn({ tone = "net", size = "md", className, ...rest }: { tone?: keyof typeof tones; size?: "sm" | "md" | "lg" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn("press border-edge inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold shadow-[4px_4px_0_var(--drop)] disabled:opacity-50", size === "sm" ? "h-9 px-4 text-sm" : size === "lg" ? "h-14 px-7 text-lg" : "h-11 px-5 text-[15px]", tones[tone], className)}
    />
  );
}
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("border-edge inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase", className)}>{children}</span>;
}
export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("border-edge bg-card h-3.5 overflow-hidden rounded-full border-2", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="bg-main h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
export const Check = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Arrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
