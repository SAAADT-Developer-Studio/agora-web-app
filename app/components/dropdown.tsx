import { Grip } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function Dropdown({
  items,
  trigger,
}: {
  items: { label: string; to: string; icon?: React.ReactNode }[];
  trigger?: ReactElement;
}) {
  return (
    <DropdownMenu modal={false}>
      {trigger ? (
        <DropdownMenuTrigger render={trigger} />
      ) : (
        <DropdownMenuTrigger className="cursor-pointer" aria-label="Meni">
          <Grip size={28} />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        className="bg-surface text-primary border-primary/10 translate-x-[10px] border"
        align="end"
        sideOffset={15}
      >
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.to}
              className="hover:bg-surface cursor-pointer"
              render={<Link to={item.to} />}
            >
              {item.icon ?? null}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
