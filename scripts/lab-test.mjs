// Tests for the lab engine and command line. Run: node scripts/lab-test.mjs
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
await build({ entryPoints: ["src/lab/cli.ts"], bundle: true, format: "esm", outfile: "dist/lab-test/cli.mjs", logLevel: "silent" });
await build({ entryPoints: ["src/lab/engine.ts"], bundle: true, format: "esm", outfile: "dist/lab-test/engine.mjs", logLevel: "silent" });
const E = await import(pathToFileURL("dist/lab-test/engine.mjs"));
const C = await import(pathToFileURL("dist/lab-test/cli.mjs"));
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  -> " + JSON.stringify(extra))); };
const pc = (net, id, name, ip, mask = "255.255.255.0", gw) => { const d = E.makeDevice("pc", id, name, 0, 0); d.ifaces[0].ip = ip; d.ifaces[0].mask = mask; d.gateway = gw; net.devices.push(d); return d; };
const sw = (net, id, name) => { const d = E.makeDevice("switch", id, name, 0, 0); net.devices.push(d); return d; };
const cable = (net, a, ai, b, bi) => net.links.push({ a: { d: a, i: ai }, b: { d: b, i: bi } });
const G = (n) => `GigabitEthernet0/${n}`;
const cmds = (net, d, lines) => { const s = C.newSession(); return lines.map((l) => C.run(net, d, s, l)); };

