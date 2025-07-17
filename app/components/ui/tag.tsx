export default function Tag({
  text,
  big,
}: Readonly<{ text: string; big?: boolean }>) {
  return (
    <div
      className={`bg-primary text-salmon p-xs flex items-center justify-center rounded-md px-2 py-1 uppercase opacity-70`}
    >
      {text}
    </div>
  );
}
