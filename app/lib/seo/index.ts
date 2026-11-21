import type { MetaDescriptor } from "react-router";
import {
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "./constants";
import { organizationJsonLd, websiteJsonLd } from "./jsonLd";

export {
  SITE_URL,
  SITE_NAME,
  SITE_LOCALE,
  DEFAULT_OG_IMAGE,
  ORGANIZATION_LOGO_URL,
  TWITTER_HANDLE,
  SITE_DESCRIPTION,
  DEFAULT_KEYWORDS,
  CATEGORY_SEO,
} from "./constants";

export {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  newsArticleJsonLd,
  collectionPageJsonLd,
  newsMediaOrganizationJsonLd,
  faqPageJsonLd,
} from "./jsonLd";

type SeoInput = {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  ogType?: "website" | "article";
  keywords?: string;
  noindex?: boolean;
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  alternates?: Array<{ href: string; hrefLang: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  authors?: string[];
  /** When false, skips site-wide WebSite/Organization JSON-LD (e.g. lean error pages). */
  includeSiteSchema?: boolean;
  jsonLd?: object[];
};

export function getSeoMetas({
  title,
  description,
  pathname,
  image = DEFAULT_OG_IMAGE,
  ogType = "website",
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
  locale = SITE_LOCALE,
  siteName = SITE_NAME,
  twitterHandle = TWITTER_HANDLE,
  alternates = [],
  publishedTime,
  modifiedTime,
  section,
  authors = [],
  includeSiteSchema = true,
  jsonLd = [],
}: SeoInput): MetaDescriptor[] {
  const url = new URL(pathname || "/", SITE_URL).href;
  const ogImage = image || DEFAULT_OG_IMAGE;

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
    { property: "og:image", content: ogImage },
    { property: "og:image:secure_url", content: ogImage },
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
    ...(ogType === "article" && section
      ? [{ property: "article:section", content: section } as MetaDescriptor]
      : []),
    ...(ogType === "article"
      ? authors.map(
          (author) =>
            ({
              property: "article:author",
              content: author,
            }) as MetaDescriptor,
        )
      : []),

    {
      name: "twitter:card",
      content: ogImage ? "summary_large_image" : "summary",
    },
    { name: "twitter:site", content: twitterHandle },
    { name: "twitter:creator", content: twitterHandle },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: title },

    { name: "application-name", content: siteName },
    { name: "apple-mobile-web-app-title", content: siteName },
  ];

  alternates.forEach(({ href, hrefLang }) => {
    metas.push({ tagName: "link", rel: "alternate", hrefLang, href });
  });

  const schemaBlocks = includeSiteSchema
    ? [websiteJsonLd(), organizationJsonLd(), ...jsonLd]
    : jsonLd;

  schemaBlocks.forEach((block) => {
    metas.push({ "script:ld+json": block } as unknown as MetaDescriptor);
  });

  return metas;
}
