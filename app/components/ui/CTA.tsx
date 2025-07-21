import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function CTA({ buttonText }: Readonly<{ buttonText: string }>) {
  return (
    <Link to="/todo">
      <div className="text-vidikwhite flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 p-2 drop-shadow-lg hover:bg-[#2267fc]">
        <p className="p-sm uppercase">{buttonText}</p>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
