import { useState } from "react";
import { Grip } from "lucide-react";
import logo from "~/assets/logo.svg";
import { ThemeSwitch } from "~/components/theme-switch";
import Coffee from "~/assets/black-button.png";
import { Dropdown } from "./ui/dropdown";

export function Header() {
  const [open, setOpen] = useState(false);
  const categories = [
    "AKTUALNO",
    "POLITIKA",
    "GOSPODARSTVO",
    "KRIMINAL",
    "ŠPORT",
    "KULTURA",
    "ZDRAVJE",
    "OKOLJE",
    "LOKALNO",
  ];
  return (
    <header className="bg-primary">
      <div className="flex h-[58px] items-center justify-between px-4 py-8">
        <img src={logo} alt="logo" className="h-6 w-20" />
        <div className="flex items-center gap-3">
          <img src={Coffee} alt="coffee" className="h-8" />
          <ThemeSwitch />
          <button onClick={() => setOpen((prev) => !prev)}>
            <Grip size={28} />
          </button>
          <Dropdown open={open} onClose={() => setOpen(false)} />
        </div>
      </div>
      <div className="bg-secondary flex justify-center px-6 py-4">
        <div className="flex w-[1200px] gap-8">
          {categories.map((category) => {
            return (
              <p className="p-sm-regular" key={category}>
                {category}
              </p>
            );
          })}
        </div>
      </div>
    </header>
  );
}
