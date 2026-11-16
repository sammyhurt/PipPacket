/**
 * The lab's network engine: devices, ports, VLANs and how a message really moves between them.
 * It is a teaching model of what Cisco switches and PCs do, kept small and exact:
 *  - a PC sends to a device on its own network directly, anything else to its default gateway
 *  - a switch port is an access port (one VLAN, untagged) or a trunk (many VLANs, tagged except the native one)
 *  - a frame only leaves through ports that carry its VLAN, and never through a port that is shut down
 * Everything here is plain data and pure functions, so missions can test a learner's network directly.
 */
export type Kind = "pc" | "switch" | "router";
export interface Iface {
  name: string; // "GigabitEthernet0/1", "Eth0"
  shut: boolean;
  ip?: string;
  mask?: string;
  mode: "access" | "trunk";
  vlan: number; // access VLAN
  allowed: "all" | number[]; // VLANs a trunk carries
  native: number;
  desc?: string;
}
export interface Device {
  id: string;
  kind: Kind;
  name: string;
  x: number;
  y: number;
  ifaces: Iface[];
  vlans: Record<number, string>; // switch: VLAN database
  svis: Record<number, { ip?: string; mask?: string; shut: boolean }>; // switch: "interface vlan N"
  gateway?: string; // pc, or a switch's "ip default-gateway"
}
export interface Link {
  a: { d: string; i: string };
  b: { d: string; i: string };
}
export interface Net {
  devices: Device[];
  links: Link[];
}

/* ---------- addresses ---------- */
export const toInt = (ip?: string) => {
  const m = (ip || "").trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.some((x) => x > 255) ? null : ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
};
export const toIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
/** A mask is valid when it is ones followed by zeros. */
export const maskBits = (mask?: string) => {
  const m = toInt(mask);
  if (m === null) return null;
  const inv = ~m >>> 0;
  return (inv & (inv + 1)) === 0 ? 32 - Math.round(Math.log2(inv + 1)) : null;
};
export const sameNet = (a?: string, b?: string, mask?: string) => {
  const [x, y, m] = [toInt(a), toInt(b), toInt(mask)];
  return x !== null && y !== null && m !== null && (x & m) >>> 0 === (y & m) >>> 0;
};
export const netOf = (ip?: string, mask?: string) => {
  const [x, m] = [toInt(ip), toInt(mask)];
  return x === null || m === null ? "" : `${toIp((x & m) >>> 0)}/${maskBits(mask)}`;
};

/* ---------- building ---------- */
const iface = (name: string, shut = false): Iface => ({ name, shut, mode: "access", vlan: 1, allowed: "all", native: 1 });
export const short = (n: string) => n.replace("GigabitEthernet", "Gi").replace("Vlan", "Vl");
export function makeDevice(kind: Kind, id: string, name: string, x: number, y: number): Device {
  const ifaces = kind === "pc" ? [iface("Eth0")] : kind === "switch" ? Array.from({ length: 8 }, (_, i) => iface(`GigabitEthernet0/${i + 1}`)) : [iface("GigabitEthernet0/0", true), iface("GigabitEthernet0/1", true)];
  return { id, kind, name, x, y, ifaces, vlans: kind === "switch" ? { 1: "default" } : {}, svis: {} };
}
export const dev = (net: Net, id: string) => net.devices.find((d) => d.id === id)!;
export const ifOf = (d: Device, name: string) => d.ifaces.find((i) => i.name === name);
export function peer(net: Net, d: string, i: string) {
  const l = net.links.find((l) => (l.a.d === d && l.a.i === i) || (l.b.d === d && l.b.i === i));
  if (!l) return null;
  const o = l.a.d === d && l.a.i === i ? l.b : l.a;
  return { d: dev(net, o.d), i: ifOf(dev(net, o.d), o.i)! };
}
export const freePort = (net: Net, d: Device) => d.ifaces.find((i) => !peer(net, d.id, i.name));
/** "up" needs a cable and both ends switched on. */
export function lineState(net: Net, d: Device, i: Iface): "up" | "down" | "admin-down" {
  if (i.shut) return "admin-down";
  const p = peer(net, d.id, i.name);
  return p && !p.i.shut ? "up" : "down";
}
const carries = (i: Iface, v: number) => (i.mode === "access" ? i.vlan === v : i.allowed === "all" || i.allowed.includes(v));

