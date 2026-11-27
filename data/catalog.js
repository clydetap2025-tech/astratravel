import { cities, cityById, landmarks } from "./kazakhstan.js";
import { eateries } from "./eateries.js";

export { cities, cityById };
export const languages = { ru: "Русский", kk: "Қазақша", en: "English", ja: "日本語" };
export const locales = { ru: "ru-KZ", kk: "kk-KZ", en: "en-GB", ja: "ja-JP" };
export const origins = ["KZ", "JP", "CN", "KR", "UZ", "KG", "RU", "TR", "IN", "DE", "FR", "GB", "US", "OTHER"];
export const categories = ["nature", "food", "culture", "city"];
export const budgets = { light: 9000, standard: 18000, flexible: 32000 };
/** @param {string} ru @param {string} kk @param {string} en @param {string} ja */
export const localize = (ru, kk, en, ja) => ({ ru, kk, en, ja });
const l = localize;

const almaty = l("Алматы", "Алматы", "Almaty", "アルマトイ");
const region = l("Алматинская область", "Алматы облысы", "Almaty Region", "アルマトイ州");
const almatyGuide = "https://kazakhstan.travel/en/regions/almaty";
const regionGuide = "https://kazakhstan.travel/en/news/things-to-do-in-almaty-region";

const addressCheck = l(
  "Адрес и часы взяты из открытых карт. Проверьте их перед визитом.",
  "Мекенжай мен жұмыс уақыты ашық карталардан алынды. Барар алдында тексеріңіз.",
  "Address and hours come from open map listings. Check them before you go.",
  "住所と営業時間は公開地図の情報です。訪問前にご確認ください。"
);

