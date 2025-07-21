import CTA from "~/components/ui/CTA";
import Banner, { type BannerProps } from "./ui/banner";
import BuyCoffee from "~/assets/white-button.png";
import {
  Mail,
  Book,
  Coffee,
  ChartColumnStacked,
  GalleryHorizontalEnd,
} from "lucide-react";

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
    button: <CTA buttonText="Pojdi" />,
    iconComponent: Mail,
  },
  [VidikBannerType.SWIPE]: {
    title: "Glasuj na kateri strani so novice!",
    description:
      "Igra v kateri povlečeš levo, desno ali gor, da glasuješ kam spadajo najbolj popularne novice.",
    button: <CTA buttonText="Pojdi" />,
    iconComponent: GalleryHorizontalEnd,
  },
  [VidikBannerType.DONATE]: {
    title: "Pomagaj pri rasti naše platforme!",
    description:
      "Doniraj in pomagaj pri rasti in izboljšavi te spletne strani.",
    button: (
      <img src={BuyCoffee} alt="Buy Coffee" className="w-30 drop-shadow-lg" />
    ),
    iconComponent: Coffee,
  },
  [VidikBannerType.POLITICS]: {
    title: "Se počutiš izgubljeno v svetu politike?",
    description:
      "Brez skrbi! Samo zate smo pripravili predstavitev, kjer te poučimo o politiki in kaj vsaka stran predstavlja.",
    button: <CTA buttonText="Pojdi" />,
    iconComponent: Book,
  },
};

export function VidikBanner({ type }: Readonly<VidikBannerProps>) {
  return <Banner {...VidikBannerRecord[type]} />;
}
