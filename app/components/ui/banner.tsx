import {
  Mail,
  Book,
  Coffee,
  ChartColumnStacked,
  GalleryHorizontalEnd,
} from "lucide-react";

import BuyCoffee from "~/assets/white-button.png";
import CTA from "./CTA";

export type BannerProps = {
  title: string;
  description: string;
  buttonText: string;
  logoType: "book" | "message" | "swipe" | "coffee";
  coffee?: boolean;
};

type LogoComponentProps = {
  type: "book" | "message" | "swipe" | "coffee";
  className?: string;
};

const logoComponents = {
  book: Book,
  message: Mail,
  swipe: GalleryHorizontalEnd,
  category: ChartColumnStacked,
  coffee: Coffee,
};

export function LogoComponent({
  type,
  className,
}: Readonly<LogoComponentProps>) {
  const IconComponent = logoComponents[type];
  return <IconComponent className={className} />;
}

export default function Banner(props: Readonly<BannerProps>) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 flex h-[170px] flex-col items-end justify-between rounded-lg border-1 p-4 sm:col-span-full dark:border-0">
      <div className="flex w-full flex-col">
        <div className="flex w-full items-start justify-between">
          <p className="p-lg">{props.title}</p>
          <LogoComponent type={props.logoType} className="h-6 w-6" />
        </div>
        <p className="p-sm-regular w-[40%] pt-2">{props.description}</p>
      </div>

      {props.coffee ? (
        <img src={BuyCoffee} alt="Buy Coffee" className="w-30 drop-shadow-lg" />
      ) : (
        <CTA buttonText={props.buttonText} />
      )}
    </div>
  );
}
