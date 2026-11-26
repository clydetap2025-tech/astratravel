import { localize as l } from "./catalog.js";

/**
 * Almaty districts a local can pick in the welcome flow. x and y place each one on the City Lens
 * schematic (data/map-points.js uses the same 1200 × 720 space), so the live map starts the taxi
 * pickup in the visitor's own district.
 */
export const districts = [
  {
    key: "almaly", x: 470, y: 300,
    name: l("Алмалинский", "Алмалы", "Almaly", "アルマリ地区"),
    note: l("Центр: Толе би, Абылай хана, Арбат", "Орталық: Төле би, Абылай хан, Арбат", "The centre: Tole Bi, Abylai Khan, the Arbat", "中心部：トレ・ビ、アブライ・ハン、アルバト"),
  },
  {
    key: "medeu", x: 900, y: 260,
    name: l("Медеуский", "Медеу", "Medeu", "メデウ地区"),
    note: l("Достык, Кок-Тобе и дорога в горы", "Достық, Көктөбе және тауға жол", "Dostyk, Kok Tobe and the road to the mountains", "ドスティク、コクトベ、山へ続く道"),
  },
  {
    key: "bostandyk", x: 620, y: 500,
    name: l("Бостандыкский", "Бостандық", "Bostandyk", "ボスタンディク地区"),
    note: l("Аль-Фараби, Ботанический сад, предгорья", "Әл-Фараби, Ботаникалық бақ, тау бөктері", "Al-Farabi, the Botanical Garden, the foothills", "アル・ファラビ、植物園、山麓"),
  },
  {
    key: "zhetysu", x: 620, y: 170,
    name: l("Жетысуский", "Жетісу", "Zhetysu", "ジェティス地区"),
    note: l("Север города, рядом вокзал Алматы-2", "Қаланың солтүстігі, Алматы-2 вокзалы жанында", "The north of the city, near Almaty-2 station", "市の北部、アルマトイ2駅の近く"),
  },
  {
    key: "auezov", x: 220, y: 420,
    name: l("Ауэзовский", "Әуезов", "Auezov", "アウエゾフ地区"),
    note: l("Запад города, спальные микрорайоны", "Қаланың батысы, шағын аудандар", "The west of the city, residential blocks", "市の西部、住宅地"),
  },
];

export const districtByKey = Object.fromEntries(districts.map((district) => [district.key, district]));
