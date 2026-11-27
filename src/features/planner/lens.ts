import { useMemo } from "react";
import { fill, tr } from "../../../data/i18n.js";
import type { CityLensLabels } from "../../components/ui/city-lens";
import { useTravel } from "../../shared/context";
import type { Language } from "../../shared/model";

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

export function useLensLabels(): CityLensLabels {
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

