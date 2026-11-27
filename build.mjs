import { build } from "esbuild";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { bundleClient, projectRoot } from "./frontend.mjs";

const assets = {};
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".webp": "image/webp",
  ".woff": "font/woff", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8",
  ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json; charset=utf-8",
};
const source = new URL(".", import.meta.url);

async function addAsset(path, url) {
  assets[url] = [mime[extname(url)], (await readFile(new URL(path, source))).toString("base64")];
}

async function collect(directory) {
  for (const entry of await readdir(new URL(directory + "/", source), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (path === "public/index.html") continue;
    if (entry.isDirectory()) await collect(path);
    else if (mime[extname(path)]) await addAsset(path, path.slice("public".length));
  }
}

await bundleClient();
await collect("public");
await addAsset("dist/client/index.html", "/index.html");
await addAsset("dist/client/app.js", "/app.js");
await addAsset("dist/client/styles.css", "/styles.css");
await writeFile(new URL("dist/worker-assets.mjs", source), "export const assets = " + JSON.stringify(assets) + ";\n");
await build({
  absWorkingDir: projectRoot,
  entryPoints: ["lib/worker.mjs"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
});
await mkdir(new URL("dist/.openai/", source), { recursive: true });
await copyFile(new URL(".openai/hosting.json", source), new URL("dist/.openai/hosting.json", source));
console.log("Built AstraTravel Worker (" + Object.keys(assets).length + " assets).");
