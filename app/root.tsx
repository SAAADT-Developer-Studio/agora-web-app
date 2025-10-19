import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ErrorComponent } from "~/components/error-component";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "~/components/ui/tooltip";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

function initTheme() {
  let theme = localStorage.getItem("theme");
  if (!theme) {
    const systemTheme = window.matchMedia(`(prefers-color-scheme: dark)`)
      .matches
      ? `dark`
      : `light`;
    theme = systemTheme;
  } else {
    theme = JSON.parse(theme) as string;
  }
  document.documentElement.classList.add(theme);
  localStorage.setItem("theme", JSON.stringify(theme));
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {import.meta.env.PROD && (
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id="9a07a807-cf46-4e37-96ef-48802444366e"
          ></script>
        )}
        <script
          suppressHydrationWarning
        >{`(${initTheme.toString()})()`}</script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body>
        {children}
        <ScrollRestoration
          getKey={(location, matches) => {
            // Use the pathname as the key for scroll restoration to prevent scroll resets when changing search params
            return location.pathname;
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    // This suspense is here so that in case of hydration errors, react does not rerender the head (it only rerenders from the closest Suspense boundary down)
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </Suspense>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
