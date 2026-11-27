import { useEffect } from "react";
import { budgets, cities, cityById, places, placeById } from "../../data/catalog.js";
import { dayCount } from "../../data/i18n.js";
import { CityLens, MAP_POINTS } from "../components/ui/city-lens";
import { useLensLabels } from "../features/planner/lens";
import { MyRoute } from "../features/planner/MyRoute";
import { PlanResult } from "../features/planner/PlanResult";
import { useTravel } from "../shared/context";
import { tripCity } from "../shared/geo";
import type { Category, Language, Plan, PlanInputs } from "../shared/model";
import { CategoryIcon, EmptyState, GlassIcon, Icon, PageHeader, Section, SelectField } from "../shared/ui";

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
  /** Opens the Astra AI chat with this city and the visitor's route. */
  onAsk: () => void;
  /** Where the live map starts the taxi pickup: the local visitor's district. */
  start?: { x: number; y: number };
};

/** Route: the visitor's own route first, then a ready-made plan for the days, then (in Almaty) the live map. */
export function PlannerPage({ signedIn, inputs, onInput, plan, planning, issue, aiPending, aiAvailable, onPlan, onAiPlan, onAsk, start }: Props) {
  const { t, language, money, errorText, local, preferences, updatePreferences, saved } = useTravel();
  const labels = useLensLabels();
  const city = tripCity(preferences);
  // Open with a plan instead of an empty column: build one on arrival and whenever the city changes.
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
    <PageHeader eyebrow={<><Icon name="route" size={14} />{t("planner")} · {local(cityById[city].name)}</>} title={t("plannerTitle")} lead={t("plannerPromoBody")} />

    <Section id="my-route" title={t("myRoute")} count={saved.route.length || undefined}>
      <MyRoute />
    </Section>

    <Section id="ready-plan" title={t("readyPlan")}>
      <div className="planner-layout">
        <div className="planner-side">
          <form className="planner-form glass" onSubmit={(event) => { event.preventDefault(); onPlan(); }}>
            <h3>{t("tripSettings")}</h3>
            <fieldset disabled={planning}>
              <SelectField id="plan-city" label={t("cityLabel")} value={city} icon="pin" onChange={(value) => updatePreferences({ city: value })}>
                {cities.map((item) => <option key={item.id} value={item.id}>{local(item.name)}</option>)}
              </SelectField>
              <div className="field"><span className="field-label" id="days-label">{t("days")}</span>
                <div className="segmented" role="radiogroup" aria-labelledby="days-label">
                  {[1, 2, 3].map((count) => <label key={count}>
                    <input type="radio" name="days" value={count} checked={inputs.days === count} onChange={() => onInput({ ...inputs, days: count })} />
                    <span>{dayCount(count, language)}</span>
                  </label>)}
                </div>
              </div>
              <div className="field"><span className="field-label" id="budget-label">{t("budget")}</span>
                <div className="segmented" role="radiogroup" aria-labelledby="budget-label">
                  {(Object.keys(budgets) as (keyof typeof budgets)[]).map((budget) => <label key={budget}>
                    <input type="radio" name="budget" value={budget} checked={inputs.budget === budget} onChange={() => onInput({ ...inputs, budget })} />
                    <span><strong>{budgetNames[budget][language]}</strong><small>{money(budgets[budget])}</small></span>
                  </label>)}
                </div>
              </div>
              <div className="field"><span className="field-label" id="interests-label">{t("interests")}</span>
                <div className="chips" role="group" aria-labelledby="interests-label">
                  {interests.map((interest) => <label key={interest} className="chip chip-check">
                    <input type="checkbox" name="interest" value={interest} checked={inputs.interests.includes(interest)}
                      onChange={(event) => onInput({ ...inputs, interests: event.target.checked
                        ? [...inputs.interests, interest] : inputs.interests.filter((item) => item !== interest) })} />
                    <span className="chip-content"><CategoryIcon category={interest} size={17} />{t(interest)}</span>
                  </label>)}
                </div>
              </div>
              <button className="button button-primary button-wide" type="submit"><Icon name="route" size={18} />{t("makePlan")}</button>
              {issue != null && <p className="form-error" role="alert">{errorText(issue)}</p>}
            </fieldset>
          </form>
          <div className="ai-card glass">
            <GlassIcon name="sparkles" tone="accent" />
            <div><h3>{t("aiTitle")}</h3><p>{t(aiAvailable ? "aiBody" : "aiUnavailable")}</p></div>
            {aiAvailable && <button type="button" className={"button" + (signedIn ? " button-primary" : "")} disabled={planning} onClick={onAiPlan}>
              <Icon name="sparkles" size={17} />{t(planning ? "planning" : signedIn ? "aiButton" : "aiTry")}
            </button>}
            {aiAvailable && <button type="button" className="button" onClick={onAsk}><Icon name="sparkles" size={17} />{t("askAstra")}</button>}
            {aiPending && <p className="note" role="status"><Icon name="info" size={16} />{t("aiPending")}</p>}
          </div>
        </div>
        <div id="plan-output" aria-live="polite" aria-busy={planning}>
          {planning ? <EmptyState icon="sparkles" title={t("planning")} /> : plan ? <PlanResult plan={plan} /> :
            <EmptyState icon="route" title={t("planEmpty")} description={t("planEmptyBody")} />}
        </div>
      </div>
    </Section>

    {city === "almaty" && <Section id="lens" className="lens-section" title={t("lensTitle")}>
      <p className="section-lead">{t("lensIntro")}</p>
      <CityLens places={lensPlaces} labels={labels} highlight={order} start={start} />
    </Section>}
  </>;
}
