import { legal } from "../../data/legal.js";
import { useTravel } from "../shared/context";
import { PageHeader } from "../shared/ui";

/** #privacy and #terms, in the visitor's language (texts in data/legal.js). */
export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { language } = useTravel();
  const text = legal[kind][language];
  return <>
    <PageHeader eyebrow="AstraTravel" title={text.title} lead={text.lead} />
    <article className="legal glass">
      {text.sections.map((section) => <section key={section.heading}>
        <h2>{section.heading}</h2>
        {section.body.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
      </section>)}
      <p className="muted">{text.updated}</p>
    </article>
  </>;
}
