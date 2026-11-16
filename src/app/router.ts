/** Pages are named by the part after # in the address ("#lesson-ipv4"), so links can be shared and Back works. */
import { useSyncExternalStore } from "react";

const read = () => (typeof location === "undefined" ? "" : decodeURIComponent(location.hash.replace(/^#/, "")));
const listen = (f: () => void) => {
  addEventListener("hashchange", f);
  return () => removeEventListener("hashchange", f);
};
export const useRoute = () => useSyncExternalStore(listen, read, () => "");
export function go(name: string) {
  if (read() === name) return;
  location.hash = name;
  scrollTo({ top: 0 });
}
