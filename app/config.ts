type Category = {
  key: string;
  name: string;
  path: string;
};

type AppConfig = {
  navigation: { name: string; path: string }[];
  categories: Category[];
  apiUrl: string;
  imagesUrl: string;
};

export const CategoryKey = {
  politika: "politika",
  gospodarstvo: "gospodarstvo",
  kriminal: "kriminal",
  lokalno: "lokalno",
  sport: "sport",
  kultura: "kultura",
  zdravje: "zdravje",
  okolje: "okolje",
  tehnologijaZnanost: "tehnologija-znanost",
} as const;

export type CategoryKeyValue = (typeof CategoryKey)[keyof typeof CategoryKey];

const categories = [
  { key: CategoryKey.politika, name: "POLITIKA", path: "/politika" },
  {
    key: CategoryKey.gospodarstvo,
    name: "GOSPODARSTVO",
    path: "/gospodarstvo",
  },
  { key: CategoryKey.kriminal, name: "KRIMINAL", path: "/kriminal" },
  { key: CategoryKey.lokalno, name: "LOKALNO", path: "/lokalno" },
  { key: CategoryKey.sport, name: "ŠPORT", path: "/sport" },
  { key: CategoryKey.kultura, name: "KULTURA", path: "/kultura" },
  { key: CategoryKey.zdravje, name: "ZDRAVJE", path: "/zdravje" },
  { key: CategoryKey.okolje, name: "OKOLJE", path: "/okolje" },
  {
    key: CategoryKey.tehnologijaZnanost,
    name: "TEHNOLOGIJA & ZNANOST",
    path: "/tehnologija-znanost",
  },
];

export const config = {
  navigation: [{ name: "AKTUALNO", path: "/" }, ...categories],
  categories,
  apiUrl:
    "https://z53lrua5dblvmgq565n3tsrhyy0oyuxt.lambda-url.eu-central-1.on.aws",
  imagesUrl: "https://images.vidik.si",
} satisfies AppConfig;
