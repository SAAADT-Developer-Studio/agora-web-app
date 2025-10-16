import { cn } from "~/lib/utils";

export default function Divider({
  text,
  reverse,
}: Readonly<{ text?: string; reverse?: boolean }>) {
  return (
    <div className="col-span-full pt-4 text-lg font-normal dark:font-bold">
      {text}
    </div>
  );
}
