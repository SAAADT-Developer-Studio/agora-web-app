import { PersonStanding } from "lucide-react";

type Person = {
  name: string;
  description: string;
  image: string;
};
export type HighlightedPeopleProps = {
  people: Person[];
};

export default function HighlightedPeople({
  people,
}: Readonly<HighlightedPeopleProps>) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 col-span-1 row-span-2 flex flex-col rounded-lg border-1 dark:border-0">
      <div className="flex w-full items-center justify-start gap-2 p-4">
        <PersonStanding className="h-6 w-6" />
        <p className="font-bold uppercase">Izpostavljene Osebe</p>
      </div>
      {people.map((person, idx) => (
        <div
          key={person.name + "-" + idx}
          className="flex items-center gap-2 border-b border-black/5 p-4 transition-colors hover:bg-black/[3%] dark:border-white/5 dark:hover:bg-white/5"
        >
          <img
            src={person.image}
            alt={person.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <p className="p-sm">{person.name}</p>
            <div className="text-xs">{person.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
