type AppConfig = {
  categories: { name: string; path: string }[];
  apiUrl: string;
  imagesUrl: string;
};

export const config = {
  categories: [
    { name: "AKTUALNO", path: "/" },
    { name: "POLITIKA", path: "/politika" },
    { name: "GOSPODARSTVO", path: "/gospodarstvo" },
    { name: "KRIMINAL", path: "/kriminal" },
    { name: "LOKALNO", path: "/lokalno" },
    { name: "ŠPORT", path: "/sport" },
    { name: "KULTURA", path: "/kultura" },
    { name: "ZDRAVJE", path: "/zdravje" },
    { name: "OKOLJE", path: "/okolje" },
    { name: "TEHNOLOGIJA & ZNANOST", path: "/tehnologija-znanost" },
  ],
  apiUrl:
    "https://z53lrua5dblvmgq565n3tsrhyy0oyuxt.lambda-url.eu-central-1.on.aws",
  imagesUrl: "https://images.vidik.si",
} satisfies AppConfig;
