import { useEffect } from "react";
import { reducedMotion } from "./model";

/**
 * One scroll listener for the whole page, batched into a single animation frame.
 *
 *  - `--scroll` on <html>: the scroll position, which moves the backdrop a little slower than the page.
 *  - `--p` on every [data-parallax] element in view: its position from -1 (above the middle of the
 *    screen) to 1 (below), which moves its `.parallax-layer` by `--depth` (styles/parallax.css).
 *
 * Only transforms change, so the browser composites without layout. Off under reduced motion and
 * on the server, where every layer simply sits in place.
 */
export function useParallax() {
  useEffect(() => {
    if (reducedMotion()) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      root.style.setProperty("--scroll", String(Math.round(window.scrollY)));
      for (const element of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
        const box = element.getBoundingClientRect();
        if (box.bottom < -200 || box.top > height + 200) continue;
        const middle = box.top + box.height / 2 - height / 2;
        const p = Math.max(-1, Math.min(1, middle / (height / 2 + box.height / 2)));
        element.style.setProperty("--p", p.toFixed(3));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById("root") ?? document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
}
