import { PersonStanding } from "lucide-react";

type Person = {
  name: string;
  image: string;
};
export type HighlightedPeopleProps = {
  people: Person[];
};

export default function HighlightedPeople({
  people,
}: Readonly<HighlightedPeopleProps>) {
  return (
    <div className="bg-foreground border-vidikdarkgray/20 col-span-1 row-span-2 flex flex-col rounded-lg border-1 dark:border-0">
      <div className="flex w-full items-center justify-start gap-2 p-4">
        <PersonStanding className="h-6 w-6" />
        <p className="p-sm uppercase">Izpostavljene Osebe</p>
      </div>
      {people.map((person, idx) => (
        <div
          key={person.name + "-" + idx}
          className="flex items-center gap-2 p-4"
        >
          <img
            src={person.image}
            alt={person.name}
            className="h-10 w-10 rounded-full"
          />
          <p className="p-sm">{person.name}</p>
        </div>
      ))}
    </div>
  );
}
