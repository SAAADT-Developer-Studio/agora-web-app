import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./routes/layout.tsx", [
    index("./routes/home.tsx"),
    route("contact", "./routes/contact.tsx"),
    route("donate", "./routes/donate.tsx"),
    route("politika-zasebnosti", "./routes/privacy-policy.tsx"),
    route("providers", "./routes/providers.tsx"),
    route("provider/:providerKey", "./routes/provider.tsx"),
    ...prefix(":category", [
      index("./routes/category.tsx"),
      route("article/:articleId", "./routes/article.tsx"),
    ]),
    ...prefix("api", [
      route("category/:category", "./routes/api/category.ts"),
      route("populate-cache", "./routes/api/populate-cache.ts"),
    ]),
  ]),
  route("sitemap.xml", "./routes/sitemap.ts"),
] satisfies RouteConfig;
