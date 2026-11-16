/**
 * A small Cisco-IOS-style command line for the lab's switches and routers.
 * It understands the commands the missions teach, with the usual abbreviations ("conf t", "sh ip int br").
 * Anything else gets IOS's own error marks, or a plain "not in this lab yet" for real commands we have not built.
 */
import { ifOf, lineState, maskBits, peer, ping, short, toInt, type Device, type Iface, type Net } from "./engine";

export interface Session {
  mode: "user" | "priv" | "config" | "if" | "vlan";
  ifName?: string; // the interface being configured: a port name or "Vlan10"
  vlan?: number;
}
export const newSession = (): Session => ({ mode: "user" });
export function prompt(d: Device, s: Session) {
  return d.name + { user: ">", priv: "#", config: "(config)#", if: "(config-if)#", vlan: "(config-vlan)#" }[s.mode];
}

const INVALID = "% Invalid input detected.";
const INCOMPLETE = "% Incomplete command.";
const LATER = "% That command is real, but it is not part of this lab yet.";
/** Does what was typed abbreviate this word? ("conf" for "configure") */
const is = (typed: string | undefined, word: string, min = 1) => !!typed && typed.length >= min && word.startsWith(typed.toLowerCase());
const pad = (s: string | number, n: number) => String(s).padEnd(n);
/** The lab's own explanation, wrapped to fit a terminal. A real device would not tell you this. */
const note = (why: string) => ("(lab note: " + why + ")").replace(/(.{1,58})(\s+|$)/g, "$1\n").trimEnd();

