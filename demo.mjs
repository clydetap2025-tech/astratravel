import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleOffline, pageDocument, renderHome } from "./frontend.mjs";

const source = new URL(".", import.meta.url);
const read = (path) => readFile(new URL(path, source), "utf8");
const types = { ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const assets = {};
for (const file of await readdir(new URL("public/assets/", source))) {
  const mime = types[extname(file)];
  if (!mime) continue;
  const buffer = await readFile(new URL("public/assets/" + file, source));
  assets[file] = "data:" + mime + ";base64," + buffer.toString("base64");
}

const images = Object.fromEntries(Object.entries(assets).filter(([file]) => !file.endsWith(".woff2")));
const [client, home, css] = await Promise.all([bundleOffline(), renderHome(images), read("public/styles.css")]);
const embeddedStyles = css.replace(/url\("\/assets\/([^"]+)"\)/g, (_, file) => 'url("' + assets[file] + '")');
const theme = (await read("public/theme.js")).replace(/<\/script/gi, "<\\/script");
const html = pageDocument({
  themeScript: "<script>\n" + theme + "\n</script>",
  home,
  icon: images["astratravel.svg"],
  styles: "<style>\n" + embeddedStyles + "\n</style>",
  script: "<script>\n" + client.replace(/<\/script/gi, "<\\/script") + "\n</script>",
});

const output = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("public/index.html", source));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
// Restore the original path for file previews that already have it open.
if (!process.argv[2]) await copyFile(output, new URL("lib/shell.html", source));
console.log("Saved interactive React demo to " + output);
