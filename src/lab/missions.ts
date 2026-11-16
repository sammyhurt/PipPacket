/**
 * Lab missions. Each starts from a prepared network and is finished when the network itself passes every check:
 * the checks send real test messages through the engine, so any correct configuration counts.
 */
import { canReach, ifOf, makeDevice, maskBits, peer, sameNet, type Device, type Kind, type Net } from "./engine";

export interface Goal {
  text: string;
  test(net: Net): { ok: boolean; why?: string };
}
export interface Mission {
  id: string;
  title: string;
  minutes: number;
  story: string;
  know: string[]; // what you need to know, in a few lines; **bold** and `code` allowed
  commands?: string[]; // a crib of the commands this mission uses
  hints: string[];
  start(): Net;
  goals: Goal[];
  skills: string[]; // titles of the skills this is evidence for
  done: string; // what to take away
}

const G = (n: number) => `GigabitEthernet0/${n}`;
function build(parts: [Kind, string, number, number, { ip?: string; mask?: string; gw?: string }?][], cables: [string, string, string, string][], tweak?: (by: Record<string, Device>) => void): Net {
  const net: Net = { devices: [], links: [] };
  const by: Record<string, Device> = {};
  parts.forEach(([kind, name, x, y, o], n) => {
    const d = makeDevice(kind, `d${n + 1}`, name, x, y);
    if (o?.ip) (d.ifaces[0].ip = o.ip), (d.ifaces[0].mask = o.mask || "255.255.255.0");
    if (o?.gw) d.gateway = o.gw;
    net.devices.push((by[name] = d));
  });
  for (const [a, ai, b, bi] of cables) net.links.push({ a: { d: by[a].id, i: ai }, b: { d: by[b].id, i: bi } });
  tweak?.(by);
  return net;
}
const named = (net: Net, name: string) => net.devices.find((d) => d.name === name);
const reach = (a: string, b: string): Goal => ({
  text: `${a} can ping ${b}`,
  test: (net) => {
    const r = canReach(net, a, b);
    return { ok: r.ok, why: r.why };
  },
});
const apart = (a: string, b: string, text: string): Goal => ({
  text,
  test: (net) => {
    const r = canReach(net, a, b);
    return r.ok ? { ok: false, why: `${a} can still reach ${b}.` } : { ok: true };
  },
});
/** A switch port is an access port in this VLAN. */
const access = (sw: string, ports: number[], vlan: number, text: string): Goal => ({
  text,
  test: (net) => {
    const d = named(net, sw);
    if (!d) return { ok: false, why: `${sw} is missing.` };
    const bad = ports.find((n) => { const i = ifOf(d, G(n))!; return i.mode !== "access" || i.vlan !== vlan; });
    return bad ? { ok: false, why: `Gi0/${bad} on ${d.name} is not an access port in VLAN ${vlan}.` } : { ok: true };
  },
});
const trunk = (a: string, b: string, port: number): Goal => ({
  text: `Gi0/${port} is a trunk on both ${a} and ${b}`,
  test: (net) => {
    for (const n of [a, b]) {
      const d = named(net, n);
      if (!d || ifOf(d, G(port))!.mode !== "trunk") return { ok: false, why: `Gi0/${port} on ${n} is still an access port.` };
    }
    return { ok: true };
  },
});

