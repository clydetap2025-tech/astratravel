import { useEffect, useMemo } from "react";
import { budgets, cities, cityById, places, placeById, placeMap } from "../data/catalog.js";
import { dayCount, fill, tr } from "../data/i18n.js";
import { CityLens, MAP_POINTS } from "./components/ui/city-lens";
import type { CityLensLabels } from "./components/ui/city-lens";
import { Icon } from "./Icon";
import type { Category, Language, Plan, PlanInputs } from "./model";
import { CategoryIcon, EmptyState, PlaceImage, SelectField, useTravel } from "./ui";
import { tripCity } from "./Welcome";

const interests: Category[] = ["nature", "food", "culture", "city"];
export const initialPlanInputs: PlanInputs = { days: 2, budget: "standard", interests: ["nature", "food"] };
const budgetNames = {
  light: { ru: "Эконом", kk: "Үнемді", en: "Light", ja: "エコノミー" },
  standard: { ru: "Стандарт", kk: "Стандарт", en: "Standard", ja: "スタンダード" },
  flexible: { ru: "Комфорт", kk: "Жайлы", en: "Comfort", ja: "コンフォート" },
} satisfies Record<keyof typeof budgets, Record<Language, string>>;

type Props = {
  signedIn: boolean; inputs: PlanInputs; onInput: (inputs: PlanInputs) => void;
  plan: Plan | null; planning: boolean; issue: unknown; aiPending: boolean; aiAvailable: boolean; onPlan: () => void; onAiPlan: () => void;
  /** Where the live map starts the taxi pickup: the local visitor's district. */
  start?: { x: number; y: number };
};

const lensText = {
  districts: {
    almaly: { ru: "Алмалинский", kk: "Алмалы", en: "Almaly", ja: "アルマリ" },
    medeu: { ru: "Медеуский", kk: "Медеу", en: "Medeu", ja: "メデウ" },
    bostandyk: { ru: "Бостандыкский", kk: "Бостандық", en: "Bostandyk", ja: "ボスタンディク" },
    zhetysu: { ru: "Жетысуский", kk: "Жетісу", en: "Zhetysu", ja: "ジェティス" },
    auezov: { ru: "Ауэзовский", kk: "Әуезов", en: "Auezov", ja: "アウエゾフ" },
  },
  avenues: {
    raiymbek: { ru: "пр. Райымбека", kk: "Райымбек даң.", en: "Raiymbek Ave", ja: "ライムベク通り" },
    zhibek: { ru: "Жибек Жолы", kk: "Жібек жолы", en: "Zhibek Zholy", ja: "ジベク・ジョリ" },
    toleBi: { ru: "ул. Толе би", kk: "Төле би к.", en: "Tole Bi St", ja: "トレ・ビ通り" },
    abay: { ru: "пр. Абая", kk: "Абай даң.", en: "Abay Ave", ja: "アバイ通り" },
    satpayev: { ru: "ул. Сатпаева", kk: "Сәтбаев к.", en: "Satpayev St", ja: "サトパエフ通り" },
    alFarabi: { ru: "пр. Аль-Фараби", kk: "Әл-Фараби даң.", en: "Al-Farabi Ave", ja: "アル・ファラビ通り" },
    seifullin: { ru: "пр. Сейфуллина", kk: "Сейфуллин даң.", en: "Seifullin Ave", ja: "セイフリン通り" },
    abylai: { ru: "пр. Абылай хана", kk: "Абылай хан даң.", en: "Abylai Khan Ave", ja: "アブライ・ハン通り" },
    nazarbayev: { ru: "пр. Назарбаева", kk: "Назарбаев даң.", en: "Nazarbayev Ave", ja: "ナザルバエフ通り" },
    dostyk: { ru: "пр. Достык", kk: "Достық даң.", en: "Dostyk Ave", ja: "ドスティク通り" },
  },
  mountains: { ru: "Иле Алатау", kk: "Іле Алатауы", en: "Ile Alatau", ja: "イリ・アラタウ" },
};

