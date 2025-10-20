import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/contact";
import { getSeoMetas } from "~/lib/seo";

export function loader({ params }: Route.LoaderArgs) {}

export default function ContactPage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Contact Page</h1>
      <p>This is a placeholder for the contact content.</p>
    </div>
  );
}

export function meta({
  params,
  location,
}: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Kontakt | Vidik",
    description:
      "Kontaktirajte nas za vprašanja, predloge, podporo ali dodatne informacije.",
    pathname: location.pathname,
    ogType: "website",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
