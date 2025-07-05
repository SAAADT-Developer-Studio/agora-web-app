import { Icon } from "~/components/icon";
import logo from "~/assets/logo.svg";

export function Header() {
  const categories = ["Vse", "Slovenija", "Evropa", "Svet", "Tehnologija"];
  return (
    <header className="bg-gray-900 text-white">
      <div className="flex justify-between p-4">
        <Icon href={logo} className="h-6 w-20 fill-current" />
        <div className="flex gap-3">
          <button className="border">Prijava</button>
          <button className="border">light/dark switch</button>
        </div>
      </div>
      <div className="flex justify-center bg-gray-800 p-3">
        <div className="flex w-full max-w-[1280px] gap-3">
          {categories.map((category) => {
            return <div>{category}</div>;
          })}
        </div>
      </div>
    </header>
  );
}
