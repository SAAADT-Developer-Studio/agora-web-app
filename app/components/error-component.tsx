import { isRouteErrorResponse, Link, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { ErrorUI } from "~/components/ui/error-ui";

export function ErrorComponent({ error }: { error: unknown }) {
  let message = "Ups!";
  let details = "Prišlo je do nepričakovane napake.";
  let stack: string | undefined;
  const showHomeLink = useLocation().pathname !== "/";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Napaka";
    details =
      error.status === 404
        ? "Stran ni bila najdena."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto flex flex-col items-center justify-center p-4 pt-16">
      <ErrorUI message={details} size="large" />
      {import.meta.env.PROD && stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
      {showHomeLink && (
        <Button asChild className="w-fit">
          <Link to="/">Nazaj na domačo stran</Link>
        </Button>
      )}
    </main>
  );
}
