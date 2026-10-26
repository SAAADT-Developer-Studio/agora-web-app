import type {
  UtrinkiCategory,
  UtrinkiPage,
  UtrinkiStory,
} from "~/lib/utrinki/model";
import { UTRINKI_PAGE_SIZE } from "~/lib/utrinki/model";

const PROVIDERS = [
  ["delo", "Delo", "left"],
  ["dnevnik", "Dnevnik", "center-left"],
  ["n1info", "N1", "center-left"],
  ["zurnal24", "Žurnal24", "left"],
  ["rtv", "RTV", "center"],
  ["siol", "Siol", "center"],
  ["24ur", "24ur", "center"],
  ["svet24", "Svet24", "center"],
  ["slovenskenovice", "Slovenske novice", "center"],
  ["nova24tv", "Nova24TV", "right"],
  ["demokracija", "Demokracija", "center-right"],
  ["reporter", "Reporter", "right"],
  ["info360", "Info360", "right"],
  ["lokalec", "Lokalec", "center-right"],
  ["maribor24", "Maribor24", "right"],
] as const;

const TITLES = [
  "Brezovec brez maske: Brejc, Stevanović in pot do roba koalicije",
  "Proračunski pogovor se seli na odbor, rok ostaja odprt",
  "Občine merijo strošek nove ureditve odpadkov",
  "Preiskava kraje se širi na tri občine",
  "Liga se prelamlja v zadnjem krogu",
  "Laboratorij prijavi preboj pri shranjevanju energije",
  "Gledališka sezona odpira spor o javnem denarju",
  "Čakalne vrste: kaj kažejo številke in kaj izkušnje",
  "Suša premika rok za omejitve vode",
  "Trg dela: kje podjetja še zaposlujejo",
];

function articlesFor(seed: number) {
  const pattern = [
    ...Array.from({ length: 11 }, () => "left" as const),
    ...Array.from({ length: 5 }, () => "center" as const),
    ...Array.from({ length: 8 }, () => "right" as const),
  ];
  return pattern.map((bucket, index) => {
    const provider = PROVIDERS[index % PROVIDERS.length];
    const bias =
      bucket === "left"
        ? index % 2 === 0
          ? "left"
          : "center-left"
        : bucket === "right"
          ? index % 2 === 0
            ? "right"
            : "center-right"
          : "center";
    return {
      id: seed * 100 + index + 1,
      title:
        index === 0
          ? "Po odstopu: koalicija mora prevzeti politično odgovornost"
          : index === 1
            ? "Kaj odstop pomeni za koalicijsko pogodbo in proračun"
            : index === 2
              ? "Razkol v koaliciji: Brejc in Stevanović na nasprotnih bregovih"
              : index === 3
                ? "Časovnica: od afere do roba koalicije v sedmih dneh"
                : `Poročilo ${index + 1}: kako medij vidi isti dogodek`,
      url: `https://vidik.si/politika/clanek/${seed}-${index}`,
      publishedAt: new Date(
        Date.now() - (index + 3) * 60 * 60 * 1000,
      ).toISOString(),
      providerKey: provider[0],
      providerName: provider[1],
      biasRating: bias,
      side:
        bias === "left" || bias === "center-left"
          ? ("left" as const)
          : bias === "right" || bias === "center-right"
            ? ("right" as const)
            : ("center" as const),
    };
  });
}

function story(index: number): UtrinkiStory {
  const articles = articlesFor(9000 + index);
  const providers = PROVIDERS.map(([key, name]) => ({ key, name }));
  const categoryCycle = [
    "politika",
    "gospodarstvo",
    "lokalno",
    "kriminal",
    "sport",
    "tehnologija-znanost",
    "kultura",
    "zdravje",
    "okolje",
  ] as const;
  const category = categoryCycle[index % categoryCycle.length];
  return {
    id: 900000 + index,
    title: TITLES[index % TITLES.length],
    summary:
      index === 0
        ? "Koalicija razpravlja o odstopu ministra. Levi mediji poudarjajo odgovornost vlade, desni notranje spore v koaliciji."
        : "Kratko povzetek sklopa: kaj se je zgodilo in kje se poročanje razhaja.",
    category,
    categoryLabel: category.toLocaleUpperCase("sl-SI"),
    updatedAt: new Date(
      Date.now() - (index === 0 ? 2 : index + 2) * 60 * 60 * 1000,
    ).toISOString(),
    imageUrl:
      index === 0
        ? "https://images.pexels.com/photos/5555877/pexels-photo-5555877.jpeg"
        : null,
    articleCount: articles.length,
    providerCount: providers.length,
    providers,
    bias: {
      left: 11,
      center: 5,
      right: 8,
      unrated: index === 3 ? 0 : 0,
      total: 24,
      leftPercent: 46,
      centerPercent: 21,
      rightPercent: 33,
    },
    articles,
    coverageLabel: "24 člankov · 15 virov",
    spanLabel: "18.–24. avg.",
    storyPath: `/zgodba/${900000 + index}`,
  };
}

const FIXTURE_STORIES = Array.from({ length: 14 }, (_, index) => story(index));

export function fixtureUtrinkiPage(query: {
  category: UtrinkiCategory;
  page: number;
}): UtrinkiPage {
  const pool =
    query.category === "aktualno"
      ? FIXTURE_STORIES
      : FIXTURE_STORIES.filter((item) => item.category === query.category);
  const start = query.page * UTRINKI_PAGE_SIZE;
  const stories = pool.slice(start, start + UTRINKI_PAGE_SIZE);
  return {
    stories,
    page: query.page,
    pageSize: UTRINKI_PAGE_SIZE,
    hasMore: start + UTRINKI_PAGE_SIZE < pool.length,
    category: query.category,
  };
}
