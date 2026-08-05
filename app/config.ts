type Category = {
  key: string;
  name: string;
  path: string;
};

type AppConfig = {
  navigation: { name: string; path: string }[];
  categories: Category[];
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
  {
    key: CategoryKey.tehnologijaZnanost,
    name: "TEHNOLOGIJA & ZNANOST",
    path: "/tehnologija-znanost",
  },
  { key: CategoryKey.kultura, name: "KULTURA", path: "/kultura" },
  { key: CategoryKey.zdravje, name: "ZDRAVJE", path: "/zdravje" },
  { key: CategoryKey.okolje, name: "OKOLJE", path: "/okolje" },
];

export const config = {
  navigation: [{ name: "AKTUALNO", path: "/" }, ...categories],
  categories,
  imagesUrl: "https://images.vidik.si",
} satisfies AppConfig;
