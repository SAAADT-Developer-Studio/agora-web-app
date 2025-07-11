import { Icon } from "~/components/icon";
import { ThemeSwitch } from "~/components/theme-switch";

export function Header() {
  const categories = [
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
    <header className="bg-primary text-white">
      <div className="flex h-[58px] items-center justify-between px-4 py-8">
        <Icon name="logo" height={70} width={70} />
        <div className="flex gap-3">
          <ThemeSwitch />
        </div>
      </div>
      <div className="bg-secondary flex justify-center px-6 py-4">
        <div className="flex w-full items-center justify-between">
          {categories.map((category) => {
            return (
              <p className="p-sm-light" key={category}>
                {category}
              </p>
            );
          })}
        </div>
      </div>
    </header>
  );
}
