import { ArrowRight } from "lucide-react";
export default function CTA({ buttonText }: Readonly<{ buttonText: string }>) {
  return (
    <div className="bg-salmon text-vidikwhite flex cursor-pointer items-center justify-center gap-2 rounded-lg p-2 drop-shadow-lg transition-transform duration-300 hover:scale-[1.05]">
      <p className="p-sm uppercase">{buttonText}</p>
      <ArrowRight size={16} />
    </div>
  );
}
