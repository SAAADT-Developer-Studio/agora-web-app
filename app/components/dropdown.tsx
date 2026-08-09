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
  trigger?: React.ReactElement;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          trigger ?? (
            <button type="button" aria-label="Odpri meni">
              <Grip size={28} />
            </button>
          )
        }
      />
      <DropdownMenuContent
        className="translate-x-[10px]"
        align="end"
        sideOffset={15}
      >
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem render={<Link to={item.to} />} key={item.to}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
