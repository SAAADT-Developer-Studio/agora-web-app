import { href, Link } from "react-router";
import type { CategoryKeyValue } from "~/config";

export default function Divider({
  text,
  categoryKey,
}: Readonly<{
  text?: string;
  reverse?: boolean;
  categoryKey: CategoryKeyValue;
}>) {
  return (
    <Link
      to={href("/:category", { category: categoryKey })}
      className="col-span-full w-fit pt-4 text-lg font-normal hover:underline focus:underline dark:font-bold"
    >
      {text}
    </Link>
  );
}