// 1. two PCs, one switch
let net = { devices: [], links: [] };
pc(net, "p1", "PC1", "192.168.1.10"); pc(net, "p2", "PC2", "192.168.1.20"); const s1 = sw(net, "s1", "S1");
ok("uncabled PC explains itself", /not cabled/.test(E.ping(net, "p1", "192.168.1.20").why), E.ping(net, "p1", "192.168.1.20"));
cable(net, "p1", "Eth0", "s1", G(1)); cable(net, "p2", "Eth0", "s1", G(2));
let r = E.ping(net, "p1", "192.168.1.20"); ok("same VLAN ping works", r.ok && r.path.join() === "p1,s1,p2", r);
ok("no such address", /No device has the address/.test(E.ping(net, "p1", "192.168.1.99").why));
ok("bad address", !E.ping(net, "p1", "192.168.1.999").ok);
// shutdown
cmds(net, s1, ["enable", "conf t", "int gi0/2", "shutdown"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("shut port blocks and says so", !r.ok && /Gi0\/2 on S1 is shut down/.test(r.why), r);
ok("show ip int brief shows admin down", /GigabitEthernet0\/2\s+unassigned\s+YES unset\s+administratively down\s+down/.test(cmds(net, s1, ["en", "sh ip int br"])[1]));
cmds(net, s1, ["en", "conf t", "int g0/2", "no shut"]);
ok("no shutdown restores", E.ping(net, "p1", "192.168.1.20").ok);
// wrong subnet, no gateway
E.dev(net, "p2").ifaces[0].ip = "192.168.2.20";
r = E.ping(net, "p1", "192.168.2.20"); ok("different network without gateway", !r.ok && /different network.*no default gateway/.test(r.why), r);
E.dev(net, "p2").ifaces[0].ip = "192.168.1.20";
// reply cannot come back (target mask wrong makes it think the source is elsewhere)
E.dev(net, "p2").ifaces[0].mask = "255.255.255.252";
r = E.ping(net, "p1", "192.168.1.20"); ok("reply path failure explained", !r.ok && /reached PC2, but the reply/.test(r.why), r);
E.dev(net, "p2").ifaces[0].mask = "255.255.255.0";
// VLANs
let out = cmds(net, s1, ["en", "conf t", "vlan 10", "name Sales", "exit", "int gi0/1", "switchport mode access", "switchport access vlan 10", "end", "show vlan brief"]);
ok("vlan created and named", /10\s+Sales\s+active\s+Gi0\/1/.test(out.at(-1)), out.at(-1));
r = E.ping(net, "p1", "192.168.1.20"); ok("different VLANs kept apart with reason", !r.ok && /VLAN 10.*VLAN 1/.test(r.why), r);
out = cmds(net, s1, ["en", "conf t", "int gi0/2", "sw acc vlan 20"]); ok("auto-creates access VLAN with IOS message", /Creating vlan 20/.test(out.at(-1)), out);
cmds(net, s1, ["en", "conf t", "int gi0/2", "sw acc vl 10"]); ok("same VLAN again works", E.ping(net, "p1", "192.168.1.20").ok);
// trunk between two switches
const s2 = sw(net, "s2", "S2"); net.links = net.links.filter((l) => l.a.d !== "p2"); cable(net, "p2", "Eth0", "s2", G(1)); cable(net, "s1", G(8), "s2", G(8));
cmds(net, s2, ["en", "conf t", "vlan 10", "int gi0/1", "sw mode acc", "sw acc vlan 10"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("access-to-access link in VLAN 1 does not carry VLAN 10", !r.ok, r);
cmds(net, s1, ["en", "conf t", "int gi0/8", "sw mode trunk"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("one-sided trunk fails with tagged/access reason", !r.ok && /access port.*tagged/.test(r.why), r);
cmds(net, s2, ["en", "conf t", "int gi0/8", "sw mode trunk"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("trunk both ends carries VLAN 10", r.ok && r.path.join() === "p1,s1,s2,p2", r);
cmds(net, s1, ["en", "conf t", "int gi0/8", "sw trunk allowed vlan 20"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("trunk not allowing the VLAN explained", !r.ok && /does not allow VLAN 10/.test(r.why), r);
cmds(net, s1, ["en", "conf t", "int gi0/8", "sw trunk allowed vlan add 10"]);
ok("allowed vlan add works", E.ping(net, "p1", "192.168.1.20").ok && E.ifOf(s1, G(8)).allowed.join() === "10,20");
out = cmds(net, s1, ["en", "sh int trunk"]); ok("show interfaces trunk", /Gi0\/8\s+on\s+802.1q\s+trunking\s+1/.test(out[1]) && /Gi0\/8\s+10,20/.test(out[1]), out[1]);
cmds(net, s2, ["en", "conf t", "no vlan 10"]);
r = E.ping(net, "p1", "192.168.1.20"); ok("missing VLAN on far switch explained", !r.ok && /VLAN 10 does not exist on S2/.test(r.why), r);
cmds(net, s2, ["en", "conf t", "vlan 10"]);
// SVI and switch ping
cmds(net, s1, ["en", "conf t", "int vlan 10", "ip address 192.168.1.2 255.255.255.0", "no shut"]);
ok("PC pings the switch's own address", E.ping(net, "p1", "192.168.1.2").ok);
out = cmds(net, s1, ["en", "ping 192.168.1.20"]); ok("switch pings a PC", /!!!!!/.test(out[1]), out[1]);
ok("no ip on a layer 2 port", /cannot be configured on a layer 2/.test(cmds(net, s1, ["en", "conf t", "int gi0/3", "ip address 1.1.1.1 255.0.0.0"]).at(-1)));
// router between two networks
net = { devices: [], links: [] };
pc(net, "a", "PC1", "10.0.1.10", "255.255.255.0", "10.0.1.1"); pc(net, "b", "PC2", "10.0.2.10", "255.255.255.0", "10.0.2.1");
const rt = E.makeDevice("router", "r", "R1", 0, 0); net.devices.push(rt); cable(net, "a", "Eth0", "r", "GigabitEthernet0/0"); cable(net, "b", "Eth0", "r", "GigabitEthernet0/1");
cmds(net, rt, ["en", "conf t", "int gi0/0", "ip add 10.0.1.1 255.255.255.0", "no shut", "int gi0/1", "ip add 10.0.2.1 255.255.255.0"]);
r = E.ping(net, "a", "10.0.2.10"); ok("router port still shut blocks", !r.ok && /shut down/.test(r.why), r);
cmds(net, rt, ["en", "conf t", "int gi0/1", "no shut"]);
r = E.ping(net, "a", "10.0.2.10"); ok("router forwards between its networks", r.ok && r.path.join() === "a,r,b", r);
E.dev(net, "b").gateway = undefined;
r = E.ping(net, "a", "10.0.2.10"); ok("reply needs the far PC's gateway", !r.ok && /reply could not get back/.test(r.why), r);
// CLI behaviour
net = { devices: [], links: [] }; const s = sw(net, "s", "S1");
out = cmds(net, s, ["conf t", "enable", "conf t", "hostname Core1", "bogus", "int gi0/99", "int gi0/1", "desc Uplink to floor 2", "switchport mode trunk", "sw tr nat vl 99", "do sh run", "router ospf 1", "end", "wr"]);
ok("needs enable first", /Invalid input/.test(out[0]) && /enable/.test(out[0]));
ok("hostname changes prompt", C.prompt(s, C.newSession()) === "Core1>");
ok("invalid and bad port rejected", /Invalid/.test(out[4]) && /Invalid/.test(out[5]));
ok("running-config reflects changes", /hostname Core1/.test(out[10]) && /description Uplink to floor 2/.test(out[10]) && /switchport trunk native vlan 99/.test(out[10]) && /switchport mode trunk/.test(out[10]), out[10]);
ok("unsupported real command says so", /not part of this lab yet/.test(out[11]));
ok("write memory", /\[OK\]/.test(out[13]));
ok("bad mask rejected", /Bad mask/.test(cmds(net, s, ["en", "conf t", "int vlan 1", "ip address 10.0.0.1 255.0.255.0"]).at(-1)));
ok("? lists commands", /configure terminal/.test(cmds(net, s, ["en", "?"])[1]));
{ const n2 = { devices: [], links: [] }; const a = sw(n2, "a", "S1"); const b = sw(n2, "b", "S2"); cable(n2, "a", G(8), "b", G(8)); const o = cmds(n2, a, ["en", "show cdp neighbors", "sh lldp nei", "sh cdp nei det"]); ok("show cdp neighbors lists the far switch and port", /S2\s+Gig 0\/8\s+150\s+S\s+Lab-Switch\s+Gig 0\/8/.test(o[1]) && /S2\s+Gi0\/8/.test(o[2]) && /Native VLAN: 1/.test(o[3]), o); }
console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
