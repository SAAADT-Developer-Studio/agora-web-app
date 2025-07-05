import type { Route } from "./+types/home";
import { Header } from "~/components/header";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vidik" },
    { name: "description", content: "Welcome to Vidik!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex h-full flex-col justify-center">
      <Header />
      <main className="mx-auto mt-4 h-full w-full max-w-[1280px] flex-1 bg-gray-900 p-4"></main>
    </div>
  );
}
