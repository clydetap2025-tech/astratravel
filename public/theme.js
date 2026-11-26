// Applies the saved theme before the first paint, so a dark choice never flashes light.
// "system" (or nothing saved) leaves the attribute off and the CSS follows prefers-color-scheme.
try {
  var theme = localStorage.getItem("astratravel.theme");
  if (theme === "\"dark\"" || theme === "\"light\"") document.documentElement.setAttribute("data-theme", JSON.parse(theme));
} catch (error) { /* Storage can be disabled. */ }
