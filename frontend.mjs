import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const browserConfig = {
  absWorkingDir: projectRoot,
  bundle: true,
  jsx: "automatic",
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
};

export async function renderHome(assets) {
  await build({
    absWorkingDir: projectRoot,
    entryPoints: ["src/preview.tsx"],
    outfile: "dist/preview.mjs",
    bundle: true,
    jsx: "automatic",
    format: "esm",
    platform: "node",
    target: "node22",
    packages: "external",
  });
  const { previewMarkup } = await import(new URL("./dist/preview.mjs", import.meta.url).href);
  return previewMarkup(assets);
}

export function pageDocument({ home, icon, styles, script, preload = "", pwa = false, themeScript = '<script src="/theme.js"></script>' }) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
  <meta name="color-scheme" content="light dark">
  <meta name="format-detection" content="telephone=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="AstraTravel">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="application-name" content="AstraTravel">
  <meta name="description" content="AstraTravel — места и маршруты по городам Казахстана.">
  <title>AstraTravel — путеводитель по Казахстану</title>
  <link rel="icon" href="${icon}" type="image/svg+xml">${pwa ? `
  <link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">` : ""}
  ${themeScript}
${preload ? "  " + preload + "\n" : ""}  ${styles}
</head>
<body>
  <div id="root">${home}</div>
  <noscript>Для работы фильтров и маршрутов включите JavaScript.</noscript>
  ${script}
</body>
</html>
`;
}

export async function bundleClient() {
  const [home] = await Promise.all([
    renderHome(),
    build({ ...browserConfig, entryPoints: ["src/client.tsx"], outfile: "dist/client/app.js" }),
  ]);
  const html = pageDocument({
    home,
    icon: "/assets/astratravel.svg",
    pwa: true,
    styles: '<link rel="stylesheet" href="/styles.css">',
    script: '<script defer src="/app.js"></script>',
  });
  await writeFile(new URL("./dist/client/index.html", import.meta.url), html);
}

export async function bundleOffline() {
  const result = await build({ ...browserConfig, entryPoints: ["src/offline.tsx"], write: false });
  return result.outputFiles[0].text;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await bundleClient();
}
