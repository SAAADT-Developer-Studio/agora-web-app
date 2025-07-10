export default function Tag({
  text,
  big,
}: Readonly<{ text: string; big?: boolean }>) {
  return (
    <div
      className={`bg-deepblue border-blue ${big ? "p-sm-light" : "p-xs-light"} flex ${big ? "h-7" : "h-5"} items-center justify-center rounded-xl px-4 opacity-70`}
    >
      {text}
    </div>
  );
}