// Costs in KZT are estimates for the demo itinerary, including travel for the day trips.
const almatyPlaces = [
  {
    id: "charyn", category: "nature", zone: "daytrip", minutes: 540, cost: 15000,
    title: l("Чарынский каньон", "Шарын шатқалы", "Charyn Canyon", "チャリン・キャニオン"),
    location: region, address: l("Долина замков, Чарынский нацпарк", "Қамалдар аңғары, Шарын ұлттық паркі", "Valley of Castles, Charyn National Park", "チャリン国立公園・城の谷"),
    summary: l(
      "Тропа по Долине замков между рыжими скалами и открытыми смотровыми площадками.",
      "Қызыл жартастар мен көрініс алаңдарының арасындағы Қамалдар аңғарының соқпағы.",
      "Follow the Valley of Castles trail past rust-red cliffs and open viewpoints.",
      "赤い断崖と展望台を巡る「城の谷」のトレイル。"
    ),
    tip: l("Выделите день на дорогу и прогулку. Возьмите воду и скачайте карту заранее.", "Жолға және серуенге бір күн бөліңіз. Су алып, картаны алдын ала жүктеңіз.", "Set aside a full day. Bring water and download a map before leaving.", "移動を含めて丸一日を確保しましょう。水を持ち、事前に地図を保存してください。"),
    map: "Charyn Canyon Valley of Castles Kazakhstan", source: regionGuide,
  },
  {
    id: "kolsai", category: "nature", zone: "daytrip", minutes: 600, cost: 20000, match: ["KG"],
    title: l("Кольсайские озёра", "Көлсай көлдері", "Kolsai Lakes", "コルサイ湖群"),
    location: region, address: l("Нижнее Кольсайское озеро, рядом с селом Саты", "Төменгі Көлсай көлі, Саты ауылының маңы", "Lower Kolsai Lake, near Saty", "サティ村近くの下コルサイ湖"),
    summary: l(
      "Горные озёра среди елей Тянь-Шаня. Начните с прогулки у нижнего озера.",
      "Тянь-Шань шыршаларының арасындағы көлдер. Серуенді төменгі көлден бастаңыз.",
      "Mountain lakes among Tian Shan spruces. Start with a walk by the lower lake.",
      "天山山脈のトウヒ林に囲まれた湖。まずは下コルサイ湖畔の散策から。"
    ),
    tip: l("Связь может быть нестабильной. Сохраните карту и маршрут до выезда из Алматы.", "Байланыс тұрақсыз болуы мүмкін. Алматыдан шықпай тұрып карта мен бағытты сақтаңыз.", "Reception can be unreliable. Save the map and itinerary before leaving Almaty.", "電波が不安定な場合があります。アルマトイ出発前に地図と旅程を保存しましょう。"),
    map: "Lower Kolsai Lake Saty Kazakhstan", source: regionGuide,
  },
  {
    id: "shymbulak", category: "nature", zone: "mountains", minutes: 240, cost: 8000, match: ["US"],
    title: l("Шымбулак", "Шымбұлақ", "Shymbulak", "シムブラク"),
    location: almaty, address: l("Малоалматинское ущелье, подъём от Медеу", "Кіші Алматы шатқалы, Медеуден көтерілу", "Little Almaty Gorge, lift from Medeu", "小アルマトイ渓谷、メデウからロープウェイ"),
    summary: l(
      "Поднимитесь по канатной дороге от Медеу за панорамой Заилийского Алатау.",
      "Іле Алатауының көрінісі үшін Медеуден аспалы жолмен көтеріліңіз.",
      "Ride the gondola from Medeu for views over the Trans-Ili Alatau.",
      "メデウからゴンドラに乗って、トランスイリ・アラタウの山並みへ。"
    ),
    tip: l("Перед поездкой проверьте погоду и работу канатной дороги на сайте курорта.", "Барар алдында курорт сайтынан ауа райы мен аспалы жолдың жұмысын тексеріңіз.", "Check the resort website for weather and lift operations before you go.", "出発前にリゾートの公式サイトで天気とリフトの運行状況を確認してください。"),
    map: "Shymbulak Mountain Resort Almaty", source: "https://shymbulak.com/",
  },
  {
    id: "ramen77", category: "food", zone: "center", minutes: 75, cost: 5000, match: ["JP"],
    title: l("Ramen 77", "Ramen 77", "Ramen 77", "Ramen 77"),
    location: almaty, address: l("ул. Кабанбай батыра, 77", "Қабанбай батыр көшесі, 77", "77 Kabanbay Batyr Street", "カバンバイ・バトゥル通り77番"),
    summary: l(
      "Японское кафе в центре Алматы. Можно зайти на рамен и закуски после прогулки.",
      "Алматы орталығындағы жапон кафесі. Серуеннен кейін рамен мен тіскебасарға соғыңыз.",
      "A Japanese café in central Almaty, handy for ramen and snacks after a walk.",
      "アルマトイ中心部の日本食カフェ。散策のあとにラーメンや軽食を。"
    ),
    tip: l("Рядом парк Панфилова: удобно объединить обед и прогулку.", "Панфилов саябағы жақын: түскі ас пен серуенді бірге жоспарлауға болады.", "Pair it with a visit to nearby Panfilov Park.", "近くのパンフィロフ公園の散策と組み合わせやすい場所です。"),
    map: "Ramen 77 Kabanbay Batyr 77 Almaty", source: "https://yandex.com/maps/org/ramen77/234938320959/",
  },
  {
    id: "bazaar", category: "food", zone: "center", minutes: 60, cost: 1000, match: ["OTHER"],
    title: l("Зелёный базар", "Көк базар", "Green Bazaar", "グリーン・バザール"),
    location: almaty, address: l("ул. Жибек Жолы, 53", "Жібек жолы көшесі, 53", "53 Zhibek Zholy Street", "ジベク・ジョリ通り53番"),
    summary: l(
      "Городской рынок с сухофруктами, специями и местными продуктами.",
      "Кептірілген жеміс, дәмдеуіштер және жергілікті өнімдер сатылатын қалалық базар.",
      "The city's market for dried fruits, spices and local produce.",
      "ドライフルーツ、香辛料、地元の食材がそろう市内の市場。"
    ),
    tip: l("Можно совместить с прогулкой по парку Панфилова в тот же день.", "Осы күні Панфилов саябағына да баруға болады.", "Combine it with a walk through Panfilov Park on the same day.", "同じ日にパンフィロフ公園の散策も楽しめます。"),
    map: "Green Bazaar Zhibek Zholy Almaty", source: almatyGuide,
  },
  {
    id: "cathedral", category: "culture", zone: "center", minutes: 50, cost: 0, match: ["RU"],
    title: l("Вознесенский собор", "Вознесенск кафедралды соборы", "Ascension Cathedral", "昇天大聖堂"),
    location: almaty, address: l("Парк 28 гвардейцев-панфиловцев", "28 гвардияшы-панфиловшылар саябағы", "Park of 28 Panfilov Guardsmen", "28人のパンフィロフ戦士公園"),
    summary: l(
      "Деревянный собор с цветными куполами в тенистом парке в центре города.",
      "Қала орталығындағы көлеңкелі саябақта түрлі түсті күмбездері бар ағаш собор.",
      "A wooden cathedral with colourful domes in a leafy city-centre park.",
      "市内中心部の緑豊かな公園にある、色鮮やかなドームの木造聖堂。"
    ),
    tip: l("Оставьте время на прогулку по парку и проверьте условия посещения внутри.", "Саябақта серуендеуге уақыт қалдырып, ішке кіру шарттарын тексеріңіз.", "Leave time for the park and check visitor rules before entering the cathedral.", "公園の散策時間も取り、聖堂内に入る前に見学ルールを確認しましょう。"),
    map: "Ascension Cathedral Panfilov Park Almaty", source: almatyGuide,
  },
  {
    id: "kok-tobe", category: "city", zone: "hill", minutes: 120, cost: 4500,
    title: l("Кок-Тобе", "Көктөбе", "Kok Tobe", "コクトベ"),
    location: almaty, address: l("Гора Кок-Тобе, станция канатной дороги на пр. Достык", "Көктөбе, Достық даңғылындағы аспалы жол бекеті", "Kok Tobe hill, cable car station on Dostyk Avenue", "コクトベの丘、ドスティク大通りのロープウェイ駅"),
    summary: l(
      "Вид на Алматы и горы со смотровых площадок на холме.",
      "Төбедегі көрініс алаңдарынан Алматы мен таулар көрінеді.",
      "Look out over Almaty and the mountains from the hilltop viewpoints.",
      "丘の上の展望台からアルマトイの街と山並みを一望できます。"
    ),
    tip: l("В ясную погоду запланируйте прогулку ближе к закату.", "Ашық күнде күн батар алдында серуендеңіз.", "On a clear day, plan your visit for late afternoon.", "晴れた日なら、夕方の訪問がおすすめです。"),
    map: "Kok Tobe Cable Car Almaty Dostyk", source: almatyGuide,
  },
  {
    id: "rodem", category: "food", zone: "center", minutes: 75, cost: 4800, match: ["KR"],
    title: l("Rodem", "Rodem", "Rodem", "Rodem"),
    location: almaty, address: l("пр. Абылай хана, 64", "Абылай хан даңғылы, 64", "64 Abylai Khan Avenue", "アブライ・ハン大通り64番"),
    summary: l(
      "Корейское кафе рядом с пешеходной частью Жибек Жолы.",
      "Жібек жолының жаяу жүргінші бөлігіне жақын корей кафесі.",
      "A Korean café near the pedestrian section of Zhibek Zholy.",
      "ジベク・ジョリの歩行者エリア近くにある韓国料理カフェ。"
    ),
    tip: l("Удобная остановка на обед во время прогулки по центру.", "Қала орталығында серуендегенде түскі асқа ыңғайлы аялдама.", "A convenient lunch stop on a walk through the centre.", "中心街の散策中にランチで立ち寄りやすい場所です。"),
    map: "Rodem Abylai Khan 64 Almaty", source: "https://wikicity.kz/en/biz/rodem-almaty",
  },
  {
    id: "navat", category: "food", zone: "center", minutes: 80, cost: 6000, match: ["KZ", "UZ", "KG", "OTHER"],
    title: l("Navat", "Navat", "Navat", "Navat"),
    location: almaty, address: l("пр. Достык, 48", "Достық даңғылы, 48", "48 Dostyk Avenue", "ドスティク大通り48番"),
    summary: l(
      "Чайхана с блюдами Центральной Азии на проспекте Достык.",
      "Достық даңғылындағы Орталық Азия тағамдарын ұсынатын шайхана.",
      "A Dostyk Avenue teahouse serving Central Asian dishes.",
      "ドスティク大通りで中央アジア料理を楽しめるチャイハナ。"
    ),
    tip: l("Посмотрите актуальное меню филиала на сайте ресторана.", "Мейрамхана сайтынан филиалдың қазіргі мәзірін қараңыз.", "Check this branch's current menu on the restaurant website.", "最新のメニューはレストランの公式サイトで確認できます。"),
    map: "Navat Dostyk 48 Almaty", source: "https://eng.navat.kz/",
  },
  {
    id: "lanzhou", category: "food", zone: "center", minutes: 60, cost: 3500, match: ["CN"],
    title: l("Lanzhou", "Lanzhou", "Lanzhou", "Lanzhou"),
    location: almaty, address: l("пр. Жибек Жолы, 65а", "Жібек жолы көшесі, 65а", "65A Zhibek Zholy Street", "ジベク・ジョリ通り65A番"),
    summary: l(
      "Китайская лапшичная рядом с Зелёным базаром.",
      "Көк базарға жақын қытай кеспе кафесі.",
      "A Chinese noodle café near Green Bazaar.",
      "グリーン・バザール近くの中国麺料理店。"
    ),
    tip: l("Можно запланировать обед после утренней прогулки по базару.", "Базарды таңертең аралаған соң түскі ас ішіңіз.", "Stop for lunch after a morning at the market.", "朝に市場を見て回ったあと、ランチに立ち寄れます。"),
    map: "Lanzhou Zhibek Zholy 65A Almaty", source: "https://wikicity.kz/en/biz/lanzhou-almaty",
  },
  // Themed cafés for visitors from countries without a match above. Addresses come from open map
  // listings and venue pages; the demo has no photos for them, so cards draw a sketch cover instead.
  {
    id: "tandoor", category: "food", zone: "center", minutes: 75, cost: 6000, match: ["IN"], photo: false,
    title: l("Tandoor", "Tandoor", "Tandoor", "Tandoor"),
    location: almaty, address: l("ул. Толе би, 102", "Төле би көшесі, 102", "102 Tole Bi Street", "トレ・ビ通り102番"),
    summary: l(
      "Индийская кухня в центре: тандыр, карри и свежий наан.",
      "Орталықтағы үнді асханасы: тандыр, карри және жаңа піскен наан.",
      "Indian cooking in the centre: tandoor dishes, curries and fresh naan.",
      "中心街のインド料理店。タンドール料理、カレー、焼きたてのナン。"
    ),
    tip: addressCheck,
    map: "Tandoor Tole Bi 102 Almaty", source: "https://wanderon.in/blogs/tandoor-indian-restaurant-almaty",
  },
  {
    id: "sadik-usta", category: "food", zone: "center", minutes: 75, cost: 5500, match: ["TR"], photo: false,
    title: l("Sadık Usta", "Sadık Usta", "Sadık Usta", "Sadık Usta"),
    location: almaty, address: l("ул. Серке Кожамкулова, 211", "Серке Қожамқұлов көшесі, 211", "211 Serke Kozhamkulov Street", "セルケ・コジャムクロフ通り211番"),
    summary: l(
      "Турецкая кухня: кебабы, выпечка и чай в тюльпановидных стаканах.",
      "Түрік асханасы: кебаб, тоқаш және қызғалдақ тәрізді стақандағы шай.",
      "Turkish cooking: kebabs, pastries and tea in tulip glasses.",
      "トルコ料理。ケバブ、焼き菓子、チューリップ型グラスのチャイ。"
    ),
    tip: addressCheck,
    map: "Sadik Usta Kozhamkulov 211 Almaty", source: "https://yandex.com/maps/org/sadik_usta/41328491458/",
  },
  {
    id: "line-brew", category: "food", zone: "center", minutes: 90, cost: 9000, match: ["DE", "US"], photo: false,
    title: l("Line Brew", "Line Brew", "Line Brew", "Line Brew"),
    location: almaty, address: l("пр. Назарбаева, 128", "Назарбаев даңғылы, 128", "128 Nazarbayev Avenue", "ナザルバエフ大通り128番"),
    summary: l(
      "Пивной ресторан с гриль-меню. Хорошо после дня в горах.",
      "Гриль мәзірі бар сыра мейрамханасы. Таудағы күннен кейін жақсы.",
      "A beer hall with a grill menu. Good after a day in the mountains.",
      "グリルメニューのあるビアレストラン。山で過ごした一日の締めに。"
    ),
    tip: addressCheck,
    map: "Line Brew Nazarbayev 128 Almaty", source: "https://en.line-group.kz/line_brew",
  },
  {
    id: "ami", category: "food", zone: "center", minutes: 60, cost: 4500, match: ["FR"], photo: false,
    title: l("Ami", "Ami", "Ami", "Ami"),
    location: almaty, address: l("ул. Кабанбай батыра, 79", "Қабанбай батыр көшесі, 79", "79 Kabanbay Batyr Street", "カバンバイ・バティル通り79番"),
    summary: l(
      "Французское кафе со своей пекарней: круассаны и кофе на завтрак.",
      "Өз наубайханасы бар француз кафесі: таңғы асқа круассан мен кофе.",
      "A French café with its own bakery: croissants and coffee for breakfast.",
      "自家製パンのフレンチカフェ。朝食にクロワッサンとコーヒーを。"
    ),
    tip: addressCheck,
    map: "Ami cafe Kabanbay Batyr 79 Almaty", source: "https://wolt.com/en/kaz/almaty/restaurant/ami1",
  },
  {
    id: "shakespeare", category: "food", zone: "center", minutes: 90, cost: 8000, match: ["GB", "US"], photo: false,
    title: l("Shakespeare Pub", "Shakespeare Pub", "Shakespeare Pub", "Shakespeare Pub"),
    location: almaty, address: l("пр. Достык, 40", "Достық даңғылы, 40", "40 Dostyk Avenue", "ドスティク大通り40番"),
    summary: l(
      "Паб в английском стиле на проспекте Достык.",
      "Достық даңғылындағы ағылшын стиліндегі паб.",
      "An English-style pub on Dostyk Avenue.",
      "ドスティク大通りにある英国風パブ。"
    ),
    tip: addressCheck,
    map: "Shakespeare Pub Dostyk 40 Almaty", source: "https://www.google.com/maps/search/?api=1&query=Shakespeare%20Pub%20Dostyk%2040%20Almaty",
  },
  {
    id: "dadiani", category: "food", zone: "center", minutes: 90, cost: 8000, match: ["RU"], photo: false,
    title: l("Dadiani", "Dadiani", "Dadiani", "Dadiani"),
    location: almaty, address: l("ул. Кабанбай батыра, 37", "Қабанбай батыр көшесі, 37", "37 Kabanbay Batyr Street", "カバンバイ・バティル通り37番"),
    summary: l(
      "Грузинский ресторан: хинкали, хачапури и вино.",
      "Грузин мейрамханасы: хинкали, хачапури және шарап.",
      "A Georgian restaurant: khinkali, khachapuri and wine.",
      "ジョージア料理店。ヒンカリ、ハチャプリ、ワイン。"
    ),
    tip: addressCheck,
    map: "Dadiani Kabanbay Batyr 37 Almaty", source: "https://visitalmaty.kz/?p=6888",
  },
];

