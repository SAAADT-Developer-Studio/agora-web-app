import { createLucideIcon, Facebook, Instagram, Mail } from "lucide-react";
import { href, Link, NavLink } from "react-router";

const XIcon = createLucideIcon("X", [
  [
    "path",
    {
      d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
      stroke: "none",
      fill: "currentColor",
    },
  ],
]);

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary mt-20 flex items-center justify-center">
      <div className="w-[1200px] px-4 py-12">
        <div className="flex flex-col items-start justify-around gap-8 md:flex-row md:justify-between md:gap-0">
          <div className="w-full md:w-1/2">
            <h3 className="pb-2 text-lg font-semibold tracking-wide">Vidik</h3>
            <p className="text-primary w-full pb-2 text-sm md:w-2/3">
              Odkrij, kako različni slovenski mediji poročajo o istih novicah.
              Naša platforma razkriva medijsko pristranskost in pomaga razumeti
              zgodbo z vseh političnih <b>vidikov</b>.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://www.facebook.com/share/1BHYtu1oJB/?mibextid=wwXIfr"
                target="_blank"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/vidikslo?igsh=MTNnMW1vYXQyYXpvMQ%3D%3D&utm_source=qr"
                target="_blank"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://x.com/VidikSlo"
                target="_blank"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <XIcon size={20} />
                <span className="sr-only">X</span>
              </a>
              <a
                href="mailto:info@vidik.si"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                <Mail size={20} />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <h3 className="pb-2 text-lg font-semibold tracking-wide">
              Hitre Povezave
            </h3>
            <ul className="text-primary space-y-2 text-sm">
              <li>
                <Link
                  to={href("/metodologija")}
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Kako smo klasificirali medije?
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h3 className="pb-2 text-lg font-semibold tracking-wide">Drugo</h3>
            <ul className="text-primary space-y-2 text-sm">
              <li>
                <Link
                  to={href("/kontakt")}
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Kontakt & Podpora
                </Link>
              </li>
              <li>
                <NavLink
                  to={href("/politika-zasebnosti")}
                  className="text-primary/70 hover:text-primary transition-colors active:text-black"
                >
                  Politika zasebnosti
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-primary/40 text-primary/40 mt-12 flex flex-col items-center justify-between border-t pt-8 text-sm md:flex-row">
          <p>@vidik.si - {new Date().getFullYear()}</p>
          <p className="mt-4 md:mt-0">Vse pravice pridržane.</p>
        </div>
      </div>
    </footer>
  );
}
