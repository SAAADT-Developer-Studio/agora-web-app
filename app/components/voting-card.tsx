import { Vote } from "lucide-react";
import { SideCardContainer, SideCardHeader } from "./ui/side-card";
import { Await, Link } from "react-router";
import { href } from "react-router";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { getProviderImageUrl } from "./provider-image";

type BiasRating = "left" | "center-left" | "center" | "center-right" | "right";

function biasKeyToColor(biasKey: string) {
  const biasMap = {
    left: "bg-[#FA2D36]",
    "center-left": "bg-[#FF6166]",
    center: "bg-[#FEFFFF] !text-black",
    "center-right": "bg-[#52A1FF]",
    right: "bg-[#2D7EFF]",
  } satisfies Record<BiasRating, string>;

  return biasMap[biasKey as BiasRating] || "#FFFFFF";
}

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
        <div className="grid h-full w-4/5 grid-cols-2 pt-0">
          <Await resolve={randomProviders}>
            {(providers) => (
              <>
                {providers.map((p) => (
                  <Link
                    key={p.key}
                    to={href("/medij/:providerKey", { providerKey: p.key })}
                    className="flex items-center justify-center"
                  >
                    <div
                      className="relative size-[110px] cursor-pointer rounded-lg bg-cover bg-center transition-transform duration-200 hover:scale-102"
                      style={{
                        backgroundImage: `url(${getProviderImageUrl(p.key, 160)})`,
                      }}
                    >
                      <div
                        className={
                          "absolute top-[-5px] right-[-10px] rounded-lg px-2 py-1 text-sm font-semibold " +
                          biasKeyToColor(p.biasRating ?? "")
                        }
                      >
                        {biasKeyToLabel(p.biasRating ?? "")}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </Await>
        </div>
      </div>
    </SideCardContainer>
  );
}
