import type { Route } from "./+types/layout";

import { Outlet } from "react-router";
import { Header } from "~/components/header";

export default function RootLayout({}: Route.ComponentProps) {
    return (
        <div className="h-full">
            <Header />

            <main className="bg-primary mx-auto mt-4 h-full w-full max-w-[1200px] flex-1 p-4">
                <Outlet />
            </main>
        </div>
    );
}
