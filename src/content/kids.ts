import type { Band } from "@/app/store";

import type { Source } from "./types";

/** How each age learns here, and where that approach comes from. */
export interface BandInfo {
  id: Exclude<Band, "">;
  name: string;
  short: string; // on the "Who's learning?" card
  how: string[]; // the learning approach
  what: string; // what they learn
  color: "pink" | "aqua" | "sky" | "lav" | "peri";
}
export const bands: BandInfo[] = [
  { id: "5-7", name: "Ages 5 to 7", short: "Listen, tap and play", color: "pink", how: ["Everything is read aloud, so no reading is needed", "Tap and drag games, about two minutes each", "One idea at a time, shown with pictures and a story", "A grown-up nearby helps, but isn't required"], what: "What a message is, how it travels, patterns of on and off, and staying safe." },
  { id: "8-10", name: "Ages 8 to 10", short: "Puzzles and building", color: "aqua", how: ["Short sentences, with the option to hear them", "Puzzles that get a little harder each round", "Build and experiment before any explanation", "Badges for finishing, never for speed"], what: "How computers count with on and off, how data is cut into packets, and what the devices at home do." },
  { id: "11-13", name: "Ages 11 to 13", short: "Real terms, guided challenges", color: "sky", how: ["The real vocabulary, each word explained once", "Five-minute lessons with something to try in each", "A quiz that explains every answer", "Challenges and small projects are being built"], what: "Packets, addresses, the rules computers follow to talk, and how the internet is organised." },
  { id: "14-17", name: "Ages 14 to 17", short: "The full beginner path", color: "lav", how: ["The complete path from zero", "Hands-on trainers for binary and subnetting", "Flashcards that bring back what you miss", "Career context: what these jobs are"], what: "Everything up to the first professional certification." },
  { id: "adult", name: "Adult", short: "Career and certification", color: "peri", how: ["A placement quiz so you skip what you know", "Stops mapped to the official exam topics", "Spaced-repetition flashcards and mock quizzes", "Sources and a last-checked date on every lesson"], what: "CCNA, then cloud engineering and AI infrastructure." },
];
export const bandById = (id: string) => bands.find((b) => b.id === id);

export const teachingSources: Source[] = [
  { label: "CSTA K-12 Computer Science Standards: Networks & the Internet, by grade band", url: "https://ospi.k12.wa.us/sites/default/files/2022-12/cs-standardsnetworksinternet.pdf" },
  { label: "NAEYC: Principles of Child Development and Learning (Developmentally Appropriate Practice)", url: "https://www.naeyc.org/resources/position-statements/dap/principles" },
  { label: "FTC: Complying with COPPA, frequently asked questions", url: "https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions" },
];

export interface KidActivity {
  id: string;
  band: "5-7" | "8-10";
  title: string;
  blurb: string;
  minutes: number;
  ready: boolean;
  color: "pink" | "aqua" | "sky" | "lav";
  /** The school standard this activity works towards, in our words. */
  standard?: string;
}
export const kidActivities: KidActivity[] = [
  { id: "pip", band: "5-7", title: "Help Pip get there", blurb: "Pip is a message. Tap the helpers to send Pip to Grandma.", minutes: 2, ready: true, color: "pink", standard: "Builds towards CSTA 1B-NI-04: information travels through devices on a network to reach its destination." },
  { id: "safe", band: "5-7", title: "The secret word", blurb: "Why we keep passwords secret.", minutes: 2, ready: false, color: "aqua" },
  { id: "onoff", band: "5-7", title: "On and off", blurb: "Make patterns with lights.", minutes: 2, ready: false, color: "lav" },
  { id: "lights", band: "8-10", title: "Light-switch numbers", blurb: "Computers count with on and off. Crack the code with four lights.", minutes: 4, ready: true, color: "aqua", standard: "Builds towards CSTA 1B-NI-04 and the K-5 idea that computers store everything as on and off." },
  { id: "packets", band: "8-10", title: "Packet puzzle", blurb: "Cut a picture into packets and put it back together.", minutes: 4, ready: false, color: "pink" },
  { id: "home", band: "8-10", title: "Build a home network", blurb: "Connect the devices so everyone gets Wi-Fi.", minutes: 5, ready: false, color: "sky" },
];
