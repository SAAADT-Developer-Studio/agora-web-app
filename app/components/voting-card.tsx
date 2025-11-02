import { Globe, Vote } from "lucide-react";
import { SideCardContainer, SideCardHeader } from "./ui/side-card";
import { Await, Link } from "react-router";
import { href } from "react-router";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { getProviderImageUrl, ProviderImage } from "./provider-image";
import { ErrorUI } from "./ui/error-ui";
import { Suspense } from "react";
import { Spinner } from "./ui/spinner";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { cn } from "~/lib/utils";
import { Skeleton } from "./ui/skeleton";

type ProviderType = {
  name: string;
  key: string;
  url: string;
  rank: number;
  biasRating: string | null;
  articleCountToday: number;
};

export function VotingCard({
  randomProviders,
}: {
  randomProviders: Promise<ProviderType[]>;
}) {
  return (
    <SideCardContainer>
      <SideCardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-current/20 p-2 dark:bg-current/10">
            <Vote className="size-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-md leading-5 font-bold">
              Se ne strinjaš s politično oceno?
            </p>
            <span className="text-xs">Glasuj drugače!</span>
          </div>
        </div>
      </SideCardHeader>
      <div className="flex flex-1 flex-col items-center justify-around gap-2 px-4 pb-4 md:pb-2">
        <Suspense
          fallback={
            <>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={"skeleton-" + idx}
                  className="flex w-full rounded-lg p-2"
                >
                  <Skeleton className="bg-primary/10 relative size-[82px] shrink-0 rounded-lg"></Skeleton>
                  <div className="flex w-full flex-col justify-between px-3 py-1">
                    <Skeleton className="bg-primary/10 h-6 w-20 rounded-md"></Skeleton>
                    <Skeleton className="bg-primary/10 h-5 w-32" />
                    <Skeleton className="bg-primary/10 h-4 w-40" />
                  </div>
                </div>
              ))}
            </>
          }
        >
          <Await
            resolve={randomProviders}
            errorElement={
              <ErrorUI message="Napaka pri nalaganju medijev" size="small" />
            }
          >
            {(providers) => (
              <>
                {providers.map((p) => (
                  <Link
                    key={p.key}
                    to={href("/medij/:providerKey", { providerKey: p.key })}
                    className="hover:bg-primary/5 flex w-full rounded-lg p-2 transition-colors duration-200"
                  >
                    <div
                      className="relative size-[82px] cursor-pointer rounded-lg bg-cover bg-center shadow-md"
                      style={{
                        backgroundImage: `url(${getProviderImageUrl(p.key, 160)})`,
                      }}
                    ></div>
                    <div className="flex flex-col items-start justify-between px-3">
                      <div className="flex gap-2">
                        <div
                          className={`${biasKeyToColor(p.biasRating ?? "", true)} flex items-center justify-center rounded-md px-2 py-px text-sm`}
                        >
                          {biasKeyToLabel(p.biasRating ?? "")}
                        </div>
                      </div>

                      <p className="text-primary text-lg font-semibold">
                        {p.name.toLocaleLowerCase() ===
                        "slovenska tiskovna agencija"
                          ? "STA"
                          : p.name}
                      </p>
                      <p className="text-primary/50 text-xs md:text-sm">
                        {p.articleCountToday} objavljenih člankov danes
                      </p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </Await>
        </Suspense>
      </div>
    </SideCardContainer>
  );
}
