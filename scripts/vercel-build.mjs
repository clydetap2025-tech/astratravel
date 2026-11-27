// Vercel build: the client bundle and the pre-rendered page (dist/client), plus the files from public/,
// so the CDN serves the whole front end. public/index.html is the offline demo and is left out.
import { cp, readdir } from "node:fs/promises";
import { bundleClient } from "../frontend.mjs";

await bundleClient();
const source = new URL("../public/", import.meta.url);
const target = new URL("../dist/client/", import.meta.url);
for (const entry of await readdir(source)) {
  if (entry === "index.html") continue;
  await cp(new URL(entry, source), new URL(entry, target), { recursive: true });
}
console.log("AstraTravel: static front end ready in dist/client");