/* ---------- moving a frame inside one network (layer 2) ---------- */
type Block = { kind: "cable" | "shut" | "vlan" | "trunk"; msg: string; path: string[] };
interface Reach {
  found?: { d: Device; via: string };
  path: string[]; // device ids the frame passed, in order
  blocks: Block[];
  vlans: Set<number>;
}
/** Send a frame out of one port and see whether it reaches the device that owns `target`. */
function deliver(net: Net, from: Device, out: Iface | { svi: number }, target: string): Reach {
  const res: Reach = { path: [from.id], blocks: [], vlans: new Set() };
  const seen = new Set<string>();
  const queue: { d: Device; i: Iface | null; tag: number | null; path: string[] }[] = [];
  const send = (d: Device, i: Iface, tag: number | null, path: string[]) => {
    if (i.shut) return void res.blocks.push({ kind: "shut", msg: `${short(i.name)} on ${d.name} is shut down.`, path });
    const p = peer(net, d.id, i.name);
    if (!p) return d.kind === "switch" ? undefined : void res.blocks.push({ kind: "cable", msg: `${d.name} is not cabled to anything.`, path });
    queue.push({ d: p.d, i: p.i, tag, path: [...path, p.d.id] });
  };
  if ("svi" in out) queue.push({ d: from, i: null, tag: out.svi, path: [from.id] });
  else send(from, out, null, [from.id]);

  while (queue.length) {
    const { d, i, tag, path } = queue.shift()!;
    if (d.kind !== "switch") {
      if (!i || i.shut) {
        if (i?.ip === target) res.blocks.push({ kind: "shut", msg: `${short(i.name)} on ${d.name} is shut down.`, path });
        continue;
      }
      if (tag === null && i.ip === target) return { ...res, found: { d, via: i.name }, path };
      continue;
    }
    let v: number;
    if (i) {
      if (i.shut) {
        res.blocks.push({ kind: "shut", msg: `${short(i.name)} on ${d.name} is shut down.`, path });
        continue;
      }
      if (i.mode === "access") {
        if (tag !== null) {
          res.blocks.push({ kind: "trunk", msg: `${short(i.name)} on ${d.name} is an access port, but the other end is sending tagged frames as a trunk.`, path });
          continue;
        }
        v = i.vlan;
      } else {
        v = tag ?? i.native;
        if (!carries(i, v)) {
          res.blocks.push({ kind: "trunk", msg: `The trunk ${short(i.name)} on ${d.name} does not allow VLAN ${v}.`, path });
          continue;
        }
      }
    } else v = tag!;
    if (!d.vlans[v]) {
      res.blocks.push({ kind: "vlan", msg: `VLAN ${v} does not exist on ${d.name}, so it drops the frame.`, path });
      continue;
    }
    if (seen.has(d.id + ":" + v)) continue;
    seen.add(d.id + ":" + v);
    res.vlans.add(v);
    const svi = d.svis[v];
    if (svi && !svi.shut && svi.ip === target) return { ...res, found: { d, via: `Vlan${v}` }, path };
    for (const o of d.ifaces) {
      if (o === i) continue;
      if (o.shut) {
        // a port that would have carried the frame, but is switched off
        if (peer(net, d.id, o.name) && carries(o, v)) res.blocks.push({ kind: "shut", msg: `${short(o.name)} on ${d.name} is shut down.`, path });
        continue;
      }
      if (o.mode === "access") {
        if (o.vlan === v) send(d, o, null, path);
      } else if (carries(o, v)) send(d, o, v === o.native ? null : v, path);
      else if (peer(net, d.id, o.name)) res.blocks.push({ kind: "trunk", msg: `The trunk ${short(o.name)} on ${d.name} does not allow VLAN ${v}.`, path });
    }
  }
  return res;
}

/** Every address in the network and who owns it. */
export function owners(net: Net) {
  const out: { ip: string; mask?: string; d: Device; via: string }[] = [];
  for (const d of net.devices) {
    for (const i of d.ifaces) if (i.ip) out.push({ ip: i.ip, mask: i.mask, d, via: i.name });
    for (const [v, s] of Object.entries(d.svis)) if (s.ip) out.push({ ip: s.ip, mask: s.mask, d, via: `Vlan${v}` });
  }
  return out;
}
/** The VLAN a host's switch port puts it in, if it is on an access port. */
export function vlanOf(net: Net, d: Device): number | null {
  if (d.kind === "switch") return null;
  const p = peer(net, d.id, d.ifaces[0].name);
  return p && p.d.kind === "switch" && p.i.mode === "access" ? p.i.vlan : null;
}

/** The address a device sends from when it talks to `dst`, and the port it uses. */
function source(d: Device, dst: string): { ip: string; mask: string; out: Iface | { svi: number } } | null {
  const cands: { ip: string; mask: string; out: Iface | { svi: number } }[] = [];
  for (const i of d.ifaces) if (i.ip && i.mask && !i.shut) cands.push({ ip: i.ip, mask: i.mask, out: i });
  for (const [v, s] of Object.entries(d.svis)) if (s.ip && s.mask && !s.shut) cands.push({ ip: s.ip, mask: s.mask, out: { svi: Number(v) } });
  return cands.find((c) => sameNet(c.ip, dst, c.mask)) || cands[0] || null;
}

