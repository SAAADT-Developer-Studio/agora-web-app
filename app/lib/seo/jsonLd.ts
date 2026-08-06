import {
  ORGANIZATION_LOGO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TWITTER_URL,
} from "./constants";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: ORGANIZATION_LOGO_URL,
      width: 512,
      height: 512,
    },
    sameAs: [TWITTER_URL],
    description: SITE_DESCRIPTION,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "sl-SI",
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE_URL).href,
    })),
  };
}

export function newsArticleJsonLd({
  headline,
  description,
  image,
  url,
  datePublished,
  dateModified,
  keywords,
  section,
  sources,
}: {
  headline: string;
  description: string;
  image?: string;
  url: string;
  datePublished: string;
  dateModified: string;
  keywords?: string[];
  section?: string;
  sources: Array<{
    title: string;
    url: string;
    publishedAt: string;
    providerName: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    description,
    image: image ? [image] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    datePublished,
    dateModified,
    inLanguage: "sl-SI",
    articleSection: section,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION_LOGO_URL,
      },
    },
    citation: sources.map((source) => ({
      "@type": "NewsArticle",
      headline: source.title,
      url: source.url,
      datePublished: source.publishedAt,
      author: {
        "@type": "NewsMediaOrganization",
        name: source.providerName,
      },
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: "sl-SI",
  };
}

export function newsMediaOrganizationJsonLd({
  name,
  url,
  description,
  logo,
  sameAs,
}: {
  name: string;
  url: string;
  description: string;
  logo?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name,
    url,
    description,
    logo: logo
      ? {
          "@type": "ImageObject",
          url: logo,
        }
      : undefined,
    sameAs: sameAs?.length ? sameAs : undefined,
  };
}

export function faqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
