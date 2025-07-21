import type { Route } from "./+types/donate";
import { ErrorComponent } from "~/components/error-component";

export function loader({ params }: Route.LoaderArgs) {}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
// }

export default function DonatePage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Donate Page</h1>
      <p>Serverji niso zaston</p>
    </div>
  );
}

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: "Doniraj | Vidik",
      name: "description",
      content: "Doniraj za podporo projektu Vidik.",
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
