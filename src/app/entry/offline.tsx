import { createRoot } from "react-dom/client";
import { planRoute, validateRequest } from "../../../lib/planner.mjs";
import { App } from "../App";
import type { Api, Plan, Session } from "../../shared/model";

// The offline demo has no accounts and no AI: the planner works in the browser, the chat says "after signing in".
function session(): Session {
  return { mode: "offline", ai: false, user: null };
}

const offlineApi = (async (route, body) => {
  if (route === "session") return session();
  if (route !== "plan") throw new Error("unauthorized");
  const preferences = validateRequest(body);
  if (!preferences) throw new Error("invalid_input");
  const plan = planRoute(preferences);
  if (!plan) throw new Error("no_plan");
  return plan as Plan;
}) satisfies (route: Parameters<Api>[0], body: Parameters<Api>[1]) => Promise<Session | Plan>;

document.documentElement.classList.add("js");

const container = document.getElementById("root");
if (!container) throw new Error("AstraTravel root element is missing");
// The demo file carries every photo as a data URL (demo.mjs); pictures already in the markup count too.
const assets: Record<string, string> = (() => {
  try { return JSON.parse(document.getElementById("astra-assets")?.textContent ?? "{}") as Record<string, string>; } catch { return {}; }
})();
for (const image of container.querySelectorAll<HTMLImageElement>("img[data-asset]")) {
  const name = image.dataset.asset;
  const url = image.getAttribute("src");
  if (name && url) assets[name] = url;
}
createRoot(container).render(<App api={offlineApi as Api} assets={assets} offline />);
