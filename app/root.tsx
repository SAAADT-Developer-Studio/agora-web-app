import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ErrorComponent } from "~/components/error-component";
import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "sonner";

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
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sarabun:wght@500;600;700&display=swap",
  },
];

function initTheme() {
  let theme = localStorage.getItem("theme");
  if (!theme) {
    theme = window.matchMedia(`(prefers-color-scheme: dark)`).matches
      ? `dark`
      : `light`;
  } else {
    theme = JSON.parse(theme) as string;
  }
  document.documentElement.classList.add(theme);
  localStorage.setItem("theme", JSON.stringify(theme));
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          suppressHydrationWarning
        >{`(${initTheme.toString()})()`}</script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#FFFFFF" />

        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        {import.meta.env.PROD && (
          <script suppressHydrationWarning>
            {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_iJYlDXqJPqKDriu5OGgnHigHIm9I9XNOnxEA1DAGWFb',{api_host:'https://ingest.vidik.si', defaults:'2025-05-24'})`}
          </script>
        )}
        <script
          suppressHydrationWarning
          defer
          src="https://feedback.fish/ff.js?pid=2229bcd6f37be1"
        ></script>

        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", JSON.stringify(userId));
    }
    window.posthog?.identify(
      userId,
      { last_visit_date: new Date() }, // updates every time
      { created_date: new Date() }, // sets only once
    );
  }, []);

  return (
    // This suspense is here so that in case of hydration errors, react does not rerender the head (it only rerenders from the closest Suspense boundary down)
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <TooltipProvider>
          <Toaster />
          <Outlet />
        </TooltipProvider>
      </Suspense>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
