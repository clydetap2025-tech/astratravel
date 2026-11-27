import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleOffline, bundleStyles, pageDocument, renderHome } from "./frontend.mjs";

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
await bundleStyles();
const [client, home, css] = await Promise.all([bundleOffline(), renderHome(images), read("dist/client/styles.css")]);
const embeddedStyles = css.replace(/url\("\/assets\/([^"]+)"\)/g, (_, file) => 'url("' + assets[file] + '")');
const theme = (await read("public/theme.js")).replace(/<\/script/gi, "<\\/script");
const html = pageDocument({
  themeScript: "<script>\n" + theme + "\n</script>",
  home,
  icon: images["astratravel.svg"],
  styles: "<style>\n" + embeddedStyles + "\n</style>",
  // Every photo travels inside the file, so all cities show their pictures when it is opened from disk.
  script: '<script type="application/json" id="astra-assets">' + JSON.stringify(images).replace(/</g, "\\u003c") + "</script>\n"
    + "<script>\n" + client.replace(/<\/script/gi, "<\\/script") + "\n</script>",
});

const output = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("public/index.html", source));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log("Saved interactive React demo to " + output);