/** "gi0/1", "g 0/1", "GigabitEthernet0/1" -> the port's full name; "vlan 10" -> "Vlan10". */
function parseIf(d: Device, words: string[]): string | null {
  const t = words.join("").toLowerCase();
  const v = t.match(/^v(?:l|la|lan)?(\d+)$/);
  if (v) return d.kind === "switch" ? `Vlan${Number(v[1])}` : null;
  const g = t.match(/^g(?:i|ig|iga\w*)?(\d+\/\d+)$/) || t.match(/^(?:fa\w*|e\w*)(\d+\/\d+)$/);
  const name = g ? `GigabitEthernet${g[1]}` : null;
  return name && ifOf(d, name) ? name : null;
}
function parseVlans(s: string): number[] | null {
  const out: number[] = [];
  for (const part of s.split(",")) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    for (let v = Number(m[1]); v <= Number(m[2] ?? m[1]); v++) {
      if (v < 1 || v > 4094) return null;
      out.push(v);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}
const list = (a: "all" | number[]) => (a === "all" ? "1-4094" : a.join(","));

/* ---------- show commands ---------- */
function statusWords(net: Net, d: Device, i: Iface): [string, string] {
  const st = lineState(net, d, i);
  return st === "admin-down" ? ["administratively down", "down"] : st === "up" ? ["up", "up"] : ["down", "down"];
}
function showIpIntBrief(net: Net, d: Device) {
  const rows = [`${pad("Interface", 23)}${pad("IP-Address", 16)}OK? Method ${pad("Status", 22)}Protocol`];
  for (const i of d.ifaces) {
    const [a, b] = statusWords(net, d, i);
    rows.push(`${pad(i.name, 23)}${pad(i.ip || "unassigned", 16)}YES ${pad(i.ip ? "manual" : "unset", 7)}${pad(a, 22)}${b}`);
  }
  for (const [v, s] of Object.entries(d.svis)) {
    const up = !s.shut && !!d.vlans[Number(v)] && d.ifaces.some((i) => lineState(net, d, i) === "up" && (i.mode === "trunk" || i.vlan === Number(v)));
    rows.push(`${pad("Vlan" + v, 23)}${pad(s.ip || "unassigned", 16)}YES ${pad(s.ip ? "manual" : "unset", 7)}${pad(s.shut ? "administratively down" : up ? "up" : "down", 22)}${up ? "up" : "down"}`);
  }
  return rows.join("\n");
}
function showVlanBrief(d: Device) {
  const rows = [`${pad("VLAN", 5)}${pad("Name", 33)}${pad("Status", 10)}Ports`, `${"-".repeat(4)} ${"-".repeat(32)} ${"-".repeat(9)} ${"-".repeat(24)}`];
  for (const [v, name] of Object.entries(d.vlans)) {
    const ports = d.ifaces.filter((i) => i.mode === "access" && i.vlan === Number(v)).map((i) => short(i.name));
    rows.push(`${pad(v, 5)}${pad(name, 33)}${pad("active", 10)}${ports.join(", ")}`);
  }
  return rows.join("\n");
}
function showIntStatus(net: Net, d: Device) {
  const rows = [`${pad("Port", 10)}${pad("Name", 19)}${pad("Status", 13)}${pad("Vlan", 11)}Duplex  Speed`];
  for (const i of d.ifaces) {
    const st = lineState(net, d, i);
    rows.push(`${pad(short(i.name), 10)}${pad((i.desc || "").slice(0, 18), 19)}${pad(st === "up" ? "connected" : st === "down" ? "notconnect" : "disabled", 13)}${pad(i.mode === "trunk" ? "trunk" : i.vlan, 11)}${st === "up" ? "a-full  a-1000" : "auto    auto"}`);
  }
  return rows.join("\n");
}
function showIntTrunk(net: Net, d: Device) {
  const tr = d.ifaces.filter((i) => i.mode === "trunk" && lineState(net, d, i) === "up");
  if (!tr.length) return "";
  return [`${pad("Port", 12)}${pad("Mode", 13)}${pad("Encapsulation", 15)}${pad("Status", 14)}Native vlan`, ...tr.map((i) => `${pad(short(i.name), 12)}${pad("on", 13)}${pad("802.1q", 15)}${pad("trunking", 14)}${i.native}`), "", `${pad("Port", 12)}Vlans allowed on trunk`, ...tr.map((i) => `${pad(short(i.name), 12)}${list(i.allowed)}`), "", `${pad("Port", 12)}Vlans allowed and active in management domain`, ...tr.map((i) => `${pad(short(i.name), 12)}${Object.keys(d.vlans).map(Number).filter((v) => i.allowed === "all" || i.allowed.includes(v)).join(",")}`)].join("\n");
}
function showRun(d: Device) {
  const out = ["Building configuration...", "", "!", `hostname ${d.name}`, "!"];
  if (d.kind === "switch") for (const [v, name] of Object.entries(d.vlans)) if (v !== "1") out.push(`vlan ${v}`, ...(name === `VLAN${v.padStart(4, "0")}` ? [] : [` name ${name}`]), "!");
  for (const i of d.ifaces) {
    out.push(`interface ${i.name}`);
    if (i.desc) out.push(` description ${i.desc}`);
    if (d.kind === "switch") {
      if (i.mode === "trunk") {
        if (i.native !== 1) out.push(` switchport trunk native vlan ${i.native}`);
        if (i.allowed !== "all") out.push(` switchport trunk allowed vlan ${list(i.allowed)}`);
        out.push(" switchport mode trunk");
      } else {
        if (i.vlan !== 1) out.push(` switchport access vlan ${i.vlan}`);
        out.push(" switchport mode access");
      }
    } else out.push(i.ip ? ` ip address ${i.ip} ${i.mask}` : " no ip address");
    if (i.shut) out.push(" shutdown");
    out.push("!");
  }
  for (const [v, s] of Object.entries(d.svis)) out.push(`interface Vlan${v}`, s.ip ? ` ip address ${s.ip} ${s.mask}` : " no ip address", ...(s.shut ? [" shutdown"] : []), "!");
  if (d.gateway) out.push(`ip default-gateway ${d.gateway}`, "!");
  return out.concat("end").join("\n");
}
function show(net: Net, d: Device, w: string[]): string {
  if (!w.length) return INCOMPLETE;
  if (is(w[0], "running-config", 1) && w.length === 1) return showRun(d);
  if (is(w[0], "ip", 2) && is(w[1], "interface", 3) && is(w[2], "brief", 1)) return showIpIntBrief(net, d);
  if (is(w[0], "vlan", 1) && (w.length === 1 || is(w[1], "brief", 1))) return d.kind === "switch" ? showVlanBrief(d) : INVALID;
  if (is(w[0], "interfaces", 3) && is(w[1], "status", 1)) return d.kind === "switch" ? showIntStatus(net, d) : INVALID;
  if (is(w[0], "interfaces", 3) && is(w[1], "trunk", 1)) return d.kind === "switch" ? showIntTrunk(net, d) : INVALID;
  if (is(w[0], "interfaces", 3) && w.length >= 2) {
    const n = parseIf(d, w.slice(1));
    const i = n && ifOf(d, n);
    if (!i) return INVALID;
    const [a, b] = statusWords(net, d, i);
    const p = peer(net, d.id, i.name);
    return `${i.name} is ${a}, line protocol is ${b}${a === "up" ? " (connected)" : a === "down" ? " (notconnect)" : ""}\n  ${i.desc ? `Description: ${i.desc}\n  ` : ""}${i.ip ? `Internet address is ${i.ip}/${maskBits(i.mask)}\n  ` : ""}Full-duplex, 1000Mb/s${p ? `\n  Cabled to ${p.d.name} ${short(p.i.name)}` : "\n  No cable attached"}`;
  }
  if (["mac", "spanning-tree", "cdp", "lldp", "version", "ip", "arp", "startup-config"].some((x) => is(w[0], x, 2))) return LATER;
  return INVALID;
}

/* ---------- running a command ---------- */
/** Run one line on a device. Changes `net` and the session in place; returns what the device prints. */
export function run(net: Net, d: Device, s: Session, line: string): string {
  const w = line.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "";
  if (w[0] === "?") return help(s, d);
  const exec = (words: string[]): string | null => {
    if (is(words[0], "show", 2)) return show(net, d, words.slice(1));
    if (is(words[0], "ping", 1)) {
      if (!words[1]) return INCOMPLETE;
      const r = ping(net, d.id, words[1]);
      return `Sending 5, 100-byte ICMP Echos to ${words[1]}, timeout is 2 seconds:\n${r.ok ? "!!!!!" : "....."}\nSuccess rate is ${r.ok ? "100 percent (5/5)" : "0 percent (0/5)"}${r.ok ? "" : "\n" + note(r.why)}`;
    }
    if (is(words[0], "write", 2) || (is(words[0], "copy", 3) && is(words[1], "running-config", 3))) return "Building configuration...\n[OK]";
    return null;
  };
  const no = is(w[0], "no", 2) && w.length > 1;
  const c = no ? w.slice(1) : w;

  if (s.mode === "user") {
    if (is(w[0], "enable", 2)) return (s.mode = "priv"), "";
    if (is(w[0], "exit", 2)) return "";
    if (is(w[0], "ping", 1) || is(w[0], "show", 2)) return exec(w)!;
    if (is(w[0], "configure", 4)) return INVALID + "\n" + note("type “enable” first to get to the # prompt.");
    return INVALID;
  }
  if (s.mode === "priv") {
    if (is(w[0], "configure", 4)) return w.length === 1 || is(w[1], "terminal", 1) ? ((s.mode = "config"), "Enter configuration commands, one per line.  End with CNTL/Z.") : INVALID;
    if (is(w[0], "disable", 3) || is(w[0], "exit", 2)) return (s.mode = "user"), "";
    if (is(w[0], "end", 2)) return "";
    const r = exec(w);
    if (r !== null) return r;
    if (["reload", "debug", "clear", "terminal", "traceroute", "telnet", "ssh"].some((x) => is(w[0], x, 2))) return LATER;
    return INVALID;
  }
  // every configuration mode
  if (is(w[0], "end", 2)) return (s.mode = "priv"), "";
  if (is(w[0], "exit", 2)) return (s.mode = s.mode === "config" ? "priv" : "config"), "";
  if (is(w[0], "do", 2)) return exec(w.slice(1)) ?? INVALID;
  if (is(c[0], "hostname", 1)) return !no && /^[A-Za-z][\w-]{0,30}$/.test(c[1] || "") ? ((d.name = c[1]), "") : no ? "" : INVALID;
  if (is(c[0], "interface", 3)) {
    if (no) return LATER;
    if (is(c[1], "range", 1)) return LATER;
    const n = parseIf(d, c.slice(1));
    if (!n) return c.length < 2 ? INCOMPLETE : INVALID;
    if (n.startsWith("Vlan")) d.svis[Number(n.slice(4))] ||= { shut: false };
    return (s.mode = "if"), (s.ifName = n), "";
  }
  if (d.kind === "switch" && is(c[0], "vlan", 1)) {
    const v = Number(c[1]);
    if (!Number.isInteger(v) || v < 1 || v > 4094) return c.length < 2 ? INCOMPLETE : INVALID;
    if (no) {
      if (v === 1) return "% Default VLAN 1 may not be deleted.";
      delete d.vlans[v];
      return "";
    }
    d.vlans[v] ||= `VLAN${String(v).padStart(4, "0")}`;
    return (s.mode = "vlan"), (s.vlan = v), "";
  }
  if (d.kind === "switch" && is(c[0], "ip", 2) && is(c[1], "default-gateway", 1)) {
    if (no) return (d.gateway = undefined), "";
    return toInt(c[2]) === null ? INVALID : ((d.gateway = c[2]), "");
  }

  if (s.mode === "vlan") {
    if (is(c[0], "name", 1)) return no || !c[1] ? INCOMPLETE : ((d.vlans[s.vlan!] = c[1].slice(0, 32)), "");
  }
  if (s.mode === "if") {
    const svi = s.ifName!.startsWith("Vlan") ? d.svis[Number(s.ifName!.slice(4))] : null;
    const i = svi ? null : ifOf(d, s.ifName!)!;
    const t = (svi || i)!;
    if (is(c[0], "shutdown", 2)) return (t.shut = !no), "";
    if (is(c[0], "description", 1) && i) return (i.desc = no ? undefined : c.slice(1).join(" ")), "";
    if (is(c[0], "ip", 2) && is(c[1], "address", 1)) {
      if (i && d.kind === "switch") return "% IP addresses cannot be configured on a layer 2 switch port. Use “interface vlan <number>” for the switch's own address.";
      if (no) return (t.ip = t.mask = undefined), "";
      if (c.length < 4) return INCOMPLETE;
      if (toInt(c[2]) === null) return INVALID;
      if (maskBits(c[3]) === null) return `Bad mask ${c[3]} for address ${c[2]}`;
      return (t.ip = c[2]), (t.mask = c[3]), "";
    }
    if (is(c[0], "switchport", 2) && i && d.kind === "switch") {
      if (c.length === 1) return "";
      if (is(c[1], "mode", 1)) {
        if (no) return (i.mode = "access"), "";
        if (is(c[2], "access", 1)) return (i.mode = "access"), "";
        if (is(c[2], "trunk", 1)) return (i.mode = "trunk"), "";
        return is(c[2], "dynamic", 1) ? LATER : c.length < 3 ? INCOMPLETE : INVALID;
      }
      if (is(c[1], "access", 1) && is(c[2], "vlan", 1)) {
        if (no) return (i.vlan = 1), "";
        const v = Number(c[3]);
        if (!Number.isInteger(v) || v < 1 || v > 4094) return c.length < 4 ? INCOMPLETE : INVALID;
        const made = !d.vlans[v];
        if (made) d.vlans[v] = `VLAN${String(v).padStart(4, "0")}`;
        i.vlan = v;
        return made ? `% Access VLAN does not exist. Creating vlan ${v}` : "";
      }
      if (is(c[1], "trunk", 1) && is(c[2], "allowed", 1) && is(c[3], "vlan", 1)) {
        if (no) return (i.allowed = "all"), "";
        if (is(c[4], "all", 2)) return (i.allowed = "all"), "";
        const add = is(c[4], "add", 2);
        const remove = is(c[4], "remove", 1);
        const vs = parseVlans(add || remove ? c[5] || "" : c[4] || "");
        if (!vs) return c.length < 5 ? INCOMPLETE : INVALID;
        const cur = i.allowed === "all" ? (add ? null : remove ? Array.from({ length: 4094 }, (_, k) => k + 1) : []) : i.allowed;
        if (add) i.allowed = cur === null ? "all" : [...new Set([...cur, ...vs])].sort((a, b) => a - b);
        else if (remove) i.allowed = cur!.filter((v) => !vs.includes(v));
        else i.allowed = vs;
        return "";
      }
      if (is(c[1], "trunk", 1) && is(c[2], "native", 1) && is(c[3], "vlan", 1)) {
        if (no) return (i.native = 1), "";
        const v = Number(c[4]);
        return Number.isInteger(v) && v >= 1 && v <= 4094 ? ((i.native = v), "") : INVALID;
      }
      if (is(c[1], "trunk", 1) && is(c[2], "encapsulation", 1)) return "";
      if (["port-security", "nonegotiate", "voice"].some((x) => is(c[1], x, 1))) return LATER;
      return INVALID;
    }
    if (["speed", "duplex", "spanning-tree", "channel-group", "ipv6", "power"].some((x) => is(c[0], x, 2))) return LATER;
  }
  if (["router", "ip", "ipv6", "spanning-tree", "line", "enable", "username", "access-list", "banner", "service", "ntp", "snmp-server", "logging", "aaa"].some((x) => is(c[0], x, 2))) return LATER;
  return INVALID;
}

function help(s: Session, d: Device): string {
  const sw = d.kind === "switch";
  return {
    user: "enable            Go to the # prompt, where you can look and configure\nping <address>    Test whether an address answers\nshow ...          Look at the device",
    priv: `configure terminal        Start changing the configuration\nshow running-config       The whole configuration\nshow ip interface brief   Every port and its state${sw ? "\nshow vlan brief           VLANs and the ports in each\nshow interfaces status    Ports, state and VLAN\nshow interfaces trunk     Trunk ports and the VLANs they carry" : ""}\nping <address>            Test whether an address answers\nexit                      Back to the > prompt`,
    config: `hostname <name>           Rename the device\ninterface <port>          Configure a port, such as gi0/1${sw ? "\ninterface vlan <number>   Give the switch itself an address\nvlan <number>             Create a VLAN" : ""}\nend                       Back to the # prompt`,
    if: `${sw ? "switchport mode access | trunk\nswitchport access vlan <number>\nswitchport trunk allowed vlan <list>\nswitchport trunk native vlan <number>\n" : "ip address <address> <mask>\n"}shutdown | no shutdown\ndescription <text>\nexit | end`,
    vlan: "name <text>       Give the VLAN a name\nexit | end",
  }[s.mode];
}
