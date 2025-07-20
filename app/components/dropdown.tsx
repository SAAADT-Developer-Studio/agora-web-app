import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Grip, Mail, GalleryHorizontalEnd, Book } from "lucide-react";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Grip size={28} className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-background color-primary border-primary/50 border-1"
        align="end"
        sideOffset={15}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-foreground cursor-pointer">
            <GalleryHorizontalEnd />
            Swiper
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-foreground cursor-pointer">
            <Book />
            Politika
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-foreground cursor-pointer">
            <Mail />
            Kontakt
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
