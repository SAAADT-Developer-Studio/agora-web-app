import { createLucideIcon, Facebook, Instagram, Mail } from "lucide-react";
import { cn } from "~/lib/utils";

export const XIcon = createLucideIcon("X", [
  [
    "path",
    {
      d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
      stroke: "none",
      fill: "currentColor",
      key: "x-logo",
    },
  ],
]);

export const SOCIALS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1BHYtu1oJB/?mibextid=wwXIfr",
    icon: Facebook,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/vidikslo?igsh=MTNnMW1vYXQyYXpvMQ%3D%3D&utm_source=qr",
    icon: Instagram,
  },
  { name: "X", href: "https://x.com/VidikSlo", icon: XIcon },
  { name: "E-pošta", href: "mailto:info@vidik.si", icon: Mail },
];

export function SocialLinks({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SOCIALS.map(({ name, href: url, icon: Icon }) => (
        <a
          key={name}
          href={url}
          target={url.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer"
          aria-label={name}
          className={cn(
            "text-surface-text/60 hover:text-surface-text hover:bg-primary/5 grid size-9 place-items-center rounded-full transition-colors",
            linkClassName,
          )}
        >
          <Icon size={18} aria-hidden />
        </a>
      ))}
    </div>
  );
}
