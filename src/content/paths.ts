import { ccna1, ccnaPlanned } from "./ccna1";
import type { Lesson, Question, Stage } from "./types";
import { zero } from "./zero";

export interface Path {
  id: "net" | "cloud" | "ai";
  name: string;
  goal: string;
  color: "net" | "cloud" | "ai";
  stages: Stage[];
  outline?: string[]; // for paths not built yet: what they will cover
}

export const paths: Path[] = [
  { id: "net", name: "Networking", goal: "From “what is a network?” to CCNA, then CCNP.", color: "net", stages: [zero, ccna1, ...ccnaPlanned] },
  { id: "cloud", name: "Cloud Engineer", goal: "From “what is the cloud?” to running real systems on AWS.", color: "cloud", stages: [], outline: ["What the cloud is and how you pay for it", "Servers, storage and databases on AWS", "Cloud networking: VPCs, subnets and gateways", "Identity, access and security", "Infrastructure as code", "Containers and Kubernetes", "Monitoring, cost and reliability"] },
  { id: "ai", name: "AI Infrastructure", goal: "The computers, networks and storage behind AI systems.", color: "ai", stages: [], outline: ["What AI workloads need from hardware", "GPUs and accelerated servers", "High-speed data center networks", "Storage for training data", "Clusters and scheduling", "Running models in production", "Power, cooling and cost"] },
];

export const net = paths[0];
export const allLessons: Lesson[] = net.stages.flatMap((s) => s.lessons);
export const lessonById = (id: string) => allLessons.find((l) => l.id === id);
export const stageOf = (id: string) => net.stages.find((s) => s.lessons.some((l) => l.id === id));
export const allCards = allLessons.flatMap((l) => l.cards.map(([front, back], i) => ({ key: `${l.id}:${i}`, lesson: l, front, back })));
export const allQuestions = allLessons.flatMap((l) => l.quiz.map((q) => ({ ...q, lesson: l })));

/** The placement quiz: a few questions from easy to hard. Where you start missing them is where you start. */
export const placement: (Question & { tier: 0 | 1 | 2 })[] = [
  { tier: 0, q: "Which device connects different networks and chooses the path between them?", options: ["Switch", "Router", "Access point", "I'm not sure yet"], answer: 1, why: "" },
  { tier: 0, q: "What is `192.168.1.25`?", options: ["A MAC address", "An IPv4 address", "A port number", "I'm not sure yet"], answer: 1, why: "" },
  { tier: 0, q: "Which is true of TCP but not UDP?", options: ["It resends lost data", "It uses ports", "It runs over IP", "I'm not sure yet"], answer: 0, why: "" },
  { tier: 1, q: "What is `11110000` in decimal?", options: ["224", "240", "248", "I'm not sure yet"], answer: 1, why: "" },
  { tier: 1, q: "A switch gets a frame for a MAC address it has never seen. What does it do?", options: ["Drops it", "Floods it out of the other ports in the VLAN", "Sends it to the router", "I'm not sure yet"], answer: 1, why: "" },
  { tier: 1, q: "At which OSI layer does a router make its decisions?", options: ["Layer 2", "Layer 3", "Layer 4", "I'm not sure yet"], answer: 1, why: "" },
  { tier: 2, q: "What is the broadcast address of 10.4.8.130/27?", options: ["10.4.8.159", "10.4.8.191", "10.4.8.255", "I'm not sure yet"], answer: 0, why: "" },
  { tier: 2, q: "Clients cannot get a DHCP address from a server on another subnet. What is usually missing on the gateway interface?", options: ["`ip helper-address`", "`ip nat inside`", "`switchport trunk`", "I'm not sure yet"], answer: 0, why: "" },
];
