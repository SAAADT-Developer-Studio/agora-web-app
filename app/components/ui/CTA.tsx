import { ArrowRight } from "lucide-react";
export default function CTA({ buttonText }: Readonly<{ buttonText: string }>) {
  return (
    <div className="bg-salmon text-vidikwhite flex items-center justify-center gap-2 rounded-lg p-2 drop-shadow-lg">
      <p className="p-sm uppercase">{buttonText}</p>
      <ArrowRight size={16} />
    </div>
  );
}
