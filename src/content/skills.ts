/**
 * The skill tree: eleven strands of knowledge, six levels of depth. One tree for every age.
 * A skill that has a lesson or activity behind it is "ready"; the rest are named so learners can see what is coming.
 * Certification skills (level 5, strands A to I) follow the CCNA 200-301 v2.0 topic list.
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;
export interface Strand {
  id: string;
  name: string;
  blurb: string;
  color: "pink" | "aqua" | "sky" | "lav" | "peri";
}
export interface Skill {
  id: string;
  strand: string;
  level: Level;
  title: string;
  lesson?: string; // the lesson that teaches it
  activity?: string; // or the kids' activity
  lab?: string; // or a lab mission that both teaches and tests it
  topic?: string; // the official exam topic or domain it serves
  after?: string[]; // skills worth doing first
}

export const levels: { n: Level; name: string; who: string }[] = [
  { n: 1, name: "Explorer", who: "Ages 5 to 7" },
  { n: 2, name: "Builder", who: "Ages 8 to 10" },
  { n: 3, name: "Investigator", who: "Ages 11 to 13" },
  { n: 4, name: "Foundations", who: "Ages 14 and up, adult beginners" },
  { n: 5, name: "Certified", who: "CCNA level" },
  { n: 6, name: "Professional", who: "CCNP and specialist roles" },
];
export const strands: Strand[] = [
  { id: "A", name: "Messages and packets", blurb: "How information gets from one place to another.", color: "pink" },
  { id: "B", name: "Addresses", blurb: "How every device is found.", color: "aqua" },
  { id: "C", name: "Devices and cabling", blurb: "The boxes and wires that make a network.", color: "sky" },
  { id: "D", name: "Switching", blurb: "Moving data inside one network.", color: "lav" },
  { id: "E", name: "Routing", blurb: "Finding the path between networks.", color: "peri" },
  { id: "F", name: "Network services", blurb: "The helpers every network relies on.", color: "pink" },
  { id: "G", name: "Wireless", blurb: "Networks through the air.", color: "aqua" },
  { id: "H", name: "Security", blurb: "Keeping people and information safe.", color: "sky" },
  { id: "I", name: "Operations and automation", blurb: "Running, fixing and automating networks.", color: "lav" },
  { id: "J", name: "Cloud", blurb: "Computers and networks you rent.", color: "peri" },
  { id: "K", name: "AI infrastructure", blurb: "What AI systems run on.", color: "pink" },
];

type Row = string | [title: string, extra: Partial<Skill>];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
/** One strand's skills, level by level. */
function strand(id: string, byLevel: Row[][]): Skill[] {
  return byLevel.flatMap((rows, i) =>
    rows.map((r) => {
      const [title, extra] = typeof r === "string" ? [r, {}] : r;
      return { id: `${id}${i + 1}-${slug(title)}`, strand: id, level: (i + 1) as Level, title, ...extra };
    }),
  );
}
const D1 = "CCNA 2.0 · Domain 1";
const D3 = "CCNA 2.0 · Domain 3";
const D4 = "CCNA 2.0 · Domain 4";
const D5 = "CCNA 2.0 · Domain 5";

