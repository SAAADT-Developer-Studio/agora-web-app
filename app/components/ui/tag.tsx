export default function Tag({ text, big }: { text: string; big?: boolean }) {
  return (
    <div
      className={`p-xs text-vidikwhite bg-electricblue flex items-center justify-center rounded-md px-2 py-1 uppercase shadow-sm`}
    >
      {text}
    </div>
  );
}
