import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./routes/layout.tsx", [
    index("./routes/home.tsx"),
    route("contact", "./routes/contact.tsx"),
    route("donate", "./routes/donate.tsx"),
    route("article/:articleId", "./routes/article.tsx"),
    route(":category", "./routes/category.tsx"),
  ]),
] satisfies RouteConfig;
