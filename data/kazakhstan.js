/**
 * Cities of Kazakhstan and their landmarks, beyond the hand-written Almaty catalogue.
 *
 * Only well-known public landmarks are listed: no cafés (their addresses could not be checked),
 * no street numbers (each place has a landmark-style "where"), and no invented prices: cost is 0
 * for public squares, parks and embankments, and null where the ticket price is unknown.
 * Every source is a Wikipedia search, so the link always leads somewhere real.
 */

/** @param {string} ru @param {string} kk @param {string} en @param {string} ja */
const l = (ru, kk, en, ja) => ({ ru, kk, en, ja });
const wiki = (query) => "https://en.wikipedia.org/w/index.php?search=" + encodeURIComponent(query);

export const checkBefore = l(
  "Часы работы, цены и доступ уточняйте перед поездкой.",
  "Жұмыс уақытын, бағаны және кіру тәртібін сапар алдында нақтылаңыз.",
  "Check opening hours, prices and access before you go.",
  "営業時間・料金・入場条件は出発前にご確認ください。"
);

/** Cities with an airport code (for the flight search) and the centre point used on maps. */
export const cities = [
  { id: "almaty", airport: "ALA", lat: 43.24, lng: 76.89, name: l("Алматы", "Алматы", "Almaty", "アルマトイ"),
    region: l("Юг, у подножия Заилийского Алатау", "Оңтүстік, Іле Алатауының етегі", "South, at the foot of the Ile Alatau", "南部、イリ・アラタウ山麓") },
  { id: "astana", airport: "NQZ", lat: 51.17, lng: 71.43, name: l("Астана", "Астана", "Astana", "アスタナ"),
    region: l("Столица на реке Есиль", "Есіл өзеніндегі елорда", "The capital on the Esil river", "エシル川沿いの首都") },
  { id: "shymkent", airport: "CIT", lat: 42.32, lng: 69.59, name: l("Шымкент", "Шымкент", "Shymkent", "シムケント"),
    region: l("Юг, ворота в Туркестанскую область", "Оңтүстік, Түркістан облысының қақпасы", "South, gateway to the Turkistan Region", "南部、トルキスタン州への玄関口") },
  { id: "turkistan", airport: "HSA", lat: 43.3, lng: 68.27, name: l("Туркестан", "Түркістан", "Turkistan", "トルキスタン"),
    region: l("Древний город на Шёлковом пути", "Жібек жолындағы көне қала", "An ancient Silk Road city", "シルクロードの古都") },
  { id: "taraz", airport: "DMB", lat: 42.9, lng: 71.37, name: l("Тараз", "Тараз", "Taraz", "タラズ"),
    region: l("Юг, один из старейших городов страны", "Оңтүстік, елдің ең көне қалаларының бірі", "South, one of the country’s oldest cities", "南部、国内最古の都市のひとつ") },
  { id: "kyzylorda", airport: "KZO", lat: 44.85, lng: 65.51, name: l("Кызылорда", "Қызылорда", "Kyzylorda", "クズロルダ"),
    region: l("Низовья Сырдарьи, рядом Байконур", "Сырдария төменгі ағысы, Байқоңыр жанында", "The lower Syr Darya, near Baikonur", "シルダリヤ川下流、バイコヌール近く") },
  { id: "aktau", airport: "SCO", lat: 43.65, lng: 51.17, name: l("Актау", "Ақтау", "Aktau", "アクタウ"),
    region: l("Каспийское побережье и Мангистау", "Каспий жағалауы және Маңғыстау", "The Caspian coast and Mangystau", "カスピ海沿岸とマンギスタウ") },
  { id: "atyrau", airport: "GUW", lat: 47.11, lng: 51.92, name: l("Атырау", "Атырау", "Atyrau", "アティラウ"),
    region: l("На реке Урал, между Европой и Азией", "Жайық бойында, Еуропа мен Азия арасында", "On the Ural, between Europe and Asia", "ウラル川沿い、ヨーロッパとアジアの間") },
  { id: "aktobe", airport: "AKX", lat: 50.28, lng: 57.17, name: l("Актобе", "Ақтөбе", "Aktobe", "アクトベ"),
    region: l("Запад, на реке Илек", "Батыс, Елек өзенінде", "West, on the Ilek river", "西部、イレク川沿い") },
  { id: "oral", airport: "URA", lat: 51.23, lng: 51.37, name: l("Уральск", "Орал", "Oral", "ウラリスク"),
    region: l("Северо-запад, на реке Урал", "Солтүстік-батыс, Жайық өзенінде", "North-west, on the Ural river", "北西部、ウラル川沿い") },
  { id: "karaganda", airport: "KGF", lat: 49.8, lng: 73.1, name: l("Караганда", "Қарағанды", "Karaganda", "カラガンダ"),
    region: l("Центр страны, шахтёрский край", "Елдің орталығы, кеншілер өлкесі", "The centre, a mining region", "中部、炭鉱の町") },
  { id: "burabay", airport: "KOV", lat: 53.08, lng: 70.3, name: l("Бурабай", "Бурабай", "Burabay", "ブラバイ"),
    region: l("Курорт у Щучинска, рейсы через Кокшетау", "Щучинск маңындағы курорт, рейстер Көкшетау арқылы", "A resort near Shchuchinsk, flights via Kokshetau", "シチュチンスク近郊のリゾート（コクシェタウ経由）") },
  { id: "pavlodar", airport: "PWQ", lat: 52.29, lng: 76.97, name: l("Павлодар", "Павлодар", "Pavlodar", "パヴロダル"),
    region: l("Северо-восток, на Иртыше", "Солтүстік-шығыс, Ертіс бойында", "North-east, on the Irtysh", "北東部、イルティシ川沿い") },
  { id: "semey", airport: "PLX", lat: 50.41, lng: 80.25, name: l("Семей", "Семей", "Semey", "セメイ"),
    region: l("Восток, город Абая", "Шығыс, Абай қаласы", "East, the city of Abai", "東部、アバイの町") },
  { id: "oskemen", airport: "UKK", lat: 49.95, lng: 82.61, name: l("Усть-Каменогорск", "Өскемен", "Oskemen", "ウスチ・カメノゴルスク"),
    region: l("Восток, у слияния Иртыша и Ульбы", "Шығыс, Ертіс пен Үлбінің қосылған жері", "East, where the Ulba joins the Irtysh", "東部、イルティシ川とウルバ川の合流点") },
  { id: "petropavl", airport: "PPK", lat: 54.87, lng: 69.15, name: l("Петропавловск", "Петропавл", "Petropavl", "ペトロパヴロフスク"),
    region: l("Север, на реке Ишим", "Солтүстік, Есіл өзенінде", "North, on the Ishim river", "北部、イシム川沿い") },
  { id: "kostanay", airport: "KSN", lat: 53.21, lng: 63.62, name: l("Костанай", "Қостанай", "Kostanay", "コスタナイ"),
    region: l("Север, на реке Тобол", "Солтүстік, Тобыл өзенінде", "North, on the Tobol river", "北部、トボル川沿い") },
];

