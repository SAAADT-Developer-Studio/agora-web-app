export default function Divider({
  text,
  reverse,
}: Readonly<{ text?: string; reverse?: boolean }>) {
  return (
    <div className="bg-primary-text relative col-span-full my-4 h-[2px]">
      {text && (
        <span
          className={`text-primary bg-primary absolute ${reverse ? "right-[16.6667%]" : "left-[16.6667%]"} -translate-y-[50%] px-2 text-lg uppercase`}
        >
          {text}
        </span>
      )}
    </div>
  );
}
