import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function CTA({ buttonText }: Readonly<{ buttonText: string }>) {
  return (
    <Link to="/todo">
      <div className="text-vidikwhite bg-electricblue hover:bg-electricblue-light flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 drop-shadow-lg transition-colors">
        <p className="text-sm font-semibold uppercase">{buttonText}</p>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