/** Every place in the guide: the photographed Almaty catalogue first, then landmarks across the country, then cafés and restaurants in the other cities. */
export const places = [...almatyPlaces.map((place) => ({ ...place, city: "almaty" })), ...landmarks, ...eateries];

export const placeById = Object.fromEntries(places.map((place) => [place.id, place]));

/** Places in one city ("all" for the whole country), matches for the visitor's country first. */
export function recommend(origin, city = "almaty") {
  return places.filter((place) => city === "all" || place.city === city).sort((first, second) => Number(second.match?.includes(origin) ?? false) - Number(first.match?.includes(origin) ?? false));
}

/** Places matched to a country of origin, home cuisine first. Every origin in `origins` has at least one. */
export function picksFor(origin) {
  return places.filter((place) => place.city === "almaty" && place.match?.includes(origin))
    .sort((first, second) => Number(second.category === "food") - Number(first.category === "food"));
}

/** For locals: day trips out of the city, mountains first when they like nature. */
export const weekendEscapes = ["charyn", "kolsai", "shymbulak"];

/** For locals: cafés that bring another country's kitchen to Almaty. */
export function worldKitchens() {
  const home = new Set(["KZ", "UZ", "KG", "OTHER"]);
  return places.filter((place) => place.category === "food" && place.match?.some((code) => !home.has(code)));
}

/** Places worth seeing whatever the visitor's country: shown next to the personal picks. */
export const mustSee = ["kok-tobe", "bazaar", "shymbulak"];

export function placeMap(place) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.map);
}