export interface PingResult {
  ok: boolean;
  path: string[]; // device ids from source towards the destination, as far as the message got
  why: string; // one sentence a learner can act on
}
/** One direction of a ping: get a packet from `from` to the address `dst`, through gateways if needed. */
function travel(net: Net, from: Device, dst: string): PingResult {
  let cur = from;
  let path = [from.id];
  for (let hop = 0; hop < 8; hop++) {
    if (owners(net).some((o) => o.d === cur && o.ip === dst)) return { ok: true, path, why: "" };
    const src = source(cur, dst);
    if (!src) return { ok: false, path, why: `${cur.name} has no IP address yet.` };
    if (maskBits(src.mask) === null) return { ok: false, path, why: `${cur.name}'s subnet mask ${src.mask} is not a valid mask.` };
    let next = dst;
    const off = cur.ifaces.find((i) => i.shut && i.ip && sameNet(i.ip, dst, i.mask));
    if (off && !sameNet(src.ip, dst, src.mask)) return { ok: false, path, why: `${short(off.name)} on ${cur.name} is shut down.` };
    if (!sameNet(src.ip, dst, src.mask)) {
      // a router forwards between the networks it is directly connected to; everything else needs a gateway
      const connected = cur.kind === "router" ? source(cur, dst) : null;
      if (cur.kind === "router" && connected && sameNet(connected.ip, dst, connected.mask)) next = dst;
      else if (cur.gateway) next = cur.gateway;
      else return { ok: false, path, why: `${dst} is on a different network from ${cur.name} (${netOf(src.ip, src.mask)}), and ${cur.name} has no default gateway to send it to.` };
      if (next !== dst && !sameNet(src.ip, next, src.mask)) return { ok: false, path, why: `${cur.name}'s default gateway ${next} is not on its own network (${netOf(src.ip, src.mask)}), so it cannot reach it.` };
    }
    const r = deliver(net, cur, src.out, next);
    if (!r.found) return { ok: false, ...explain(net, cur, next, r, next !== dst) };
    path = [...path, ...r.path.slice(1)];
    if (next === dst) return { ok: true, path, why: "" };
    if (r.found.d.kind !== "router") return { ok: false, path, why: `${r.found.d.name} is set as the gateway, but it is not a router and will not pass the message on.` };
    cur = r.found.d;
  }
  return { ok: false, path, why: "The message went round in circles." };
}
/** Turn a failed delivery into the most useful single reason. */
function explain(net: Net, from: Device, target: string, r: Reach, isGateway: boolean): { path: string[]; why: string } {
  const what = isGateway ? `the gateway ${target}` : target;
  const own = owners(net).find((o) => o.ip === target);
  const first = (k: Block["kind"]) => r.blocks.find((b) => b.kind === k);
  const local = r.blocks.find((b) => b.path.length === 1); // a problem right at the sender
  if (local) return { path: local.path, why: local.msg };
  if (!own) return { path: r.path, why: `No device has the address ${target}. Check the address for typos.` };
  const cable = own.d.kind !== "switch" && !peer(net, own.d.id, own.d.ifaces[0].name);
  if (cable) return { path: r.path, why: `${own.d.name} is not cabled to anything.` };
  const b = first("shut") || first("trunk") || first("vlan");
  if (b) return { path: b.path, why: b.msg };
  const [va, vb] = [vlanOf(net, from), vlanOf(net, own.d)];
  if (va !== null && vb !== null && va !== vb) return { path: r.path, why: `${from.name} is in VLAN ${va} and ${own.d.name} is in VLAN ${vb}. A switch keeps VLANs apart, so they cannot talk directly.` };
  return { path: r.path, why: `There is no working path from ${from.name} to ${what}.` };
}

/** Ping: the request has to arrive, and the reply has to find its way back. */
export function ping(net: Net, fromId: string, dst: string): PingResult {
  const from = dev(net, fromId);
  if (toInt(dst) === null) return { ok: false, path: [fromId], why: `“${dst}” is not a valid IP address.` };
  const src = source(from, dst);
  if (!src) return { ok: false, path: [fromId], why: `${from.name} has no IP address yet.` };
  const out = travel(net, from, dst);
  if (!out.ok) return out;
  const there = owners(net).find((o) => o.ip === dst)!.d;
  if (there === from) return { ok: true, path: [fromId], why: "" };
  const back = travel(net, there, src.ip);
  if (!back.ok) return { ok: false, path: out.path, why: `The message reached ${there.name}, but the reply could not get back: ${back.why}` };
  return { ok: true, path: out.path, why: "" };
}
/** Can these two devices ping each other, by name? */
export function canReach(net: Net, a: string, b: string): PingResult {
  const [da, db] = [net.devices.find((d) => d.name === a), net.devices.find((d) => d.name === b)];
  if (!da || !db) return { ok: false, path: [], why: `${!da ? a : b} is missing from the network.` };
  const ip = owners(net).find((o) => o.d === db)?.ip;
  if (!ip) return { ok: false, path: [da.id], why: `${db.name} has no IP address yet.` };
  return ping(net, da.id, ip);
}
export const clone = (net: Net): Net => JSON.parse(JSON.stringify(net));
