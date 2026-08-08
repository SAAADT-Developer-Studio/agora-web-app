/**
 * Central category registry.
 *
 * Keys live here only. Domain-specific maps (SEO, ranking priority, home side
 * sections, …) must use `defineCategoryMap` / `CategoryMap<T>` so TypeScript
 * fails when a new category is added without updating every config.
 */

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

/** Object that must define a value for every category key. */
export type CategoryMap<T> = { [K in CategoryKeyValue]: T };

/**
 * Build a category-keyed config map. Missing or extra keys are type errors.
 *
 * @example
 * const CATEGORY_PRIORITY = defineCategoryMap({
 *   politika: 6,
 *   gospodarstvo: 6,
 *   // …every CategoryKeyValue required
 * });
 */
export function defineCategoryMap<T>(map: CategoryMap<T>): CategoryMap<T> {
  return map;
}

export type Category = {
  key: CategoryKeyValue;
  name: string;
  path: `/${CategoryKeyValue}`;
};

type AppConfig = {
  navigation: { name: string; path: string }[];
  categories: Category[];
  imagesUrl: string;
};

/**
 * Display / routing metadata per category.
 * Insertion order = nav and homepage section order.
 */
const categoryByKey = defineCategoryMap({
  [CategoryKey.politika]: {
    name: "POLITIKA",
    path: "/politika",
  },
  [CategoryKey.gospodarstvo]: {
    name: "GOSPODARSTVO",
    path: "/gospodarstvo",
  },
  [CategoryKey.kriminal]: {
    name: "KRIMINAL",
    path: "/kriminal",
  },
  [CategoryKey.lokalno]: {
    name: "LOKALNO",
    path: "/lokalno",
  },
  [CategoryKey.sport]: {
    name: "ŠPORT",
    path: "/sport",
  },
  [CategoryKey.tehnologijaZnanost]: {
    name: "TEHNOLOGIJA & ZNANOST",
    path: "/tehnologija-znanost",
  },
  [CategoryKey.kultura]: {
    name: "KULTURA",
    path: "/kultura",
  },
  [CategoryKey.zdravje]: {
    name: "ZDRAVJE",
    path: "/zdravje",
  },
  [CategoryKey.okolje]: {
    name: "OKOLJE",
    path: "/okolje",
  },
} as const satisfies CategoryMap<{
  name: string;
  path: `/${CategoryKeyValue}`;
}>);

export const categories: Category[] = (
  Object.entries(categoryByKey) as [
    CategoryKeyValue,
    (typeof categoryByKey)[CategoryKeyValue],
  ][]
).map(([key, value]) => ({ key, ...value }));

const categoryKeySet = new Set<string>(Object.values(CategoryKey));

export function isCategoryKey(value: string): value is CategoryKeyValue {
  return categoryKeySet.has(value);
}

export function getCategory(key: CategoryKeyValue): Category {
  return { key, ...categoryByKey[key] };
}

export const config = {
  navigation: [{ name: "AKTUALNO", path: "/" }, ...categories],
  categories,
  imagesUrl: "https://images.vidik.si",
} satisfies AppConfig;
