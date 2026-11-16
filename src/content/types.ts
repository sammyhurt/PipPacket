/** One piece of a lesson. Text may use **bold** and `code`. */
export type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "analogy"; text: string } // "think of it like…"
  | { t: "list"; items: string[] }
  | { t: "steps"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "code"; label?: string; text: string }
  | { t: "tip"; text: string }
  | { t: "watch"; text: string } // a common mistake
  | { t: "stack"; title: string; rows: [string, string][]; note?: string } // a layered diagram, top to bottom
  | { t: "try"; widget: "order"; prompt: string; items: string[] } // items are given in the right order
  | { t: "try"; widget: "binary" | "subnet" };

export interface Question {
  q: string;
  options: string[];
  answer: number; // index of the right option
  why: string;
}
export interface Source {
  label: string;
  url: string;
}
export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  hook: string; // one line: what you can do after this stop
  objective?: string; // the official exam topic it serves, in our words
  blocks: Block[];
  quiz: Question[];
  cards: [string, string][]; // flashcards: front, back
  sources: Source[];
  checked: string; // when the facts were last checked against the sources
}
export interface Stage {
  id: string;
  level: string; // "Level 0", "Beginner", "CCNA"…
  title: string;
  blurb: string;
  lessons: Lesson[];
  planned?: string[]; // stops not written yet, shown on the map as "coming"
}
