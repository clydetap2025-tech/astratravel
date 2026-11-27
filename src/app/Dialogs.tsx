import { m } from "motion/react";
import { languages, places } from "../../data/catalog.js";
import { Account } from "../features/account/Account";
import { PlaceDetail } from "../features/places/PlaceCard";
import { FlightDetail } from "../features/tickets/flights";
import { useTravel } from "../shared/context";
import type { Api, Language, Modal, Page, Session } from "../shared/model";
import { spring } from "../shared/motion";
import { creditOf, GlassIcon, Icon } from "../shared/ui";

/** What the one <dialog> of the app shows. */
export function DialogContent({ modal, page, api, session, onSession, onClose, aiLimit, registrationOpen }: {
  modal: Modal; page: Page; api: Api; session: Session; onSession: (session: Session) => void; onClose: () => void;
  aiLimit: number; registrationOpen: boolean;
}) {
  const { t } = useTravel();
  return <>
    <button className="icon-button dialog-close" type="button" aria-label={t("close")} onClick={onClose}><Icon name="x" /></button>
    {modal.kind === "place" && <PlaceDetail place={modal.place} />}
    {modal.kind === "flight" && <FlightDetail flight={modal.flight} />}
    {modal.kind === "account" && <Account session={session} api={api} page={page} onChange={onSession} onClose={onClose}
      aiLimit={aiLimit} registrationOpen={registrationOpen} />}
    {modal.kind === "profile" && <LanguageDialog onClose={onClose} />}
    {modal.kind === "credits" && <CreditsDialog />}
  </>;
}

function LanguageDialog({ onClose }: { onClose: () => void }) {
  const { t, language, updatePreferences } = useTravel();
  return <div className="dialog-body">
    <GlassIcon name="globe" tone="accent" />
    <h2 id="dialog-title">{t("language")}</h2>
    <div className="segmented lang-switch" role="radiogroup" aria-label={t("language")}>
      {(Object.keys(languages) as Language[]).map((code) => <button key={code} type="button" role="radio" aria-checked={language === code}
        lang={code} onClick={() => updatePreferences({ language: code })}>
        {language === code && <m.span layoutId="lang-drop" className="segment-drop" transition={spring} aria-hidden="true" />}
        <span>{languages[code]}</span>
      </button>)}
    </div>
    <a className="button button-wide" href="#welcome" onClick={onClose}><Icon name="sparkles" size={17} />{t("restartWelcome")}</a>
  </div>;
}

/** Every photo in the guide with its author and licence (Creative Commons asks for this). */
function CreditsDialog() {
  const { t, local } = useTravel();
  const list = places.filter((place) => creditOf(place.id));
  return <div className="dialog-body">
    <GlassIcon name="camera" tone="accent" />
    <h2 id="dialog-title">{t("photoCredits")}</h2>
    <p>{t("photoCreditsBody")}</p>
    <ul className="credits-list">{list.map((place) => {
      const credit = creditOf(place.id)!;
      return <li key={place.id}><strong>{local(place.title)}</strong>
        <span><a href={credit.page} target="_blank" rel="noopener">{credit.author}</a> · {credit.license}</span></li>;
    })}</ul>
  </div>;
}
