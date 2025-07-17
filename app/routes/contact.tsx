import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/contact";

export function loader({ params }: Route.LoaderArgs) {}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
// }

export default function ContactPage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Contact Page</h1>
      <p>This is a placeholder for the contact content.</p>
    </div>
  );
}

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: "Contact | Vidik.si",
      name: "description",
      content: "Explore various categories of articles.",
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
