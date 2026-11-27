import { createRoot } from "react-dom/client";
import { App } from "../App";

// Animations that start hidden only run when JavaScript is here to finish them.
document.documentElement.classList.add("js");

const container = document.getElementById("root");
if (!container) throw new Error("AstraTravel root element is missing");
createRoot(container).render(<App />);

// Installable app shell with offline support, served over HTTPS (or localhost while developing).
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}
