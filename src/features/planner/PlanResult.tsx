import { cityById, placeById, placeMap } from "../../../data/catalog.js";
import { useTravel } from "../../shared/context";
import type { Plan } from "../../shared/model";
import { CategoryIcon, Icon, PlaceImage } from "../../shared/ui";

/** The generated plan: one glass card per day, each a timeline from 10:00, with a download. */
export function PlanResult({ plan }: { plan: Plan }) {
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
      <button className="button" type="button" onClick={download}><Icon name="download" size={18} />{t("download")}</button>
    </div>
    {plan.overview && <p>{plan.overview}</p>}
    {plan.days.map((day, index) => <article key={index} className="day-card glass">
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
