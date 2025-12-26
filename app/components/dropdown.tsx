import { Grip } from "lucide-react";
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
  trigger?: React.ReactNode;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {trigger ?? <Grip size={28} className="cursor-pointer" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-surface color-primary border-primary/10 translate-x-[10px] border-1"
        align="end"
        sideOffset={15}
      >
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              asChild
              className="hover:bg-surface cursor-pointer"
              key={item.to}
            >
              <Link to={item.to}>
                {item.icon ?? ""}
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
