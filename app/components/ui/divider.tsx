import { href, Link } from "react-router";

export default function Divider({
  text,
  reverse,
  categoryKey,
}: Readonly<{ text?: string; reverse?: boolean; categoryKey: string }>) {
  return (
    <Link
      to={href("/:category", { category: categoryKey })}
      className="col-span-full w-fit pt-4 text-lg font-normal hover:underline focus:underline dark:font-bold"
    >
      {text}
    </Link>
  );
}
