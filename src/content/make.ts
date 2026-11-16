/** Short helpers so lesson files read like an outline. */
import type { Block, Question, Source } from "./types";

export const p = (text: string): Block => ({ t: "p", text });
export const h = (text: string): Block => ({ t: "h", text });
export const like = (text: string): Block => ({ t: "analogy", text });
export const list = (...items: string[]): Block => ({ t: "list", items });
export const steps = (...items: string[]): Block => ({ t: "steps", items });
export const table = (head: string[], ...rows: string[][]): Block => ({ t: "table", head, rows });
export const code = (text: string, label?: string): Block => ({ t: "code", text, label });
export const tip = (text: string): Block => ({ t: "tip", text });
export const watch = (text: string): Block => ({ t: "watch", text });
export const stack = (title: string, rows: [string, string][], note?: string): Block => ({ t: "stack", title, rows, note });
export const order = (prompt: string, ...items: string[]): Block => ({ t: "try", widget: "order", prompt, items });
export const q = (text: string, options: string[], answer: number, why: string): Question => ({ q: text, options, answer, why });

export const CHECKED = "2026-11-16";
export const SRC = {
  ccna2: { label: "Cisco: CCNA 200-301 v2.0 exam topics (official)", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" },
  ccna11: { label: "Cisco: CCNA 200-301 v1.1 exam topics (official)", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" },
  rfc: (n: number, what: string): Source => ({ label: `RFC ${n}: ${what}`, url: `https://www.rfc-editor.org/rfc/rfc${n}` }),
} as const;
