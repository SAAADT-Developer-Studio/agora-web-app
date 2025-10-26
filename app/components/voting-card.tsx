import { Vote } from "lucide-react";
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

type ProviderType = {
  name: string;
  key: string;
  url: string;
  rank: number;
  biasRating: string | null;
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
          <div className="rounded-md border border-white/60 p-2">
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <div className="grid h-full grid-cols-2 gap-x-8 pt-0">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <Spinner className="size-8" />
              </div>
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
                      className="flex items-center justify-center p-2 md:p-0"
                    >
                      <div
                        className="relative size-[110px] cursor-pointer rounded-lg bg-cover bg-center transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-lg"
                        style={{
                          backgroundImage: `url(${getProviderImageUrl(p.key, 160)})`,
                        }}
                      >
                        <div
                          className={cn(
                            "absolute top-[-5px] right-[-10px] rounded-lg px-2 py-1 text-sm font-semibold shadow-sm",
                            biasKeyToColor(p.biasRating ?? ""),
                          )}
                        >
                          {biasKeyToLabel(p.biasRating ?? "")}
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </SideCardContainer>
  );
}
