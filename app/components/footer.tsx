import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary mt-20 flex items-center justify-center">
      <div className="w-[1200px] px-4 py-12">
        <div className="flex justify-between">
          <div>
            <h3 className="pb-2 text-lg font-semibold tracking-wide">Vidik</h3>
            <p className="text-primary w-2/3 pb-2 text-sm">
              Providing insightful perspectives and thoughtful analysis on
              topics that matter.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link
                to="#"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                to="#"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                to="#"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                to="#"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Mail size={20} />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div className="w-1/3">
            <h3 className="pb-2 text-lg font-semibold tracking-wide">
              Quick Links
            </h3>
            <ul className="text-primary space-y-2 text-sm">
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Uvod v Politiko
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Swiper
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Doniraj
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-1/3">
            <h3 className="pb-2 text-lg font-semibold tracking-wide">
              Kontakt & Podpora
            </h3>
            <ul className="text-primary space-y-2 text-sm">
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Kontakt
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-primary/40 text-primary/40 mt-12 flex flex-col items-center justify-between border-t pt-8 text-sm md:flex-row">
          <p>@vidik.si - {new Date().getFullYear()}</p>
          <p className="mt-4 md:mt-0">All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
