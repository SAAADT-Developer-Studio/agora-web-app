import { href, Link } from "react-router";

export default function Divider({
  text,
  categoryKey,
}: Readonly<{ text?: string; reverse?: boolean; categoryKey: string }>) {
  return (
    <Link
      to={href("/:category", { category: categoryKey })}
      className="text-foreground hover:text-bias-right col-span-full w-fit pt-4 text-lg font-semibold tracking-wide uppercase transition-colors hover:underline focus:underline"
    >
      {text}
    </Link>
  );
}
