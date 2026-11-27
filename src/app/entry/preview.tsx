import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../App";

export function previewMarkup(assets?: Record<string, string>) {
  return renderToStaticMarkup(<App assets={assets} offline={Boolean(assets)} />);
}
