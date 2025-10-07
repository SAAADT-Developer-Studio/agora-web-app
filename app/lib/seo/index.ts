import type { MetaDescriptor } from "react-router";

export function getSeoMetas({
  title,
  description,
  keywords = "vidik, politika, novice, slovenska politika, politična obarvanost",
  image = "",
  url = "https://vidik.si",
  ogType = "website",
}: {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  ogType?: string;
}): MetaDescriptor[] {
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
    // { name: "twitter:creator", content: "@vidik" },
    // { name: "twitter:site", content: "@vidik" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: title },

    { tagName: "link", rel: "canonical", href: url },
  ];
}
