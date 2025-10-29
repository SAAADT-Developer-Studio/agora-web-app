import type { MetaDescriptor } from "react-router";

type SeoInput = {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  ogType?: "website" | "article" | string;
  keywords?: string;
  noindex?: boolean;
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  alternates?: Array<{ href: string; hrefLang: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: object[];
};

export function getSeoMetas({
  title,
  description,
  pathname,
  image = "https://vidik.si/meta-image.png",
  ogType = "website",
  keywords = "vidik, vidik slovenija, politika, novice, slovenska politika, pristranskost medijev, objektivne novice, news aggregator slovenia",
  noindex = false,
  locale = "sl_SI",
  siteName = "Vidik",
  twitterHandle = "@VidikSLO",
  alternates = [],
  publishedTime,
  modifiedTime,
  jsonLd = [],
}: SeoInput): MetaDescriptor[] {
  const url = new URL(pathname || "/", "https://vidik.si").href;

  const metas: MetaDescriptor[] = [
    { title },

    { name: "description", content: description },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),

    {
      name: "robots",
      content: noindex
        ? "noindex, nofollow, noarchive"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },

    { tagName: "link", rel: "canonical", href: url },

    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    { property: "og:locale", content: locale },
    { property: "og:site_name", content: siteName },
    ...(ogType === "article" && publishedTime
      ? [
          {
            property: "article:published_time",
            content: publishedTime,
          } as MetaDescriptor,
        ]
      : []),
    ...(ogType === "article" && modifiedTime
      ? [
          {
            property: "article:modified_time",
            content: modifiedTime,
          } as MetaDescriptor,
        ]
      : []),

    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },
    { name: "twitter:site", content: twitterHandle },
    { name: "twitter:creator", content: twitterHandle },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: title },

    { name: "application-name", content: siteName },
    { name: "apple-mobile-web-app-title", content: siteName },
  ];

  alternates.forEach(({ href, hrefLang }) => {
    metas.push({ tagName: "link", rel: "alternate", hrefLang, href });
  });

  const baseJsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: "https://vidik.si",
      inLanguage: "sl-SI",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: "https://vidik.si",
      logo: image,
      sameAs: ["https://twitter.com/VidikSLO"],
      description: "Platforma za objektivno spremljanje slovenskih novic",
    },
  ];

  [...baseJsonLd, ...jsonLd].forEach((block) => {
    metas.push({ "script:ld+json": block } as unknown as MetaDescriptor);
  });

  return metas;
}
