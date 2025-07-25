type AppConfig = {
  categories: { name: string; path: string }[];
  imagesUrl: string;
};

export const config = {
  categories: [
    { name: "AKTUALNO", path: "/" },
    { name: "POLITIKA", path: "/politika" },
    { name: "GOSPODARSTVO", path: "/gospodarstvo" },
    { name: "KRIMINAL", path: "/kriminal" },
    { name: "ŠPORT", path: "/sport" },
    { name: "KULTURA", path: "/kultura" },
    { name: "ZDRAVJE", path: "/zdravje" },
    { name: "OKOLJE", path: "/okolje" },
    { name: "LOKALNO", path: "/lokalno" },
    { name: "TEHNOLOGIJA & ZNANOST", path: "/tehnologija-znanost" },
  ],
  imagesUrl: "https://images.vidik.si",
} satisfies AppConfig;
