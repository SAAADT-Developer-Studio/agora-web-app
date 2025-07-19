import type { Route } from "./+types/layout";

import { Outlet } from "react-router";
import Footer from "~/components/footer";
import { Header } from "~/components/header";

export default function RootLayout({}: Route.ComponentProps) {
  return (
    <>
      <Header />

      <main className="bg-background mx-auto mt-4 h-full w-full max-w-[1200px] flex-1 py-4">
        <Outlet />
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </>
  );
}