export const missions: Mission[] = [
  {
    id: "first-link",
    title: "First link",
    minutes: 5,
    story: "Two new PCs and a switch have just come out of their boxes. Nothing is connected and nothing has an address. Get PC1 and PC2 talking.",
    know: ["A **switch** connects devices in the same local network. Each PC needs a cable to it.", "Each PC needs an **IP address** and a **subnet mask**. Two devices can talk directly only when the mask puts them on the same network.", "With the mask `255.255.255.0`, the first three numbers are the network. `192.168.1.10` and `192.168.1.20` are neighbours."],
    hints: ["Press **Cable**, then click PC1 and then S1. Do the same for PC2.", "Click a PC to open its settings. Try `192.168.1.10` and `192.168.1.20`, both with mask `255.255.255.0`.", "Use **Send a test message** in the PC's panel. If it fails, the lab tells you why."],
    start: () => build([["switch", "S1", 400, 120], ["pc", "PC1", 170, 310], ["pc", "PC2", 630, 310]], []),
    goals: [
      {
        text: "PC1 and PC2 are both cabled to S1",
        test: (net) => {
          const miss = ["PC1", "PC2"].find((n) => { const d = named(net, n); return !d || peer(net, d.id, "Eth0")?.d.name !== "S1"; });
          return miss ? { ok: false, why: `${miss} is not cabled to S1 yet.` } : { ok: true };
        },
      },
      {
        text: "Both PCs have an address on the same network",
        test: (net) => {
          const [a, b] = ["PC1", "PC2"].map((n) => named(net, n)?.ifaces[0]);
          if (!a?.ip || !b?.ip) return { ok: false, why: `${!a?.ip ? "PC1" : "PC2"} has no IP address yet.` };
          if (maskBits(a.mask) === null || maskBits(b.mask) === null) return { ok: false, why: "One of the subnet masks is not valid." };
          if (a.ip === b.ip) return { ok: false, why: "Both PCs have the same address. Each device needs its own." };
          return sameNet(a.ip, b.ip, a.mask) && sameNet(a.ip, b.ip, b.mask) ? { ok: true } : { ok: false, why: "The two addresses are on different networks." };
        },
      },
      reach("PC1", "PC2"),
    ],
    skills: ["IP and MAC addresses"],
    done: "A cable, an address and a matching mask are all two devices need to talk on one network.",
  },
  {
    id: "fix-the-port",
    title: "Fix the port",
    minutes: 8,
    story: "Monday morning. Three people on the same floor say they can't reach each other. There are three separate faults. Find and fix each one.",
    know: ["Work from the symptom: send a test message and read why it failed.", "A switch port can be **shut down** in its configuration. It shows as `disabled` or `administratively down`, and `no shutdown` brings it back.", "To configure a switch you go through its modes: `enable`, then `configure terminal`, then `interface gi0/2`.", "A device with an address on the **wrong network** cannot talk to its neighbours, even with a perfect cable."],
    commands: ["enable", "show interfaces status", "show ip interface brief", "configure terminal", "interface gi0/2", "no shutdown", "end"],
    hints: ["Send a test message from PC1 to each of the others and read the reason.", "On S1, `show interfaces status` lists every port. Look for one that says `disabled`.", "Compare the three PCs' addresses. Which one does not start with 192.168.1?", "PC3 has no cable at all."],
    start: () =>
      build(
        [["switch", "S1", 400, 110], ["pc", "PC1", 140, 310, { ip: "192.168.1.10" }], ["pc", "PC2", 400, 330, { ip: "192.168.2.20" }], ["pc", "PC3", 660, 310, { ip: "192.168.1.30" }]],
        [["PC1", "Eth0", "S1", G(1)], ["PC2", "Eth0", "S1", G(2)]],
        (by) => (ifOf(by.S1, G(2))!.shut = true),
      ),
    goals: [reach("PC1", "PC2"), reach("PC1", "PC3"), reach("PC2", "PC3")],
    skills: ["Cable and interface problems", "The command line: first steps"],
    done: "Three different faults produced the same complaint. Checking the cable, the port and the address in turn finds each one.",
  },
  {
    id: "two-departments",
    title: "Two departments",
    minutes: 10,
    story: "Sales and Engineering share one switch, and right now everyone can see everyone. Put each department in its own VLAN so they are kept apart.",
    know: ["A **VLAN** splits one switch into separate networks. Devices in different VLANs cannot talk directly, as if they were on different switches.", "Every port starts in VLAN 1. An **access port** belongs to exactly one VLAN.", "Create the VLAN, then put ports into it.", "In real networks each VLAN also gets its own IP network. Here everyone keeps one network so you can see the VLANs alone doing the separating."],
    commands: ["enable", "configure terminal", "vlan 10", "name Sales", "exit", "interface gi0/1", "switchport mode access", "switchport access vlan 10", "end", "show vlan brief"],
    hints: ["Before changing anything, send a test message from PC1 to PC3. It works. That is the problem.", "Sales is PC1 and PC2 on Gi0/1 and Gi0/2. Engineering is PC3 and PC4 on Gi0/3 and Gi0/4.", "After `vlan 10` and `name Sales`, go into each port: `interface gi0/1`, then `switchport mode access` and `switchport access vlan 10`.", "`show vlan brief` shows which ports are in which VLAN."],
    start: () =>
      build(
        [["switch", "S1", 400, 100], ["pc", "PC1", 110, 300, { ip: "192.168.1.11" }], ["pc", "PC2", 300, 330, { ip: "192.168.1.12" }], ["pc", "PC3", 500, 330, { ip: "192.168.1.13" }], ["pc", "PC4", 690, 300, { ip: "192.168.1.14" }]],
        [["PC1", "Eth0", "S1", G(1)], ["PC2", "Eth0", "S1", G(2)], ["PC3", "Eth0", "S1", G(3)], ["PC4", "Eth0", "S1", G(4)]],
      ),
    goals: [
      {
        text: "VLAN 10 is named Sales and VLAN 20 is named Engineering",
        test: (net) => {
          const v = named(net, "S1")?.vlans || {};
          if (!v[10] || !v[20]) return { ok: false, why: `VLAN ${!v[10] ? 10 : 20} does not exist yet.` };
          return /^sales$/i.test(v[10]) && /^engineering$/i.test(v[20]) ? { ok: true } : { ok: false, why: `VLAN ${/^sales$/i.test(v[10]) ? "20 should be named Engineering" : "10 should be named Sales"}.` };
        },
      },
      access("S1", [1, 2], 10, "Gi0/1 and Gi0/2 are access ports in VLAN 10"),
      access("S1", [3, 4], 20, "Gi0/3 and Gi0/4 are access ports in VLAN 20"),
      reach("PC1", "PC2"),
      reach("PC3", "PC4"),
      apart("PC1", "PC3", "Sales can no longer reach Engineering"),
    ],
    skills: ["What a VLAN is", "VLANs and access ports"],
    done: "One switch now behaves like two. To let the departments talk again on purpose, you would add a router, which a later mission covers.",
  },
  {
    id: "wire-the-school",
    title: "Wire the school",
    minutes: 12,
    story: "A school has two buildings with a switch in each. Staff and students must be kept apart, but staff in one building need to reach staff in the other. One cable joins the buildings.",
    know: ["A VLAN can span several switches, but the link between them has to carry more than one VLAN.", "A **trunk** does that. It adds a tag to each frame saying which VLAN it belongs to, so the far switch can sort it.", "Both ends of the link must be trunks, and each switch must know the VLANs.", "By default a trunk carries every VLAN."],
    commands: ["vlan 10", "name Staff", "vlan 20", "name Students", "interface gi0/1", "switchport mode access", "switchport access vlan 10", "interface gi0/8", "switchport mode trunk", "show interfaces trunk"],
    hints: ["Staff1 and Staff2 are on Gi0/1 of each switch. Student1 and Student2 are on Gi0/2.", "Do the same VLAN and access-port work on both S1 and S2.", "The buildings are joined on Gi0/8. Set it to `switchport mode trunk` on both switches.", "If Staff1 cannot reach Staff2, send a test message and read the reason. `show interfaces trunk` shows what the link carries."],
    start: () =>
      build(
        [["switch", "S1", 230, 110], ["switch", "S2", 570, 110], ["pc", "Staff1", 90, 300, { ip: "192.168.10.11" }], ["pc", "Student1", 300, 330, { ip: "192.168.20.11" }], ["pc", "Staff2", 500, 330, { ip: "192.168.10.12" }], ["pc", "Student2", 710, 300, { ip: "192.168.20.12" }]],
        [["Staff1", "Eth0", "S1", G(1)], ["Student1", "Eth0", "S1", G(2)], ["Staff2", "Eth0", "S2", G(1)], ["Student2", "Eth0", "S2", G(2)], ["S1", G(8), "S2", G(8)]],
      ),
    goals: [
      access("S1", [1], 10, "Staff ports (Gi0/1) are in VLAN 10 on both switches"),
      access("S2", [1], 10, "…and on S2"),
      access("S1", [2], 20, "Student ports (Gi0/2) are in VLAN 20 on both switches"),
      access("S2", [2], 20, "…and on S2"),
      trunk("S1", "S2", 8),
      reach("Staff1", "Staff2"),
      reach("Student1", "Student2"),
      apart("Staff1", "Student1", "Students cannot reach staff"),
    ],
    skills: ["VLANs and access ports", "Trunks"],
    done: "The same two VLANs now run across both buildings over a single cable. That is what a trunk is for.",
  },
  {
    id: "departments-talk",
    title: "Let the departments talk",
    minutes: 12,
    story: "Sales and Engineering now sit in separate VLANs, each with its own IP network. They need to reach each other after all, in a controlled way. Turn the switch into their router.",
    know: ["Devices in different VLANs are on different networks, so they need a **router** between them.", "A multilayer switch can do the routing itself. You give it an address in each VLAN with a **switch virtual interface** (SVI): `interface vlan 10`.", "That address is the **default gateway** for every PC in the VLAN.", "The switch only routes between its VLANs once `ip routing` is turned on."],
    commands: ["configure terminal", "ip routing", "interface vlan 10", "ip address 192.168.10.1 255.255.255.0", "no shutdown", "interface vlan 20", "ip address 192.168.20.1 255.255.255.0", "no shutdown", "end", "show ip interface brief"],
    hints: ["The VLANs and access ports are already set up. Check with `show vlan brief`.", "Give the switch 192.168.10.1 in VLAN 10 and 192.168.20.1 in VLAN 20.", "Each PC needs a default gateway: the switch's address in its own VLAN. PC1 and PC2 use 192.168.10.1. PC3 and PC4 use 192.168.20.1.", "If a PC can ping its gateway but not the other department, look for `ip routing` in `show running-config`."],
    start: () =>
      build(
        [["switch", "S1", 400, 100], ["pc", "PC1", 110, 300, { ip: "192.168.10.11" }], ["pc", "PC2", 300, 330, { ip: "192.168.10.12" }], ["pc", "PC3", 500, 330, { ip: "192.168.20.13" }], ["pc", "PC4", 690, 300, { ip: "192.168.20.14" }]],
        [["PC1", "Eth0", "S1", G(1)], ["PC2", "Eth0", "S1", G(2)], ["PC3", "Eth0", "S1", G(3)], ["PC4", "Eth0", "S1", G(4)]],
        (by) => {
          by.S1.vlans = { 1: "default", 10: "Sales", 20: "Engineering" };
          [1, 2].forEach((n) => (ifOf(by.S1, G(n))!.vlan = 10));
          [3, 4].forEach((n) => (ifOf(by.S1, G(n))!.vlan = 20));
        },
      ),
    goals: [
      {
        text: "S1 has an address in VLAN 10 and in VLAN 20",
        test: (net) => {
          const d = named(net, "S1");
          const miss = [10, 20].find((v) => !d?.svis[v]?.ip || d.svis[v].shut);
          return miss ? { ok: false, why: `interface vlan ${miss} has no address yet, or is shut down.` } : { ok: true };
        },
      },
      reach("PC1", "S1"),
      reach("PC1", "PC3"),
      reach("PC2", "PC4"),
      reach("PC4", "PC1"),
    ],
    skills: ["SVIs and routing between VLANs"],
    done: "The switch is now the gateway for both departments. Because all traffic between them passes through it, this is also where you would later add rules about who may talk to whom.",
  },
];
export const missionById = (id: string) => missions.find((m) => m.id === id);
