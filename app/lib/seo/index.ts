import type { MetaDescriptor } from "react-router";

export function getSeoMetas({
  title,
  description,
  keywords = "vidik, politika, novice, slovenska politika, politična obarvanost",
  image = "https://vidik.si/meta-image.png",
  pathname = "/",
  ogType = "website",
}: {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  pathname?: string;
  ogType?: string;
}): MetaDescriptor[] {
  const url = new URL(pathname, "https://vidik.si").href;
  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "image", content: image },
    { name: "og:url", content: url },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    { name: "og:image", content: image },
    { name: "og:type", content: ogType },
    { name: "og:locale", content: "sl-SI" },
    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },
    { name: "twitter:creator", content: "@VidikSLO" },
    { name: "twitter:site", content: "@VidikSLO" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: title },

    { tagName: "link", rel: "canonical", href: url },
  ];
}
