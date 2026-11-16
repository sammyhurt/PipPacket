// Every mission must start unfinished and be finishable with the commands it teaches. Run: node scripts/mission-test.mjs
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
for (const f of ["missions", "cli", "engine"]) await build({ entryPoints: [`src/lab/${f}.ts`], bundle: true, format: "esm", outfile: `dist/lab-test/${f}.mjs`, logLevel: "silent" });
const M = await import(pathToFileURL("dist/lab-test/missions.mjs"));
const C = await import(pathToFileURL("dist/lab-test/cli.mjs"));
const E = await import(pathToFileURL("dist/lab-test/engine.mjs"));
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : " -> " + JSON.stringify(x))); };
const by = (net, name) => net.devices.find((d) => d.name === name);
const cli = (net, name, lines) => { const s = C.newSession(); for (const l of ["enable", "configure terminal", ...lines]) C.run(net, by(net, name), s, l); };
const cable = (net, a, b) => { const [da, db] = [by(net, a), by(net, b)]; net.links.push({ a: { d: da.id, i: E.freePort(net, da).name }, b: { d: db.id, i: E.freePort(net, db).name } }); };
const state = (m, net) => m.goals.map((g) => g.test(net));
const solve = {
  "first-link": (net) => { cable(net, "PC1", "S1"); cable(net, "PC2", "S1"); Object.assign(by(net, "PC1").ifaces[0], { ip: "192.168.1.10", mask: "255.255.255.0" }); Object.assign(by(net, "PC2").ifaces[0], { ip: "192.168.1.20", mask: "255.255.255.0" }); },
  "fix-the-port": (net) => { cli(net, "S1", ["interface gi0/2", "no shutdown"]); by(net, "PC2").ifaces[0].ip = "192.168.1.20"; cable(net, "PC3", "S1"); },
  "two-departments": (net) => cli(net, "S1", ["vlan 10", "name Sales", "vlan 20", "name Engineering", "interface gi0/1", "switchport mode access", "switchport access vlan 10", "interface gi0/2", "switchport access vlan 10", "interface gi0/3", "switchport access vlan 20", "interface gi0/4", "switchport access vlan 20"]),
  "wire-the-school": (net) => { for (const s of ["S1", "S2"]) cli(net, s, ["vlan 10", "name Staff", "vlan 20", "name Students", "interface gi0/1", "switchport mode access", "switchport access vlan 10", "interface gi0/2", "switchport access vlan 20", "interface gi0/8", "switchport mode trunk"]); },
};
for (const m of M.missions) {
  const net = m.start();
  const before = state(m, net);
  ok(`${m.id}: not finished at the start`, before.some((r) => !r.ok));
  ok(`${m.id}: every unmet goal explains itself`, before.every((r) => r.ok || r.why), before);
  solve[m.id](net);
  const after = state(m, net);
  ok(`${m.id}: finished by its own commands`, after.every((r) => r.ok), after);
}
// wire-the-school half done: trunk on one side only must not pass
{ const m = M.missions.find((x) => x.id === "wire-the-school"); const net = m.start(); solve["wire-the-school"](net); cli(net, "S2", ["interface gi0/8", "switchport mode access"]); const r = state(m, net); ok("wire-the-school: one-sided trunk fails", !r.every((x) => x.ok)); }
console.log(fails ? `\n${fails} FAILED` : "\nall passed"); process.exit(fails ? 1 : 0);
