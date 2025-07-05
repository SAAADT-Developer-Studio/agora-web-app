import { Icon } from "~/components/icon";
import logo from "~/assets/logo.svg";
import { ThemeSwitch } from "~/components/theme-switch";

export function Header() {
  const categories = ["Vse", "Slovenija", "Evropa", "Svet", "Tehnologija"];
  return (
    <header className="bg-gray-900 text-white">
      <div className="flex h-[58px] justify-between p-4">
        <Icon href={logo} className="h-6 w-20 fill-current" />
        <div className="flex gap-3">
          <button className="border">Prijava</button>
          <ThemeSwitch />
        </div>
      </div>
      <div className="flex justify-center bg-gray-800 p-3">
        <div className="flex w-full max-w-[1280px] gap-3">
          {categories.map((category) => {
            return <div key={category}>{category}</div>;
          })}
        </div>
      </div>
    </header>
  );
}
