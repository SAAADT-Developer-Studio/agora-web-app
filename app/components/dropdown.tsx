import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Grip, Mail, GalleryHorizontalEnd, Book } from "lucide-react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function Dropdown() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Grip size={28} className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-background color-primary border-primary/10 translate-x-[10px] border-1"
        align="end"
        sideOffset={15}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="hover:bg-foreground cursor-pointer"
          >
            <Link to="/todo">
              <GalleryHorizontalEnd />
              Swiper
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="hover:bg-foreground cursor-pointer"
          >
            <Link to="/todo">
              <Book />
              Politika
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="hover:bg-foreground cursor-pointer"
          >
            <Link to="/contact">
              <Mail />
              Kontakt
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
