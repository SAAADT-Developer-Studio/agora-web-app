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

      <main className="content-sheet mx-auto mt-3 mb-6 h-full w-full max-w-[1200px] flex-1 rounded-2xl px-3 py-4 backdrop-blur-sm md:mt-5 md:mb-8 md:px-6 md:py-6 dark:backdrop-blur-none">
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