export const cityById = Object.fromEntries(cities.map((city) => [city.id, city]));

/**
 * @param {string} id @param {string} city @param {"nature"|"food"|"culture"|"city"} category
 * @param {"center"|"outskirts"|"mountains"|"daytrip"} zone @param {number} minutes @param {number|null} cost
 * @param {string[]} title ru, kk, en, ja @param {string[]} summary @param {string[]} where @param {string} search
 */
function p(id, city, category, zone, minutes, cost, title, summary, where, search) {
  return {
    id, city, category, zone, minutes, cost, photo: false,
    title: l(...title), summary: l(...summary), address: l(...where), location: cityById[city].name, tip: checkBefore,
    map: search + ", " + cityById[city].name.en + ", Kazakhstan", source: wiki(search),
  };
}

export const landmarks = [
  // Almaty, beyond the photographed catalogue
  p("medeu", "almaty", "city", "mountains", 120, null, ["Медеу", "Медеу", "Medeu", "メデウ"],
    ["Высокогорный каток в ущелье по дороге на Шымбулак.", "Шымбұлаққа баратын жолдағы биік таулы мұз айдыны.", "A high-mountain skating rink on the road to Shymbulak.", "シムブラクへ向かう渓谷にある高山スケートリンク。"],
    ["Ущелье Малой Алматинки", "Кіші Алматы шатқалы", "Malaya Almatinka gorge", "マラヤ・アルマチンカ渓谷"], "Medeu skating rink"),
  p("big-almaty-lake", "almaty", "nature", "daytrip", 360, null, ["Большое Алматинское озеро", "Үлкен Алматы көлі", "Big Almaty Lake", "ビッグ・アルマトイ湖"],
    ["Бирюзовое горное озеро на высоте около 2500 метров.", "Шамамен 2500 метр биіктіктегі көгілдір тау көлі.", "A turquoise mountain lake at about 2,500 metres.", "標高約2,500mのターコイズ色の山の湖。"],
    ["Ущелье Большой Алматинки", "Үлкен Алматы шатқалы", "Bolshaya Almatinka gorge", "ボリシャヤ・アルマチンカ渓谷"], "Big Almaty Lake"),
  p("central-museum", "almaty", "culture", "center", 120, null, ["Центральный государственный музей", "Орталық мемлекеттік музей", "Central State Museum", "中央国立博物館"],
    ["История Казахстана от древности, в том числе копия «Золотого человека».", "Ежелгі дәуірден бергі Қазақстан тарихы, «Алтын адамның» көшірмесі де бар.", "Kazakhstan from antiquity on, including a replica of the Golden Man.", "古代からのカザフスタン史。「黄金人間」のレプリカも。"],
    ["Микрорайон Самал-1", "Самал-1 шағын ауданы", "Samal-1 district", "サマル1地区"], "Central State Museum of Kazakhstan"),
  p("tamgaly", "almaty", "culture", "daytrip", 420, null, ["Петроглифы Тамгалы", "Таңбалы петроглифтері", "Tamgaly petroglyphs", "タムガリの岩絵"],
    ["Наскальные рисунки бронзового века, объект ЮНЕСКО.", "Қола дәуірінің жартас суреттері, ЮНЕСКО нысаны.", "Bronze Age rock carvings, a UNESCO World Heritage site.", "青銅器時代の岩絵。ユネスコ世界遺産。"],
    ["Около 170 км к северо-западу от Алматы", "Алматыдан солтүстік-батысқа қарай 170 км шамасында", "About 170 km north-west of Almaty", "アルマトイの北西約170km"], "Tamgaly petroglyphs"),
  p("altyn-emel", "almaty", "nature", "daytrip", 720, null, ["Нацпарк Алтын-Эмель", "Алтынемел ұлттық паркі", "Altyn-Emel National Park", "アルティン・エメル国立公園"],
    ["Поющий бархан и цветные горы Актау в пустыне у реки Или.", "Іле өзені маңындағы шөлде Әнші құм және түрлі түсті Ақтау таулары.", "The Singing Dune and the striped Aktau hills by the Ili river.", "イリ川近くの砂漠に「歌う砂丘」と色彩豊かなアクタウ山。"],
    ["Около 250 км к северо-востоку от Алматы", "Алматыдан солтүстік-шығысқа қарай 250 км шамасында", "About 250 km north-east of Almaty", "アルマトイの北東約250km"], "Altyn-Emel National Park"),

  // Astana
  p("baiterek", "astana", "city", "center", 60, null, ["Байтерек", "Бәйтерек", "Bayterek", "バイテレク"],
    ["Башня-символ столицы со смотровой площадкой в «золотом шаре».", "Алтын шар ішіндегі көру алаңы бар елорданың символы.", "The capital’s emblem, with a viewing deck inside its golden sphere.", "首都のシンボル。金色の球体の中に展望台。"],
    ["Бульвар Нуржол", "Нұржол бульвары", "Nurzhol Boulevard", "ヌルジョル通り"], "Bayterek tower"),
  p("khan-shatyr", "astana", "city", "center", 90, 0, ["Хан Шатыр", "Хан Шатыр", "Khan Shatyr", "ハン・シャティール"],
    ["Огромный прозрачный шатёр по проекту Нормана Фостера: магазины и пляж внутри.", "Норман Фостердің жобасы бойынша салынған мөлдір шатыр: ішінде дүкендер мен жағажай.", "A vast see-through tent by Norman Foster, with shops and an indoor beach.", "ノーマン・フォスター設計の巨大なテント。店舗と屋内ビーチ。"],
    ["Западный конец бульвара Нуржол", "Нұржол бульварының батыс шеті", "West end of Nurzhol Boulevard", "ヌルジョル通りの西端"], "Khan Shatyr Entertainment Center"),
  p("hazrat-sultan", "astana", "culture", "center", 50, 0, ["Мечеть Хазрет Султан", "Әзірет Сұлтан мешіті", "Hazrat Sultan Mosque", "ハズレット・スルタン・モスク"],
    ["Одна из крупнейших мечетей Центральной Азии.", "Орталық Азиядағы ең ірі мешіттердің бірі.", "One of the largest mosques in Central Asia.", "中央アジア最大級のモスク。"],
    ["Район площади Казак Ели", "Қазақ елі алаңының маңы", "Near Kazakh Eli Square", "カザフ・エリ広場付近"], "Hazrat Sultan Mosque"),
  p("peace-palace", "astana", "culture", "center", 60, null, ["Дворец мира и согласия", "Бейбітшілік және келісім сарайы", "Palace of Peace and Reconciliation", "平和と和解の宮殿"],
    ["Стеклянная пирамида Нормана Фостера с атриумом под вершиной.", "Норман Фостердің әйнек пирамидасы, ұшар басының астында атриум бар.", "Norman Foster’s glass pyramid, with an atrium under its apex.", "ノーマン・フォスター設計のガラスのピラミッド。頂部にアトリウム。"],
    ["Район площади Казак Ели", "Қазақ елі алаңының маңы", "Near Kazakh Eli Square", "カザフ・エリ広場付近"], "Palace of Peace and Reconciliation"),
  p("nur-alem", "astana", "culture", "center", 120, null, ["Нур Алем", "Нұр Әлем", "Nur Alem", "ヌル・アレム"],
    ["Шар-павильон ЭКСПО-2017 с музеем энергии будущего.", "ЭКСПО-2017 шар-павильоны, ішінде болашақ энергиясы мұражайы.", "The EXPO 2017 sphere, now a museum of future energy.", "EXPO2017の球体パビリオン。未来エネルギー博物館。"],
    ["Территория ЭКСПО", "ЭКСПО аумағы", "EXPO grounds", "EXPO会場"], "Nur Alem"),
  p("national-museum", "astana", "culture", "center", 120, null, ["Национальный музей Казахстана", "Қазақстан Ұлттық музейі", "National Museum of Kazakhstan", "カザフスタン国立博物館"],
    ["Крупнейший музей страны: от степного золота до новейшей истории.", "Елдің ең ірі мұражайы: дала алтынынан қазіргі тарихқа дейін.", "The country’s largest museum, from steppe gold to recent history.", "国内最大の博物館。草原の黄金から現代史まで。"],
    ["Площадь Независимости", "Тәуелсіздік алаңы", "Independence Square", "独立広場"], "National Museum of the Republic of Kazakhstan"),
  p("astana-opera", "astana", "culture", "center", 150, null, ["Астана Опера", "Астана Опера", "Astana Opera", "アスタナ・オペラ"],
    ["Театр оперы и балета в классическом стиле.", "Классикалық стильдегі опера және балет театры.", "An opera and ballet house in the classical style.", "古典様式のオペラ・バレエ劇場。"],
    ["Левый берег Есиля", "Есілдің сол жағалауы", "Left bank of the Esil", "エシル川左岸"], "Astana Opera"),

  // Shymkent
  p("ordabasy-square", "shymkent", "city", "center", 40, 0, ["Площадь Ордабасы", "Ордабасы алаңы", "Ordabasy Square", "オルダバスィ広場"],
    ["Центральная площадь с монументом в честь собрания трёх жузов.", "Үш жүздің жиынына арналған монументі бар орталық алаң.", "The central square, with a monument to the gathering of the three zhuzes.", "三つのジュズの集会を記念する碑がある中央広場。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Ordabasy Square Shymkent"),
  p("shymkent-dendropark", "shymkent", "nature", "center", 90, null, ["Дендропарк", "Дендросаябақ", "Dendropark", "デンドロパーク"],
    ["Большой парк деревьев с тенистыми аллеями и прудами.", "Көлеңкелі аллеялары мен тоғандары бар үлкен ағаш саябағы.", "A large tree park with shady alleys and ponds.", "木陰の並木道と池がある広大な樹木園。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Shymkent Dendropark"),
  p("independence-park-shymkent", "shymkent", "city", "center", 60, 0, ["Парк Независимости", "Тәуелсіздік саябағы", "Independence Park", "独立公園"],
    ["Мемориальный парк для вечерней прогулки.", "Кешкі серуенге арналған мемориалдық саябақ.", "A memorial park for an evening walk.", "夕方の散歩に向く記念公園。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Independence Park Shymkent"),
  p("sayram", "shymkent", "culture", "outskirts", 240, 0, ["Сайрам", "Сайрам", "Sayram", "サイラム"],
    ["Один из древнейших городов страны, с мавзолеями и минаретом.", "Елдің ең көне қалаларының бірі, кесенелері мен мұнарасы бар.", "One of the country’s oldest towns, with mausoleums and a minaret.", "国内最古級の町。霊廟とミナレットが残る。"],
    ["Около 15 км к востоку от Шымкента", "Шымкенттен шығысқа қарай 15 км шамасында", "About 15 km east of Shymkent", "シムケントの東約15km"], "Sayram Kazakhstan"),
  p("aksu-zhabagly", "shymkent", "nature", "daytrip", 600, null, ["Заповедник Аксу-Жабаглы", "Ақсу-Жабағылы қорығы", "Aksu-Zhabagly Nature Reserve", "アクス・ジャバグリ自然保護区"],
    ["Старейший заповедник Центральной Азии: каньоны, горы, весной — тюльпаны.", "Орталық Азиядағы ең көне қорық: шатқалдар, таулар, көктемде қызғалдақтар.", "Central Asia’s oldest nature reserve: canyons, peaks and spring tulips.", "中央アジア最古の自然保護区。峡谷、山々、春のチューリップ。"],
    ["Западный Тянь-Шань, через Жабаглы", "Батыс Тянь-Шань, Жабағылы арқылы", "Western Tian Shan, via Zhabagly", "西天山、ジャバグリ経由"], "Aksu-Zhabagly Nature Reserve"),

  // Turkistan
  p("yasawi", "turkistan", "culture", "center", 90, null, ["Мавзолей Ходжи Ахмеда Ясави", "Қожа Ахмет Ясауи кесенесі", "Mausoleum of Khoja Ahmed Yasawi", "ホージャ・アフマド・ヤサウィー廟"],
    ["Памятник ЮНЕСКО конца XIV века, построенный при Тимуре.", "Әмір Темір тұсында салынған XIV ғасыр соңындағы ЮНЕСКО ескерткіші.", "A late 14th-century UNESCO monument built under Timur.", "ティムール時代に建てられた14世紀末のユネスコ世界遺産。"],
    ["Исторический центр", "Тарихи орталық", "Historic centre", "旧市街"], "Mausoleum of Khoja Ahmed Yasawi"),
  p("rabiga-begim", "turkistan", "culture", "center", 30, 0, ["Мавзолей Рабиги Султан Бегим", "Рабиға Сұлтан Бегім кесенесі", "Mausoleum of Rabiga Sultan Begim", "ラビガ・スルタン・ベギム廟"],
    ["Восстановленный мавзолей XV века рядом с комплексом Ясави.", "Ясауи кешенінің жанындағы қалпына келтірілген XV ғасыр кесенесі.", "A restored 15th-century mausoleum beside the Yasawi complex.", "ヤサウィー廟の隣にある15世紀の霊廟（復元）。"],
    ["Рядом с мавзолеем Ясави", "Ясауи кесенесінің жанында", "Next to the Yasawi mausoleum", "ヤサウィー廟の隣"], "Rabia Sultan Begim mausoleum"),
  p("karavansaray", "turkistan", "city", "center", 120, null, ["Караван-Сарай", "Керуен сарай", "Karavan Saray", "キャラバンサライ"],
    ["Туристический квартал с каналами и вечерним шоу.", "Арналары және кешкі шоуы бар туристік орам.", "A tourist quarter with canals and an evening show.", "運河と夜のショーがある観光地区。"],
    ["Рядом с историческим центром", "Тарихи орталықтың жанында", "Beside the historic centre", "旧市街の隣"], "Karavan Saray Turkistan"),
  p("arystan-bab", "turkistan", "culture", "daytrip", 300, null, ["Мавзолей Арыстан Баба", "Арыстан баб кесенесі", "Arystan Bab Mausoleum", "アリスタン・バブ廟"],
    ["Место паломничества у древнего Отрара; по традиции его посещают до Ясави.", "Көне Отырар маңындағы зиярат орны; дәстүр бойынша оған Ясауиден бұрын барады.", "A pilgrimage site near ancient Otrar, traditionally visited before Yasawi.", "古代オトラル近くの巡礼地。伝統的にヤサウィー廟より先に詣でる。"],
    ["Около 60 км к югу от Туркестана", "Түркістаннан оңтүстікке қарай 60 км шамасында", "About 60 km south of Turkistan", "トルキスタンの南約60km"], "Arystan Bab mausoleum"),
  p("otrar", "turkistan", "culture", "daytrip", 240, null, ["Городище Отрар", "Отырар қалашығы", "Otrar", "オトラル遺跡"],
    ["Руины средневекового города на Шёлковом пути.", "Жібек жолындағы ортағасырлық қаланың қирандылары.", "The ruins of a medieval Silk Road city.", "シルクロードの中世都市の遺跡。"],
    ["Рядом с мавзолеем Арыстан Баба", "Арыстан баб кесенесінің маңында", "Near the Arystan Bab mausoleum", "アリスタン・バブ廟の近く"], "Otrar"),
  p("sauran", "turkistan", "culture", "daytrip", 180, 0, ["Городище Сауран", "Сауран қалашығы", "Sauran", "サウラン遺跡"],
    ["Стены средневековой крепости посреди степи.", "Дала ортасындағы ортағасырлық бекіністің қабырғалары.", "The walls of a medieval fortress out on the steppe.", "草原に残る中世の城壁。"],
    ["Около 40 км к северо-западу от Туркестана", "Түркістаннан солтүстік-батысқа қарай 40 км шамасында", "About 40 km north-west of Turkistan", "トルキスタンの北西約40km"], "Sauran Kazakhstan"),

  // Taraz
  p("aisha-bibi", "taraz", "culture", "outskirts", 60, null, ["Мавзолей Айша-Биби", "Айша бибі кесенесі", "Aisha Bibi Mausoleum", "アイシャ・ビビ廟"],
    ["Средневековый мавзолей, весь покрытый резной терракотой.", "Түгел ою-өрнекті терракотамен қапталған ортағасырлық кесене.", "A medieval mausoleum covered in carved terracotta.", "彫刻テラコッタで覆われた中世の霊廟。"],
    ["Село Айша-Биби, около 18 км от Тараза", "Айша бибі ауылы, Тараздан 18 км шамасында", "Aisha Bibi village, about 18 km from Taraz", "アイシャ・ビビ村（タラズから約18km）"], "Aisha Bibi mausoleum"),
  p("babaji-khatun", "taraz", "culture", "outskirts", 20, 0, ["Мавзолей Бабаджи-хатун", "Бабаджа қатын кесенесі", "Babaji Khatun Mausoleum", "ババジ・ハトゥン廟"],
    ["Соседний с Айша-Биби мавзолей с ребристым куполом.", "Айша бибінің көршісі, қырлы күмбезді кесене.", "The neighbour of Aisha Bibi, with a ribbed dome.", "アイシャ・ビビの隣にある、リブ状のドームの霊廟。"],
    ["Рядом с мавзолеем Айша-Биби", "Айша бибі кесенесінің жанында", "Next to Aisha Bibi", "アイシャ・ビビ廟の隣"], "Babaji Khatun mausoleum"),
  p("karakhan", "taraz", "culture", "center", 30, 0, ["Мавзолей Карахана", "Қарахан кесенесі", "Karakhan Mausoleum", "カラハン廟"],
    ["Мавзолей в центре города, восстановленный в начале XX века.", "XX ғасырдың басында қалпына келтірілген қала орталығындағы кесене.", "A mausoleum in the city centre, rebuilt in the early 20th century.", "20世紀初頭に再建された市中心部の霊廟。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Karakhan mausoleum"),
  p("ancient-taraz", "taraz", "culture", "center", 60, null, ["Городище «Древний Тараз»", "«Ежелгі Тараз» қалашығы", "Ancient Taraz site", "古代タラズ遺跡"],
    ["Раскопки средневекового города на Шёлковом пути, прямо в центре.", "Қала орталығындағы Жібек жолының ортағасырлық қаласының қазбалары.", "Excavations of the medieval Silk Road city, right in the centre.", "市中心部にあるシルクロード中世都市の発掘現場。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Taraz ancient settlement"),

  // Kyzylorda
  p("aitbay-mosque", "kyzylorda", "culture", "center", 30, 0, ["Мечеть Айтбая", "Айтбай мешіті", "Aitbay Mosque", "アイトバイ・モスク"],
    ["Историческая мечеть в центре города.", "Қала орталығындағы тарихи мешіт.", "A historic mosque in the city centre.", "市中心部の歴史あるモスク。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Aitbay mosque Kyzylorda"),
  p("syrdarya-embankment", "kyzylorda", "city", "center", 60, 0, ["Набережная Сырдарьи", "Сырдария жағалауы", "Syr Darya embankment", "シルダリヤ川の河岸"],
    ["Прогулка вдоль Сырдарьи на закате.", "Күн батарда Сырдария бойымен серуен.", "A sunset walk along the Syr Darya.", "夕暮れのシルダリヤ川沿いの散歩。"],
    ["Берег Сырдарьи", "Сырдария жағасы", "Syr Darya riverside", "シルダリヤ川沿い"], "Kyzylorda Syr Darya embankment"),
  p("korkyt-ata", "kyzylorda", "culture", "daytrip", 480, 0, ["Мемориал Коркыт-Ата", "Қорқыт ата кешені", "Korkyt Ata Memorial", "コルキト・アタ記念碑"],
    ["Монумент в форме кобыза, который звучит на ветру.", "Желмен үн шығаратын қобыз пішінді монумент.", "A monument shaped like a kobyz that sings in the wind.", "風で鳴るコブズ形のモニュメント。"],
    ["У посёлка Жосалы", "Жосалы кентінің маңы", "Near Zhosaly", "ジョサル近郊"], "Korkyt Ata memorial"),
  p("baikonur", "kyzylorda", "city", "daytrip", 720, null, ["Космодром Байконур", "Байқоңыр ғарыш айлағы", "Baikonur Cosmodrome", "バイコヌール宇宙基地"],
    ["Первый космодром мира. Посещение только с туроператором и пропуском.", "Әлемдегі алғашқы ғарыш айлағы. Тек туроператормен және рұқсатпен кіруге болады.", "The world’s first spaceport. Visits only with a tour operator and a permit.", "世界初の宇宙基地。見学はツアーと許可証が必要。"],
    ["Город Байконыр", "Байқоңыр қаласы", "Baikonur town", "バイコヌール市"], "Baikonur Cosmodrome"),

  // Aktau and Mangystau
  p("aktau-waterfront", "aktau", "city", "center", 60, 0, ["Набережная Каспия", "Каспий жағалауы", "Caspian waterfront", "カスピ海の遊歩道"],
    ["Скалистый берег Каспийского моря и закаты прямо в городе.", "Каспий теңізінің жартасты жағасы және қала ішіндегі күн батуы.", "The rocky Caspian shore, with sunsets right in town.", "岩がちなカスピ海の海岸。市内で夕日が見られる。"],
    ["Береговая линия города", "Қаланың жағалау сызығы", "The town’s shoreline", "市の海岸線"], "Aktau Caspian embankment"),
  p("mig-monument", "aktau", "city", "center", 20, 0, ["Памятник МиГ-21", "МиГ-21 ескерткіші", "MiG-21 monument", "MiG-21記念碑"],
    ["Самолёт на постаменте над морем — городской ориентир.", "Теңіз үстіндегі тұғырдағы ұшақ — қаланың бағдары.", "A jet on a plinth above the sea, a local landmark.", "海を見下ろす台座の戦闘機。町の目印。"],
    ["Набережная", "Жағалау", "The waterfront", "海沿い"], "Aktau MiG-21 monument"),
  p("sherkala", "aktau", "nature", "daytrip", 480, null, ["Гора Шеркала", "Шерқала тауы", "Sherkala", "シェルカラ山"],
    ["Одинокая меловая гора, похожая на юрту.", "Киіз үйге ұқсайтын жалғыз бор тауы.", "A lone chalk mountain shaped like a yurt.", "ユルトのような形の孤立した白亜の山。"],
    ["Около 150 км от Актау", "Ақтаудан 150 км шамасында", "About 150 km from Aktau", "アクタウから約150km"], "Sherkala"),
  p("shakpak-ata", "aktau", "culture", "daytrip", 360, null, ["Подземная мечеть Шакпак-ата", "Шақпақ ата жерасты мешіті", "Shakpak-Ata underground mosque", "シャクパク・アタ地下モスク"],
    ["Высеченная в скале мечеть на полуострове Тюб-Караган.", "Түпқараған түбегіндегі жартасқа қашалған мешіт.", "A mosque cut into the rock on the Tupkaragan peninsula.", "トゥプカラガン半島の岩をくり抜いたモスク。"],
    ["Полуостров Тюб-Караган", "Түпқараған түбегі", "Tupkaragan peninsula", "トゥプカラガン半島"], "Shakpak Ata underground mosque"),
  p("bozzhyra", "aktau", "nature", "daytrip", 720, null, ["Урочище Бозжыра", "Бозжыра шатқалы", "Bozzhyra", "ボズジラ"],
    ["Белые останцы плато Устюрт. Нужны внедорожник и проводник.", "Үстірт қыратының ақ жартастары. Жолсыз көлік пен жолбасшы керек.", "The white cliffs of the Ustyurt plateau. Needs a 4×4 and a guide.", "ウスチュルト台地の白い奇岩群。四駆とガイドが必要。"],
    ["Плато Устюрт", "Үстірт қыраты", "Ustyurt plateau", "ウスチュルト台地"], "Bozzhyra"),

  // Atyrau
  p("atyrau-embankment", "atyrau", "city", "center", 60, 0, ["Набережная Урала", "Жайық жағалауы", "Ural River embankment", "ウラル川の河岸"],
    ["Пешеходный мост через Урал — символическая граница Европы и Азии.", "Жайық арқылы өтетін жаяу көпір — Еуропа мен Азияның символдық шекарасы.", "A footbridge over the Ural, the symbolic line between Europe and Asia.", "ウラル川の歩道橋は、ヨーロッパとアジアの象徴的な境界。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Atyrau pedestrian bridge Ural"),
  p("atyrau-museum", "atyrau", "culture", "center", 90, null, ["Областной историко-краеведческий музей", "Облыстық тарихи-өлкетану музейі", "Atyrau Regional Museum", "アティラウ州郷土史博物館"],
    ["История нефтяного края и древнего Сарайшыка.", "Мұнайлы өлке мен көне Сарайшық тарихы.", "The story of the oil region and ancient Saraishyk.", "石油の地と古都サライシクの歴史。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Atyrau regional museum"),
  p("imangali-mosque", "atyrau", "culture", "center", 30, 0, ["Мечеть Имангали", "Иманғали мешіті", "Imangali Mosque", "イマンガリ・モスク"],
    ["Главная мечеть города.", "Қаланың бас мешіті.", "The city’s main mosque.", "市のメインモスク。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Imangali mosque Atyrau"),
  p("saraishyk", "atyrau", "culture", "daytrip", 240, null, ["Сарайшык", "Сарайшық", "Saraishyk", "サライシク"],
    ["Место средневековой столицы Ногайской Орды с мемориальным комплексом.", "Ноғай Ордасының ортағасырлық астанасы болған жер, мемориалдық кешені бар.", "Site of the medieval Nogai Horde capital, with a memorial complex.", "ノガイ・オルダの中世の都跡と記念施設。"],
    ["Около 50 км от Атырау", "Атыраудан 50 км шамасында", "About 50 km from Atyrau", "アティラウから約50km"], "Saraishyk"),

  // Aktobe
  p("nur-gasyr", "aktobe", "culture", "center", 40, 0, ["Мечеть Нур Гасыр", "Нұр Ғасыр мешіті", "Nur Gasyr Mosque", "ヌル・ガスィル・モスク"],
    ["Одна из крупнейших мечетей Казахстана.", "Қазақстандағы ең ірі мешіттердің бірі.", "One of the largest mosques in Kazakhstan.", "カザフスタン最大級のモスク。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Nur Gasyr mosque"),
  p("aktobe-museum", "aktobe", "culture", "center", 90, null, ["Областной историко-краеведческий музей", "Облыстық тарихи-өлкетану музейі", "Aktobe Regional Museum", "アクトベ州郷土史博物館"],
    ["Природа и история западных степей.", "Батыс даласының табиғаты мен тарихы.", "The nature and history of the western steppe.", "西部ステップの自然と歴史。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Aktobe regional museum"),
  p("ilek-embankment", "aktobe", "city", "center", 60, 0, ["Набережная Илека", "Елек жағалауы", "Ilek embankment", "イレク川の河岸"],
    ["Вечерняя прогулка вдоль реки Илек.", "Елек өзенінің бойымен кешкі серуен.", "An evening walk along the Ilek river.", "イレク川沿いの夕方の散歩。"],
    ["Берег Илека", "Елек жағасы", "Ilek riverside", "イレク川沿い"], "Aktobe Ilek embankment"),

  // Oral
  p("archangel-cathedral", "oral", "culture", "center", 30, 0, ["Михайло-Архангельский собор", "Михаил Архангел соборы", "Archangel Michael Cathedral", "大天使ミカエル大聖堂"],
    ["Старейшее каменное здание города, середины XVIII века.", "Қаладағы ең көне тас ғимарат, XVIII ғасырдың ортасы.", "The city’s oldest stone building, from the mid-18th century.", "18世紀半ばに建てられた市内最古の石造建築。"],
    ["Старый город", "Ескі қала", "Old town", "旧市街"], "Archangel Michael Cathedral Oral"),
  p("pugachev-museum", "oral", "culture", "center", 45, null, ["Дом-музей Пугачёва", "Пугачёв үй-мұражайы", "Pugachev House Museum", "プガチョフの家博物館"],
    ["Дом, связанный с Емельяном Пугачёвым и восстанием 1770-х.", "Емельян Пугачёвпен және 1770-жылдардағы көтеріліспен байланысты үй.", "A house tied to Yemelyan Pugachev and the uprising of the 1770s.", "プガチョフと1770年代の反乱にゆかりのある家。"],
    ["Старый город", "Ескі қала", "Old town", "旧市街"], "Pugachev house museum Uralsk"),
  p("oral-embankment", "oral", "city", "center", 60, 0, ["Набережная Урала", "Жайық жағалауы", "Ural embankment", "ウラル川の河岸"],
    ["Прогулка у реки Урал.", "Жайық өзенінің жағасында серуен.", "A walk by the Ural river.", "ウラル川沿いの散歩。"],
    ["Берег Урала", "Жайық жағасы", "Ural riverside", "ウラル川沿い"], "Oral Ural river embankment"),

  // Karaganda
  p("karlag-museum", "karaganda", "culture", "daytrip", 180, null, ["Музей памяти жертв репрессий в Долинке", "Долинкадағы қуғын-сүргін құрбандарын еске алу мұражайы", "Karlag Memorial Museum, Dolinka", "ドリンカの政治弾圧犠牲者記念博物館"],
    ["Музей в бывшем управлении Карлага, одного из крупнейших лагерей ГУЛАГа.", "ГУЛАГ-тың ең ірі лагерьлерінің бірі — Карлагтың бұрынғы басқармасындағы мұражай.", "A museum in the former Karlag headquarters, one of the largest Gulag camps.", "グラグ最大級の収容所カルラグの旧本部にある博物館。"],
    ["Посёлок Долинка", "Долинка кенті", "Dolinka village", "ドリンカ村"], "Karlag museum Dolinka"),
  p("karaganda-park", "karaganda", "nature", "center", 60, 0, ["Центральный парк", "Орталық саябақ", "Central Park", "中央公園"],
    ["Большой парк с прудом в центре города.", "Қала орталығындағы тоғаны бар үлкен саябақ.", "A large park with a pond in the city centre.", "市中心部の池のある大きな公園。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Karaganda central park"),
  p("miners-glory", "karaganda", "city", "center", 20, 0, ["Монумент «Шахтёрская слава»", "«Кеншілер даңқы» монументі", "Miners’ Glory monument", "炭鉱労働者の栄光記念碑"],
    ["Памятник городу, выросшему на угольных шахтах.", "Көмір шахталарының арқасында өскен қалаға арналған ескерткіш.", "A tribute to a city that grew out of its coal mines.", "炭鉱とともに育った町を称える記念碑。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Miners Glory monument Karaganda"),
  p("karkaraly", "karaganda", "nature", "daytrip", 600, null, ["Каркаралинский нацпарк", "Қарқаралы ұлттық паркі", "Karkaraly National Park", "カルカラル国立公園"],
    ["Сосновые горы и озеро Шайтанколь посреди степи.", "Дала ортасындағы қарағайлы таулар мен Шайтанкөл көлі.", "Pine-covered hills and Lake Shaitankol in the middle of the steppe.", "草原に浮かぶ松の山々とシャイタンコル湖。"],
    ["Около 220 км к востоку от Караганды", "Қарағандыдан шығысқа қарай 220 км шамасында", "About 220 km east of Karaganda", "カラガンダの東約220km"], "Karkaraly National Park"),

  // Burabay
  p("burabay-lake", "burabay", "nature", "center", 120, 0, ["Озеро Бурабай", "Бурабай көлі", "Lake Burabay", "ブラバイ湖"],
    ["Озеро среди сосен и гранитных сопок.", "Қарағай мен гранит шоқылар арасындағы көл.", "A lake among pines and granite hills.", "松林と花崗岩の丘に囲まれた湖。"],
    ["Посёлок Бурабай", "Бурабай кенті", "Burabay village", "ブラバイ村"], "Lake Burabay"),
  p("okzhetpes", "burabay", "nature", "outskirts", 120, null, ["Скала Окжетпес", "Оқжетпес жартасы", "Okzhetpes Rock", "オクジェトペス岩"],
    ["Скала над озером, напротив — камень Жумбактас.", "Көл үстіндегі жартас, қарсысында — Жұмбақтас.", "A rock above the lake, facing the Zhumbaktas stone.", "湖を見下ろす岩。向かいにジュンバクタス岩。"],
    ["Северный берег озера Бурабай", "Бурабай көлінің солтүстік жағасы", "North shore of Lake Burabay", "ブラバイ湖北岸"], "Okzhetpes"),
  p("shchuchye", "burabay", "nature", "outskirts", 120, 0, ["Озеро Щучье", "Шортан көлі", "Lake Shchuchye", "シュチュチエ湖"],
    ["Глубокое озеро с прозрачной водой у Щучинска.", "Щучинск маңындағы мөлдір сулы терең көл.", "A deep, clear lake by Shchuchinsk.", "シチュチンスク近くの深く澄んだ湖。"],
    ["Щучинск", "Щучинск", "Shchuchinsk", "シチュチンスク"], "Lake Shchuchye Kazakhstan"),
  p("abylai-glade", "burabay", "culture", "outskirts", 45, 0, ["Поляна Абылай хана", "Абылай хан алаңы", "Abylai Khan Glade", "アブライ・ハンの草原"],
    ["Место, где, по преданию, Абылая провозгласили ханом.", "Аңыз бойынша Абылайды хан көтерген жер.", "Where, by tradition, Abylai was proclaimed khan.", "伝承でアブライがハンに推戴されたとされる場所。"],
    ["Национальный парк «Бурабай»", "«Бурабай» ұлттық паркі", "Burabay National Park", "ブラバイ国立公園"], "Abylai Khan glade Burabay"),
  p("burabay-museum", "burabay", "culture", "center", 60, null, ["Музей природы", "Табиғат мұражайы", "Nature Museum", "自然博物館"],
    ["Диорамы о лесах, озёрах и животных национального парка.", "Ұлттық парктің ормандары, көлдері мен жануарлары туралы диорамалар.", "Dioramas of the park’s forests, lakes and wildlife.", "国立公園の森・湖・動物のジオラマ。"],
    ["Посёлок Бурабай", "Бурабай кенті", "Burabay village", "ブラバイ村"], "Burabay nature museum"),

  // Pavlodar
  p("mashkhur-zhusup", "pavlodar", "culture", "center", 40, 0, ["Мечеть Машхур Жусупа", "Мәшһүр Жүсіп мешіті", "Mashkhur Zhusup Mosque", "マシュフル・ジュスプ・モスク"],
    ["Главная мечеть города, названная в честь поэта и мыслителя.", "Ақын әрі ойшылдың есімімен аталған қаланың бас мешіті.", "The city’s main mosque, named after the poet and thinker.", "詩人・思想家の名を冠した市のメインモスク。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Mashkhur Zhusup mosque Pavlodar"),
  p("annunciation-cathedral", "pavlodar", "culture", "center", 30, 0, ["Благовещенский собор", "Благовещение соборы", "Annunciation Cathedral", "生神女福音大聖堂"],
    ["Православный собор в центре города.", "Қала орталығындағы православиелік собор.", "An Orthodox cathedral in the city centre.", "市中心部の正教会の大聖堂。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Annunciation Cathedral Pavlodar"),
  p("pavlodar-embankment", "pavlodar", "city", "center", 60, 0, ["Набережная Иртыша", "Ертіс жағалауы", "Irtysh embankment", "イルティシ川の河岸"],
    ["Длинная набережная с видом на реку.", "Өзенге қарайтын ұзын жағалау.", "A long riverside promenade.", "川を望む長い遊歩道。"],
    ["Берег Иртыша", "Ертіс жағасы", "Irtysh riverside", "イルティシ川沿い"], "Pavlodar Irtysh embankment"),
  p("bayanaul", "pavlodar", "nature", "daytrip", 720, null, ["Баянаульский нацпарк", "Баянауыл ұлттық паркі", "Bayanaul National Park", "バヤナウル国立公園"],
    ["Первый национальный парк Казахстана: скалы, сосны, озеро Жасыбай.", "Қазақстанның алғашқы ұлттық паркі: жартастар, қарағайлар, Жасыбай көлі.", "Kazakhstan’s first national park: rocks, pines and Lake Zhasybay.", "カザフスタン初の国立公園。奇岩、松林、ジャスィバイ湖。"],
    ["Около 230 км от Павлодара", "Павлодардан 230 км шамасында", "About 230 km from Pavlodar", "パヴロダルから約230km"], "Bayanaul National Park"),

  // Semey
  p("abai-museum", "semey", "culture", "center", 90, null, ["Музей Абая", "Абай мұражайы", "Abai Museum", "アバイ記念博物館"],
    ["Литературно-мемориальный музей великого казахского поэта.", "Ұлы қазақ ақынының әдеби-мемориалдық мұражайы.", "The literary museum of the great Kazakh poet.", "カザフの大詩人アバイの文学記念館。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Abai museum Semey"),
  p("dostoevsky-museum", "semey", "culture", "center", 60, null, ["Музей Достоевского", "Достоевский мұражайы", "Dostoevsky Museum", "ドストエフスキー記念館"],
    ["Дом, где писатель жил в 1850-х, отбывая службу после каторги.", "Жазушы каторгадан кейін 1850-жылдары қызмет етіп тұрған үй.", "The house where the writer lived in the 1850s, serving after his prison term.", "作家が1850年代、流刑後の兵役中に暮らした家。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Dostoevsky museum Semey"),
  p("stronger-than-death", "semey", "culture", "center", 30, 0, ["Мемориал «Сильнее смерти»", "«Өлімнен де күшті» мемориалы", "Stronger Than Death memorial", "「死よりも強く」記念碑"],
    ["Памятник жертвам Семипалатинского ядерного полигона.", "Семей ядролық полигоны құрбандарына арналған ескерткіш.", "A memorial to the victims of the Semipalatinsk nuclear test site.", "セミパラチンスク核実験場の犠牲者を悼む記念碑。"],
    ["Полуостров на Иртыше", "Ертістегі түбек", "Irtysh peninsula", "イルティシ川の半島"], "Stronger than Death memorial Semey"),
  p("semey-bridge", "semey", "city", "center", 30, 0, ["Подвесной мост", "Аспалы көпір", "Suspension bridge", "吊り橋"],
    ["Висячий мост через Иртыш — символ города.", "Ертіс арқылы өтетін аспалы көпір — қаланың символы.", "The suspension bridge over the Irtysh, the city’s emblem.", "イルティシ川に架かる吊り橋。町のシンボル。"],
    ["Через Иртыш", "Ертіс арқылы", "Across the Irtysh", "イルティシ川"], "Semey suspension bridge"),
  p("zhidebay", "semey", "culture", "daytrip", 600, 0, ["Комплекс Абая и Шакарима в Жидебае", "Жидебайдағы Абай–Шәкәрім кесенесі", "Abai–Shakarim Mausoleum, Zhidebay", "ジデバイのアバイ・シャカリム廟"],
    ["Мемориальный комплекс в степи, на родине поэтов.", "Ақындардың туған жеріндегі даладағы мемориалдық кешен.", "A memorial complex on the steppe where the poets were born.", "詩人たちの故郷の草原にある記念施設。"],
    ["Абайский район", "Абай ауданы", "Abai District", "アバイ地区"], "Abai Shakarim mausoleum Zhidebay"),

  // Oskemen
  p("oskemen-ethnopark", "oskemen", "culture", "center", 120, null, ["Музей-заповедник под открытым небом", "Ашық аспан астындағы мұражай-қорық", "Open-air ethnographic museum", "野外民族博物館"],
    ["Юрты, деревенские избы и мельница в старом парке.", "Ескі саябақтағы киіз үйлер, ауыл үйлері және диірмен.", "Yurts, village houses and a mill in an old park.", "古い公園に並ぶユルト、農家、風車小屋。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "East Kazakhstan ethnographic museum Ust-Kamenogorsk"),
  p("oskemen-embankment", "oskemen", "city", "center", 60, 0, ["Набережная Иртыша", "Ертіс жағалауы", "Irtysh embankment", "イルティシ川の河岸"],
    ["Место, где Ульба впадает в Иртыш.", "Үлбі Ертіске құятын жер.", "Where the Ulba flows into the Irtysh.", "ウルバ川がイルティシ川に注ぐ場所。"],
    ["Берег Иртыша", "Ертіс жағасы", "Irtysh riverside", "イルティシ川沿い"], "Ust-Kamenogorsk Irtysh embankment"),
  p("sibiny", "oskemen", "nature", "daytrip", 600, null, ["Сибинские озёра", "Сибе көлдері", "Sibiny Lakes", "シビンスキー湖群"],
    ["Пять горных озёр среди гранитных скал.", "Гранит жартастар арасындағы бес тау көлі.", "Five mountain lakes among granite rocks.", "花崗岩の岩山に囲まれた5つの湖。"],
    ["Около 70 км от города", "Қаладан 70 км шамасында", "About 70 km from the city", "市から約70km"], "Sibiny lakes"),
  p("kiin-kerish", "oskemen", "nature", "daytrip", 720, null, ["Киин-Кериш", "Киін-Кериш", "Kiin-Kerish", "キイン・ケリシュ"],
    ["«Пылающие скалы» — красные глины у озера Зайсан.", "«Жанып тұрған жартастар» — Зайсан көлі маңындағы қызыл саз.", "The “flaming cliffs”: red clay badlands near Lake Zaysan.", "「燃える崖」。ザイサン湖近くの赤い粘土の奇景。"],
    ["Зайсанский район", "Зайсан ауданы", "Zaysan District", "ザイサン地区"], "Kiin-Kerish"),

  // Petropavl
  p("abylai-residence", "petropavl", "culture", "center", 60, null, ["Резиденция Абылай хана", "Абылай хан резиденциясы", "Abylai Khan Residence", "アブライ・ハン邸宅博物館"],
    ["Музей в доме, построенном для хана в XVIII веке.", "XVIII ғасырда ханға арнап салынған үйдегі мұражай.", "A museum in the house built for the khan in the 18th century.", "18世紀にハンのために建てられた家の博物館。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Abylai Khan residence Petropavl"),
  p("ishim-embankment", "petropavl", "city", "center", 60, 0, ["Набережная Ишима", "Есіл жағалауы", "Ishim embankment", "イシム川の河岸"],
    ["Вид на широкую пойму реки Ишим.", "Есіл өзенінің кең жайылмасына көрініс.", "Views over the wide Ishim floodplain.", "イシム川の広い氾濫原を一望。"],
    ["Берег Ишима", "Есіл жағасы", "Ishim riverside", "イシム川沿い"], "Petropavl Ishim embankment"),
  p("petropavl-museum", "petropavl", "culture", "center", 90, null, ["Областной историко-краеведческий музей", "Облыстық тарихи-өлкетану музейі", "North Kazakhstan Regional Museum", "北カザフスタン州郷土史博物館"],
    ["История северных земель и города-крепости.", "Солтүстік өлке мен бекініс-қала тарихы.", "The story of the northern lands and the fortress town.", "北の大地と城塞都市の歴史。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "North Kazakhstan regional museum"),

  // Kostanay
  p("tobol-embankment", "kostanay", "city", "center", 60, 0, ["Набережная Тобола", "Тобыл жағалауы", "Tobol embankment", "トボル川の河岸"],
    ["Прогулка вдоль реки Тобол.", "Тобыл өзенінің бойымен серуен.", "A walk along the Tobol river.", "トボル川沿いの散歩。"],
    ["Берег Тобола", "Тобыл жағасы", "Tobol riverside", "トボル川沿い"], "Kostanay Tobol embankment"),
  p("kostanay-museum", "kostanay", "culture", "center", 90, null, ["Областной историко-краеведческий музей", "Облыстық тарихи-өлкетану музейі", "Kostanay Regional Museum", "コスタナイ州郷土史博物館"],
    ["История северных степей и освоения целины.", "Солтүстік дала және тың игеру тарихы.", "The northern steppe and the Virgin Lands campaign.", "北部ステップと処女地開拓の歴史。"],
    ["Центр города", "Қала орталығы", "City centre", "市中心部"], "Kostanay regional museum"),
  p("naurzum", "kostanay", "nature", "daytrip", 720, null, ["Наурзумский заповедник", "Наурызым қорығы", "Naurzum Nature Reserve", "ナウルズム自然保護区"],
    ["Часть объекта ЮНЕСКО «Сарыарка»: степь, озёра и сосновые боры.", "ЮНЕСКО-ның «Сарыарқа» нысанының бөлігі: дала, көлдер және қарағайлы ормандар.", "Part of the UNESCO Saryarka site: steppe, lakes and pine woods.", "ユネスコ「サリャルカ」の一部。ステップ、湖、松林。"],
    ["Около 200 км к югу от Костаная", "Қостанайдан оңтүстікке қарай 200 км шамасында", "About 200 km south of Kostanay", "コスタナイの南約200km"], "Naurzum Nature Reserve"),
];
