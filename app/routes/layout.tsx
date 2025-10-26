import type { Route } from "./+types/layout";

import { Outlet } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import Footer from "~/components/footer";
import { Header } from "~/components/header";
import { TutorialPopup } from "~/components/tutorial-popup";

export default function RootLayout({}: Route.ComponentProps) {
  return (
    <>
      <Header />

      <main className="mx-auto h-full w-full max-w-[1200px] flex-1 px-3 py-4 md:mt-4 md:px-6">
        <Outlet />
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      <TutorialPopup />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
