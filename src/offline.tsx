import { createRoot } from "react-dom/client";
import { planRoute, validateRequest } from "../lib/planner.mjs";
import { App } from "./App";
import type { Api, Plan, Session } from "./model";

let active = false;
function session(): Session {
  return { mode: "offline", ai: false, user: active ? { username: null } : null };
}

const offlineApi = (async (route, body) => {
  if (route === "demo" || route === "logout") active = route === "demo";
  if (route === "session" || route === "demo" || route === "logout") return session();
  if (route !== "plan" || !active) throw new Error("unauthorized");
  const preferences = validateRequest(body);
  if (!preferences) throw new Error("invalid_input");
  const plan = planRoute(preferences);
  if (!plan) throw new Error("no_plan");
  return plan as Plan;
}) satisfies (route: Parameters<Api>[0], body: Parameters<Api>[1]) => Promise<Session | Plan>;

document.documentElement.classList.add("js");

const container = document.getElementById("root");
if (!container) throw new Error("AstraTravel root element is missing");
const assets: Record<string, string> = {};
for (const image of container.querySelectorAll<HTMLImageElement>("img[data-asset]")) {
  const name = image.dataset.asset;
  const url = image.getAttribute("src");
  if (name && url) assets[name] = url;
}
createRoot(container).render(<App api={offlineApi as Api} assets={assets} offline />);
