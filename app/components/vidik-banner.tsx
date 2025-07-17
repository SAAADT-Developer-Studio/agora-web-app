import Banner, { type BannerProps } from "./ui/banner";

export enum VidikBannerType {
  CONTACT = "contact",
  SWIPE = "swipe",
  DONATE = "donate",
  POLITICS = "politics",
}

type VidikBannerProps = {
  type: VidikBannerType;
};

const VidikBannerRecord: Record<VidikBannerType, BannerProps> = {
  [VidikBannerType.CONTACT]: {
    title: "Imaš predloge za izboljšanje te platforme?",
    description: "Kontaktiraj nas in povej svojo idejo!",
    buttonText: "Pojdi",
    logoType: "message",
  },
  [VidikBannerType.SWIPE]: {
    title: "Glasuj na kateri strani so novice!",
    description:
      "Igra v kateri povlečeš levo, desno ali gor, da glasuješ kam spadajo najbolj popularne novice.",
    buttonText: "Pojdi",
    logoType: "swipe",
  },
  [VidikBannerType.DONATE]: {
    title: "Pomagaj pri rasti naše platforme!",
    description:
      "Doniraj in pomagaj pri rasti in izboljšavi te spletne strani.",
    buttonText: "Pojdi",
    logoType: "coffee",
    coffee: true,
  },
  [VidikBannerType.POLITICS]: {
    title: "Se počutiš izgubljeno ali neveš veliko o politiki?",
    description:
      "Brez skrbi! Samo zate smo pripravili predstavitev, kjer te poučimo o politiki in kaj vsaka stran predstavlja.",
    buttonText: "Pojdi",
    logoType: "book",
  },
};

export function VidikBanner({ type }: Readonly<VidikBannerProps>) {
  return <Banner {...VidikBannerRecord[type]} />;
}
