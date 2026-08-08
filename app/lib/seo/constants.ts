import { defineCategoryMap } from "~/config";

export const SITE_URL = "https://vidik.si";
export const SITE_NAME = "Vidik";
export const SITE_LOCALE = "sl-SI";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/meta-image.png`;
/** Stable brand mark for Organization JSON-LD (not the social OG image). */
export const ORGANIZATION_LOGO_URL = `${SITE_URL}/android-chrome-512x512.png`;
export const TWITTER_HANDLE = "@VidikSLO";
export const TWITTER_URL = "https://twitter.com/VidikSLO";

export const SITE_DESCRIPTION =
  "Platforma za objektivno spremljanje slovenskih novic. Združuje poročanje različnih medijev o istih dogodkih in prikazuje medijsko pristranskost.";

export const DEFAULT_KEYWORDS =
  "vidik, vidik slovenija, politika, novice, slovenska politika, pristranskost medijev, objektivne novice, news aggregator slovenia";

export type CategorySeo = {
  title: string;
  description: string;
  keywords: string;
};

export const CATEGORY_SEO = defineCategoryMap<CategorySeo>({
  politika: {
    title: "Politika | Vidik",
    description:
      "Slovenske in mednarodne politične novice z vseh medijskih vidikov. Primerjajte, kako različni mediji poročajo o istih političnih dogodkih.",
    keywords:
      "politika, slovenska politika, politične novice, medijska pristranskost, vidik",
  },
  gospodarstvo: {
    title: "Gospodarstvo | Vidik",
    description:
      "Novice o slovenskem in svetovnem gospodarstvu iz več virov. Spremljajte poslovne in finančne zgodbe z različnih medijskih zornih kotov.",
    keywords: "gospodarstvo, finance, poslovne novice, ekonomija, vidik",
  },
  kriminal: {
    title: "Kriminal | Vidik",
    description:
      "Novice o kriminalu in sodnih zadevah v Sloveniji, združene iz več medijev za celovitejši pogled.",
    keywords: "kriminal, sodstvo, policija, varnost, vidik",
  },
  lokalno: {
    title: "Lokalno | Vidik",
    description:
      "Lokalne novice iz slovenskih krajev in občin. Primerjajte lokalno poročanje različnih medijev.",
    keywords: "lokalne novice, občine, lokalno, Slovenija, vidik",
  },
  sport: {
    title: "Šport | Vidik",
    description:
      "Športne novice iz Slovenije in tujine z več medijskih virov na enem mestu.",
    keywords: "šport, športne novice, rezultati, vidik",
  },
  "tehnologija-znanost": {
    title: "Tehnologija & Znanost | Vidik",
    description:
      "Novice o tehnologiji, znanosti in inovacijah iz več slovenskih medijev.",
    keywords: "tehnologija, znanost, inovacije, IT, vidik",
  },
  kultura: {
    title: "Kultura | Vidik",
    description:
      "Kulturne novice, dogodki in umetnost v Sloveniji — poročanje z več medijskih vidikov.",
    keywords: "kultura, umetnost, dogodki, vidik",
  },
  zdravje: {
    title: "Zdravje | Vidik",
    description:
      "Novice o zdravstvu in zdravju iz več slovenskih medijev za boljši pregled teme.",
    keywords: "zdravje, zdravstvo, medicina, vidik",
  },
  okolje: {
    title: "Okolje | Vidik",
    description:
      "Okoljske novice in podnebne teme v Sloveniji, združene iz različnih medijskih virov.",
    keywords: "okolje, podnebje, ekologija, vidik",
  },
});