export const skills: Skill[] = [
  ...strand("A", [
    [["Messages hop from helper to helper", { activity: "pip" }], "Taking turns to talk"],
    ["Big things are cut into pieces", "Pieces can arrive out of order"],
    ["What a packet carries", "The rules computers follow to talk", "Following a message across the internet"],
    [["What a network is", { lesson: "what-is-a-network" }], ["Packets and layers", { lesson: "how-data-travels" }], ["TCP, UDP and ports", { lesson: "tcp-udp" }]],
    [["Reading a packet capture", { topic: "CCNA 2.0 · 2.4" }], "Tracing a flow end to end"],
    ["Quality of service basics", "Diagnosing a slow application"],
  ]),
  ...strand("B", [
    ["Every house needs an address", "Patterns of on and off"],
    [["Counting with on and off", { activity: "lights" }], "Names and numbers for devices"],
    ["What an IP address is", "Public and private addresses", "Binary up to 255"],
    [["IP and MAC addresses", { lesson: "addresses" }], ["Binary", { lesson: "binary" }], "Subnet masks in plain terms"],
    [["IPv4 addressing and subnetting", { lesson: "ipv4-subnetting", topic: "CCNA 2.0 · 1.3", after: ["Binary", "IP and MAC addresses"] }], ["IPv6 addresses and prefixes", { lesson: "ipv6", topic: "CCNA 2.0 · 1.4", after: ["IP and MAC addresses"] }], "Planning addresses for a whole site"],
    ["Summarisation and address design", "Moving a network to IPv6"],
  ]),
  ...strand("C", [
    ["The boxes that bring the internet home"],
    ["What the router, switch and Wi-Fi box do", "Cables and plugs"],
    ["Inside a home network", "Copper, fiber and wireless links"],
    [["Meet the devices", { lesson: "meet-the-devices" }], "Network shapes", "Cable types and where each is used"],
    [["Cable and interface problems", { lesson: "cable-issues", topic: "CCNA 2.0 · 1.1" }], ["Hypervisors, virtual machines and containers", { lesson: "virtualization", topic: "CCNA 2.0 · 1.2" }], ["Power over Ethernet", { topic: D1 }]],
    ["Campus design: tiers and spine-leaf", "Choosing hardware for a site"],
  ]),
  ...strand("D", [
    ["Passing a note along the row"],
    ["Sorting messages to the right desk"],
    ["How a switch knows where devices are", "Why networks are split into groups"],
    [["How a switch learns", { lesson: "how-a-switch-learns" }], ["What a VLAN is", { lab: "two-departments" }], "Broadcasts and why they matter"],
    [
      ["VLANs and access ports", { topic: "CCNA 2.0 · 2.1", lesson: "vlans", lab: "two-departments", after: ["How a switch learns"] }],
      ["Trunks", { topic: "CCNA 2.0 · 2.1", lesson: "trunks", lab: "wire-the-school", after: ["VLANs and access ports"] }],
      ["EtherChannel", { topic: "CCNA 2.0 · 2.1", lesson: "etherchannel", after: ["Trunks"] }],
      ["SVIs and routing between VLANs", { topic: "CCNA 2.0 · 2.1", lesson: "svi", lab: "departments-talk", after: ["VLANs and access ports"] }],
      ["Edge ports for PCs, phones and access points", { topic: "CCNA 2.0 · 2.2", lesson: "edge-ports", after: ["VLANs and access ports"] }],
      ["CDP and LLDP", { topic: "CCNA 2.0 · 2.3", lesson: "cdp-lldp" }],
      ["Rapid PVST+ spanning tree", { topic: "CCNA 2.0 · 2.5", lesson: "rapid-pvst", after: ["Trunks"] }],
    ],
    ["Spanning tree tuning and protection", "Troubleshooting layer 2 loops"],
  ]),
  ...strand("E", [
    ["Finding another way when a road is closed"],
    ["Choosing the shortest path"],
    ["What a router decides", "The default gateway"],
    ["Reading a simple routing table", "How routers learn routes"],
    [
      ["Interpreting the routing table", { topic: D3 }],
      ["IPv4 and IPv6 static routes", { topic: D3, after: ["Interpreting the routing table"] }],
      ["Single-area OSPFv2", { topic: D3, after: ["IPv4 and IPv6 static routes"] }],
      ["OSPFv3", { topic: D3, after: ["Single-area OSPFv2"] }],
      ["HSRP and VRRP", { topic: D3 }],
    ],
    ["Multi-area OSPF", "BGP fundamentals", "Route redistribution and filtering"],
  ]),
  ...strand("F", [
    ["Asking for directions: names and places"],
    ["How a device gets its address"],
    ["DNS: the internet's phone book", "DHCP: addresses handed out automatically"],
    ["What happens when you open a website", "NAT in plain terms"],
    [["DHCP: client, server and relay", { lesson: "dhcp", topic: "CCNA 2.0 · 1.7", after: ["IP and MAC addresses"] }], ["DNS record types", { topic: D4 }], ["NAT and PAT", { topic: D4 }], ["Managing files with SFTP and SCP", { topic: D4 }]],
    ["Designing resilient DNS and DHCP"],
  ]),
  ...strand("G", [
    ["Signals through the air"],
    ["Why walls and distance matter"],
    ["Wi-Fi names and passwords", "Bands and channels"],
    ["How devices join Wi-Fi", "Wi-Fi security types"],
    [["Wireless principles", { lesson: "wireless", topic: "CCNA 2.0 · 1.5" }], ["Access points and controllers", { topic: D1 }]],
    ["Wireless site design", "Roaming and capacity planning"],
  ]),
  ...strand("H", [
    ["Secret words and why we keep them", "Ask a grown-up first"],
    ["Making a strong password", "Spotting a trick message"],
    ["Phishing and scams", "What a firewall decides", "Keeping personal information private"],
    ["Threats, vulnerabilities and risk", "Encryption in plain terms"],
    [["Local users and AAA with TACACS+ and RADIUS", { topic: D4 }], ["IPv4 access lists", { topic: D4 }], ["Layer 2 security features", { topic: D4 }], ["IPsec VPNs", { topic: D4 }]],
    ["Zero trust and segmentation", "Securing network management"],
  ]),
  ...strand("I", [
    ["Doing steps in order", "Spotting what is broken"],
    ["Giving exact instructions", "Test, then fix"],
    ["A troubleshooting method", "Reading error messages"],
    [["The command line: first steps", { lab: "fix-the-port" }], "Ping and traceroute"],
    [
      ["Getting a client online: Windows, macOS and Linux", { lesson: "client-connectivity", topic: "CCNA 2.0 · 1.6" }],
      ["Troubleshooting with show, ping, traceroute and capture", { topic: "CCNA 2.0 · 2.4", lesson: "l2-troubleshooting" }],
      ["Ways to manage a network", { topic: D5 }],
      ["SNMP", { topic: D5 }],
      ["Syslog messages", { topic: D5 }],
      ["Ansible for network changes", { topic: D5 }],
      ["Agentic AI in network operations", { topic: D5 }],
      ["Writing AI prompts for network work", { topic: D5 }],
    ],
    ["Network monitoring and telemetry", "Automating with Python and APIs"],
  ]),
  ...strand("J", [
    ["Computers that live somewhere else"],
    ["Where your photos and games are kept"],
    ["What the cloud is", "Why companies rent computers"],
    ["Cloud service models", "Regions and availability"],
    ["Virtual networks on AWS", "Compute and storage basics", "Identity and access"],
    ["Infrastructure as code", "Containers and Kubernetes", "Hybrid connectivity: VPN and direct links"],
  ]),
  ...strand("K", [
    ["Teaching a computer with examples"],
    ["Why computers need lots of examples"],
    ["What an AI model is", "Chips that do many sums at once"],
    ["What training a model needs: data, chips, power", "Training a model versus using one"],
    ["GPU servers and clusters", "High-speed data center networks", "Storage for training data"],
    ["Scheduling and running clusters", "Serving models in production", "Power, cooling and cost"],
  ]),
];

export const isReady = (s: Skill) => !!(s.lesson || s.activity || s.lab);
export const skillOfLesson = (lessonId: string) => skills.find((s) => s.lesson === lessonId);
export const skillOfActivity = (id: string) => skills.find((s) => s.activity === id);
export const skillByTitle = (title: string) => skills.find((s) => s.title === title);
