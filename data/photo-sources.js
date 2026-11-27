/**
 * Where scripts/fetch-photos.mjs looks for each place's photo: Wikipedia articles ("lang:Title"),
 * tried in order; the lead image of the first one with a free photo on Commons wins.
 *   "place" — the photo shows the place itself;
 *   "city"  — no free photo of the place (modern buildings in Kazakhstan are often not free to photograph
 *             for Commons), so the photo shows its city or area (the card says so);
 *   "dish"  — cafés: a typical dish of that cuisine, not the café itself (the card says so).
 * To change a photo: edit the list here, then run `node scripts/fetch-photos.mjs <id>`.
 */
const place = (...titles) => titles.map((title) => ["place", title]);
const city = (title) => [["city", title]];
const dish = (title) => [["dish", title]];

export const PHOTO_SOURCES = {
  // Almaty cafés: a dish of the cuisine
  tandoor: dish("en:Tandoori chicken"),
  "sadik-usta": dish("en:İskender kebap"),
  "line-brew": [...dish("en:Steak"), ...dish("en:Beer")],
  ami: dish("en:Croissant"),
  shakespeare: [...dish("en:Fish and chips"), ...dish("en:Pub")],
  dadiani: dish("en:Khachapuri"),
  // Almaty
  medeu: place("en:Medeu", "ru:Медеу (каток)"),
  "big-almaty-lake": place("en:Big Almaty Lake", "ru:Большое Алматинское озеро"),
  "central-museum": place("en:Central State Museum of Kazakhstan", "ru:Центральный государственный музей Республики Казахстан"),
  tamgaly: [...place("en:Tamgaly", "ru:Тамгалы"), ...city("en:Almaty Region")],
  "altyn-emel": place("en:Altyn-Emel National Park", "ru:Алтын-Эмель"),
  // Astana
  baiterek: [...place("en:Bayterek (monument)", "ru:Байтерек (монумент)"), ...city("en:Astana")],
  "khan-shatyr": [...place("en:Khan Shatyr Entertainment Center", "ru:Хан Шатыр"), ...city("en:Astana")],
  "hazrat-sultan": [...place("en:Hazrat Sultan Mosque", "ru:Хазрет Султан"), ...city("en:Astana")],
  "peace-palace": [...place("en:Palace of Peace and Reconciliation", "ru:Дворец мира и согласия"), ...city("en:Astana")],
  "nur-alem": [...place("en:Nur Alem", "ru:Нур Алем"), ...city("en:Astana")],
  "national-museum": [...place("en:National Museum of Kazakhstan", "ru:Национальный музей Республики Казахстан"), ...city("en:Astana")],
  "astana-opera": [...place("en:Astana Opera", "ru:Астана Опера"), ...city("en:Astana")],
  // Shymkent
  "ordabasy-square": [...place("ru:Площадь Ордабасы", "ru:Ордабасы (площадь)"), ...city("en:Shymkent")],
  "shymkent-dendropark": [...place("ru:Дендропарк (Шымкент)"), ...city("en:Shymkent")],
  "independence-park-shymkent": [...place("ru:Парк Независимости (Шымкент)"), ...city("en:Shymkent")],
  sayram: place("en:Sayram, Kazakhstan", "ru:Сайрам (Казахстан)"),
  "aksu-zhabagly": place("en:Aksu-Zhabagly Nature Reserve", "ru:Аксу-Джабаглинский заповедник"),
  // Turkistan
  yasawi: place("en:Mausoleum of Khoja Ahmed Yasawi", "ru:Мавзолей Ходжи Ахмеда Ясави"),
  "rabiga-begim": [...place("ru:Мавзолей Рабиги Султан Бегим"), ...city("en:Turkistan (city)")],
  karavansaray: [...place("ru:Караван-Сарай (Туркестан)"), ...city("en:Turkistan (city)")],
  "arystan-bab": place("ru:Мавзолей Арыстан-баба", "en:Arystan Bab"),
  otrar: place("en:Otrar", "ru:Отрар"),
  sauran: place("en:Sauran", "ru:Сауран (городище)"),
  // Taraz
  "aisha-bibi": [...place("en:Aisha Bibi", "ru:Мавзолей Айша-биби"), ...city("en:Taraz")],
  "babaji-khatun": [...place("ru:Мавзолей Бабаджи-хатун", "en:Babaji Khatun Mausoleum"), ...city("en:Taraz")],
  karakhan: place("ru:Мавзолей Карахана", "en:Karakhan Mausoleum"),
  "ancient-taraz": [...place("ru:Городище Тараз"), ...city("en:Taraz")],
  // Kyzylorda
  "aitbay-mosque": [...place("ru:Мечеть Айтбая", "ru:Мечеть Айтбай"), ...city("en:Kyzylorda")],
  "syrdarya-embankment": city("en:Kyzylorda"),
  "korkyt-ata": [...place("ru:Коркыт-Ата (мемориальный комплекс)", "en:Korkyt Ata"), ...city("en:Kyzylorda")],
  baikonur: place("en:Baikonur Cosmodrome"),
  // Aktau
  "aktau-waterfront": city("en:Aktau"),
  "mig-monument": [...place("ru:Памятник МиГ-21 (Актау)"), ...city("en:Aktau")],
  sherkala: place("en:Sherkala", "ru:Шеркала"),
  "shakpak-ata": [...place("en:Shakpak-Ata", "ru:Шакпак-ата"), ...city("en:Mangyshlak Peninsula")],
  bozzhyra: [...place("ru:Бозжыра", "en:Bozzhyra"), ...city("en:Ustyurt Plateau")],
  // Atyrau
  "atyrau-embankment": city("en:Atyrau"),
  "atyrau-museum": [...place("ru:Атырауский областной историко-краеведческий музей"), ...city("en:Atyrau")],
  "imangali-mosque": [...place("ru:Мечеть Имангали"), ...city("en:Atyrau")],
  saraishyk: [...place("en:Saray-Jük", "ru:Сарайшык"), ...city("en:Atyrau")],
  // Aktobe
  "nur-gasyr": [...place("en:Nur Gasyr Mosque", "ru:Нур Гасыр"), ...city("en:Aktobe")],
  "aktobe-museum": [...place("ru:Актюбинский областной историко-краеведческий музей"), ...city("en:Aktobe")],
  "ilek-embankment": city("en:Aktobe"),
  // Oral
  "archangel-cathedral": [...place("ru:Собор Михаила Архангела (Уральск)"), ...city("en:Oral, Kazakhstan")],
  "pugachev-museum": [...place("ru:Дом-музей Е. И. Пугачёва"), ...city("en:Oral, Kazakhstan")],
  "oral-embankment": city("en:Oral, Kazakhstan"),
  // Karaganda
  "karlag-museum": [...place("en:Karlag", "ru:Карлаг"), ...city("en:Karaganda")],
  "karaganda-park": [...place("ru:Центральный парк культуры и отдыха (Караганда)"), ...city("en:Karaganda")],
  "miners-glory": [...place("ru:Шахтёрская слава (памятник)"), ...city("en:Karaganda")],
  karkaraly: place("en:Karkaraly National Park", "ru:Каркаралинский национальный парк"),
  // Burabay
  "burabay-lake": place("en:Lake Burabay", "ru:Боровое (озеро, Казахстан)"),
  okzhetpes: [...place("ru:Окжетпес", "en:Okzhetpes"), ...city("en:Burabay National Park")],
  shchuchye: place("ru:Щучье (озеро, Акмолинская область)", "en:Lake Shchuchye"),
  "abylai-glade": [...place("ru:Поляна Абылай-хана"), ...place("en:Burabay National Park")],
  "burabay-museum": place("en:Burabay National Park", "ru:Бурабай (национальный парк)"),
  // Pavlodar
  "mashkhur-zhusup": [...place("ru:Мечеть Машхур Жусупа", "en:Mashkhur Zhusup Mosque"), ...city("en:Pavlodar")],
  "annunciation-cathedral": [...place("ru:Благовещенский собор (Павлодар)"), ...city("en:Pavlodar")],
  "pavlodar-embankment": city("en:Pavlodar"),
  bayanaul: place("en:Bayanaul National Park", "ru:Баянаульский национальный парк"),
  // Semey
  "abai-museum": [...place("ru:Литературно-мемориальный музей Абая"), ...city("en:Semey"), ...city("ru:Семей"), ...city("en:Irtysh")],
  "dostoevsky-museum": [...place("ru:Литературно-мемориальный дом-музей Ф. М. Достоевского (Семей)"), ...city("en:Semey"), ...city("ru:Семей"), ...city("en:Irtysh")],
  "stronger-than-death": [...place("ru:Сильнее смерти (мемориал)", "en:Stronger than Death"), ...city("en:Semey"), ...city("ru:Семей"), ...city("en:Irtysh")],
  "semey-bridge": [...place("ru:Семипалатинский подвесной мост", "en:Semey Bridge"), ...city("en:Semey"), ...city("ru:Семей"), ...city("en:Irtysh")],
  zhidebay: [...place("ru:Мавзолей Абая и Шакарима"), ...city("en:Semey"), ...city("ru:Семей"), ...city("en:Irtysh")],
  // Oskemen
  "oskemen-ethnopark": [...place("ru:Этнопарк (Усть-Каменогорск)"), ...city("en:Oskemen")],
  "oskemen-embankment": city("en:Oskemen"),
  sibiny: [...place("ru:Сибинские озёра", "en:Sibiny Lakes"), ...city("en:Oskemen")],
  "kiin-kerish": place("ru:Киин-Кериш", "en:Kiin-Kerish"),
  // Petropavl
  "abylai-residence": [...place("ru:Резиденция Абылай-хана"), ...city("en:Petropavl")],
  "ishim-embankment": city("en:Petropavl"),
  "petropavl-museum": [...place("ru:Северо-Казахстанский областной историко-краеведческий музей"), ...city("en:Petropavl")],
  // Kostanay
  "tobol-embankment": city("en:Kostanay"),
  "kostanay-museum": [...place("ru:Костанайский областной историко-краеведческий музей"), ...city("en:Kostanay")],
  naurzum: place("en:Naurzum Nature Reserve", "ru:Наурзумский заповедник"),
};