function useLensLabels(): CityLensLabels {
  const { language, money } = useTravel();
  return useMemo(() => {
    const t = (key: Parameters<typeof tr>[0]) => tr(key, language);
    const pick = <K extends string>(map: Record<K, Record<Language, string>>) =>
      Object.fromEntries(Object.entries(map).map(([key, value]) => [key, (value as Record<Language, string>)[language]])) as Record<K, string>;
    return {
      pickup: t("pickup"), tapDropoff: t("tapDropoff"), rideTo: (name) => tr("rideTo", language).replace("{n}", name),
      chooseRide: t("chooseRide"), rides: [t("rideEconomy"), t("rideComfort"), t("rideMinivan")],
      nearby: (count) => fill("nearbyCars", language, count), minutes: (count) => fill("minutesShort", language, count),
      tripMinutes: (count) => fill("tripMinutes", language, count), hold: t("holdToBook"), holdHint: t("holdHint"),
      finding: t("findingDriver"), coming: t("driverComing"), here: t("driverHere"), onTrip: t("onTrip"), dropped: t("droppedOff"),
      rate: t("rateRide"), thanks: t("thanks"), cancel: t("cancel"), districts: pick(lensText.districts), avenues: pick(lensText.avenues),
      mountains: lensText.mountains[language], demo: t("lensDemo"), money,
    };
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function PlannerPage({ signedIn, inputs, onInput, plan, planning, issue, aiPending, aiAvailable, onPlan, onAiPlan, start }: Props) {
  const { t, language, money, errorText, local, preferences, updatePreferences } = useTravel();
  const labels = useLensLabels();
  const city = tripCity(preferences);
  // Open with a plan instead of an empty column: build one from the current settings on arrival
  // and whenever the city changes and the shown plan belongs to another city.
  const planCity = plan ? placeById[plan.days[0]?.placeIds[0]]?.city : undefined;
  useEffect(() => {
    if (!planning && (!plan || planCity !== city)) onPlan();
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = plan ? plan.days.flatMap((day) => day.placeIds) : [];
  const lensPlaces = places.filter((place) => MAP_POINTS[place.id]).map((place) => ({
    id: place.id, label: local(place.title), icon: <CategoryIcon category={place.category} size={14} />,
    number: order.includes(place.id) ? order.indexOf(place.id) + 1 : undefined,
  }));
  return <>
    <section className="screen-cover planner-cover">
      <p className="eyebrow">{t("planner")} · {local(cityById[city].name)}</p>
      <h1>{t("plannerTitle")}</h1><p>{t("plannerPromoBody")}</p>
    </section>
    <div className="planner-layout">
      <div className="planner-side">
        <form className="panel planner-form" onSubmit={(event) => { event.preventDefault(); onPlan(); }}>
          <h2>{t("tripSettings")}</h2>
          <fieldset disabled={planning}>
            <SelectField id="plan-city" label={t("cityLabel")} value={city} icon="pin" onChange={(value) => updatePreferences({ city: value })}>
              {cities.map((item) => <option key={item.id} value={item.id}>{local(item.name)}</option>)}
            </SelectField>
            <div className="field"><span id="days-label">{t("days")}</span>
              <div className="segmented" role="radiogroup" aria-labelledby="days-label">
                {[1, 2, 3].map((count) => <label key={count}>
                  <input type="radio" name="days" value={count} checked={inputs.days === count}
                    onChange={() => onInput({ ...inputs, days: count })} />
                  <span>{dayCount(count, language)}</span>
                </label>)}
              </div>
            </div>
            <div className="field"><span id="budget-label">{t("budget")}</span>
              <div className="segmented budget-segmented" role="radiogroup" aria-labelledby="budget-label">
                {(Object.keys(budgets) as (keyof typeof budgets)[]).map((budget) => <label key={budget}>
                  <input type="radio" name="budget" value={budget} checked={inputs.budget === budget}
                    onChange={() => onInput({ ...inputs, budget })} />
                  <span><strong>{budgetNames[budget][language]}</strong><small>{money(budgets[budget])}</small></span>
                </label>)}
              </div>
            </div>
            <div className="field"><span id="interests-label">{t("interests")}</span>
              <div className="pills interest-pills" role="group" aria-labelledby="interests-label">
                {interests.map((interest) => <label key={interest} className="interest-pill">
                  <input type="checkbox" name="interest" value={interest} checked={inputs.interests.includes(interest)}
                    onChange={(event) => onInput({ ...inputs, interests: event.target.checked
                      ? [...inputs.interests, interest] : inputs.interests.filter((item) => item !== interest) })} />
                  <span><CategoryIcon category={interest} size={17} />{t(interest)}</span>
                </label>)}
              </div>
            </div>
            <button className="button button-green" type="submit"><Icon name="route" size={19} />{t("makePlan")}</button>
            {issue != null && <p className="form-error" role="alert">{errorText(issue)}</p>}
          </fieldset>
        </form>
        <div className="panel ai-card">
          <span className="feature-icon"><Icon name="sparkles" size={22} /></span>
          <div><h2>{t("aiTitle")}</h2><p>{t(aiAvailable ? "aiBody" : "aiUnavailable")}</p></div>
          {aiAvailable && <button type="button" className={"button " + (signedIn ? "button-yellow" : "button-soft")} disabled={planning} onClick={onAiPlan}>
            <Icon name="sparkles" size={18} />{t(planning ? "planning" : signedIn ? "aiButton" : "aiTry")}
          </button>}
          {aiPending && <p className="ai-note" role="status"><Icon name="info" size={16} />{t("aiPending")}</p>}
        </div>
      </div>
      <section id="plan-output" aria-live="polite" aria-busy={planning}>
        {planning ? <EmptyState icon="sparkles" title={t("planning")} /> : plan ? <PlanResult plan={plan} /> :
          <EmptyState icon="route" title={t("planEmpty")} description={t("planEmptyBody")} />}
      </section>
    </div>
    {city === "almaty" && <section className="lens-section" aria-labelledby="lens-title">
      <div className="section-heading"><div><h2 id="lens-title">{t("lensTitle")}</h2><p>{t("lensIntro")}</p></div></div>
      <CityLens places={lensPlaces} labels={labels} highlight={order} start={start} />
    </section>}
  </>;
}

function PlanResult({ plan }: { plan: Plan }) {
  const { t, language, money, span, local, open } = useTravel();
  const dayTitle = (count: number) => language === "ja" ? count + t("day") :
    language === "kk" ? count + "-" + t("day").toLowerCase() : t("day") + " " + count;

  const planCity = cityById[placeById[plan.days[0]?.placeIds[0]]?.city ?? ""];
  const cityName = planCity ? local(planCity.name) : t("region");

  // A day of places with no listed price shows "check the price", never a misleading zero.
  const unknownIn = (ids: string[]) => ids.some((id) => placeById[id]?.cost === null);
  const dayPrice = (day: Plan["days"][number]) => day.cost ? "≈ " + money(day.cost) : unknownIn(day.placeIds) ? t("priceUnknown") : t("free");
  const unknownTotal = plan.days.some((day) => unknownIn(day.placeIds));

  function download() {
    const lines = [
      "AstraTravel · " + t("yourPlan"), cityName, t("total") + " ≈ " + money(plan.cost), t("estimateNote"), plan.overview,
    ];
    plan.days.forEach((day, index) => {
      lines.push("", dayTitle(index + 1) + " · " + span(day.minutes) + " · " + dayPrice(day));
      for (const id of day.placeIds) {
        const place = placeById[id];
        if (place) lines.push("• " + local(place.title), "  " + local(place.address), "  " + local(place.tip), "  " + placeMap(place));
      }
      if (day.note) lines.push(day.note);
    });
    const url = URL.createObjectURL(new Blob([lines.filter((line) => line !== undefined).join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "AstraTravel-" + (planCity?.name.en ?? "Kazakhstan").replace(/\s+/g, "-") + ".txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="plan-result">
    <div className="plan-result-head">
      <div><h2>{t("yourPlan")}</h2><span className="plan-mode">
        <Icon name={plan.mode === "ai" ? "sparkles" : "route"} size={15} />{t(plan.mode === "ai" ? "aiPlan" : "planLocal")}
      </span></div>
      <button className="button button-soft" type="button" onClick={download}><Icon name="download" size={18} />{t("download")}</button>
    </div>
    {plan.overview && <p>{plan.overview}</p>}
    {plan.days.map((day, index) => <article key={index} className="panel day-card">
      <div className="day-head"><h3>{dayTitle(index + 1)}</h3><span><Icon name="clock" size={16} />{span(day.minutes)} · {dayPrice(day)}</span></div>
      <ol className="timeline">{(() => {
        // A day starts at 10:00; each stop takes its visit time plus about 20 minutes to get to the next.
        let clock = 10 * 60;
        return day.placeIds.map((id) => {
          const place = placeById[id];
          if (!place) return null;
          const at = clock;
          clock += place.minutes + 20;
          return <li key={id}>
            <time className="stop-time">{String(Math.floor(at / 60) % 24).padStart(2, "0")}:{String(at % 60).padStart(2, "0")}</time>
            <PlaceImage place={place} className="stop-thumb" width={64} height={48} />
            <div>
              <button className="title-button" type="button" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>{local(place.title)}</button>
              <p><CategoryIcon category={place.category} size={14} /> {span(place.minutes)} · {local(place.address)}</p>
            </div>
          </li>;
        });
      })()}</ol>
      {day.note && <p className="day-note">{day.note}</p>}
    </article>)}
    <div className="plan-total"><strong>{t("total") + (plan.cost ? " ≈ " + money(plan.cost) : unknownTotal ? ": " + t("priceUnknown").toLowerCase() : " " + money(0))}</strong><span>{t("estimateNote")}</span>
      {plan.days.some((day) => day.placeIds.some((id) => placeById[id]?.cost === null)) && <span>{t("priceUnknownNote")}</span>}</div>
  </div>;
}
