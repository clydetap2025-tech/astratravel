// Vercel function: every /api/* request is rewritten here (vercel.json) and handled by the app's own server code.
export { handle as default } from "../server.mjs";
