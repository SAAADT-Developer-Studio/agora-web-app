import { PersonStanding } from "lucide-react";
import { SideCardContainer, SideCardHeader } from "~/components/ui/side-card";

export type Item = {
  name: string;
  image: string;
  description: string;
};

export type PeopleCardProps = {
  heading: string;
  items: Item[];
};

export function PeopleCard({ items, heading }: Readonly<PeopleCardProps>) {
  return (
    <SideCardContainer>
      <SideCardHeader>
        <PersonStanding className="h-6 w-6" />
        <p className="font-bold uppercase">{heading}</p>
      </SideCardHeader>
      {items.map((item, idx) => (
        <div
          key={item.name + "-" + idx}
          className="flex items-center gap-2 border-b border-black/5 p-4 transition-colors hover:bg-black/[3%] dark:border-white/5 dark:hover:bg-white/5"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <p className="p-sm">{item.name}</p>
            <div className="text-xs">{item.description}</div>
          </div>
        </div>
      ))}
    </SideCardContainer>
  );
}
