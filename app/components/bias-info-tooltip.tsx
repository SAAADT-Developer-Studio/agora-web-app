import * as React from "react";
import { ChevronRight, CircleQuestionMark, ExternalLink } from "lucide-react";
import { href, Link } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useMediaQuery } from "~/hooks/use-media-query";
import { Button } from "~/components/ui/button";

const biasRatings = [
  { label: "Leva", color: "bg-blue-500", textColor: "text-white" },
  { label: "C. Leva", color: "bg-blue-400", textColor: "text-gray-800" },
  { label: "Center", color: "bg-gray-300", textColor: "text-gray-800" },
  { label: "C. Desna", color: "bg-red-300", textColor: "text-gray-800" },
  { label: "Desna", color: "bg-red-500", textColor: "text-white" },
];

export function BiasInfoTooltip() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const trigger = (
    <button
      type="button"
      className="transition-opacity hover:opacity-70"
      aria-label="Razlaga ocene pristranskosti"
    >
      <CircleQuestionMark className="size-4" />
    </button>
  );

  if (isDesktop) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div>
            <p className="mb-2 text-sm">
              Pristranskost ocenjujemo na podlagi študij ali analize vzorca
              člankov
            </p>
            <div className="flex justify-end">
              <Link
                to={href("/metodologija")}
                className="text-electricblue text-sm hover:underline"
                onClick={() => setOpen(false)}
              >
                Več o metodologiji
              </Link>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-start text-xl">
            Ocena pristranskosti
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-primary/70 text-start text-sm">
              Pristranskost ocenjujemo na podlagi znanstvenih raziskav in
              analize lastništva medijev
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <h3 className="text-primary mb-3 text-sm font-semibold">
              Lestvica pristranskosti
            </h3>
            <div className="flex flex-wrap justify-start gap-1.5">
              {biasRatings.map((rating, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${rating.color}`}
                >
                  <div className={`text-xs font-medium ${rating.textColor}`}>
                    {rating.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-primary/70 mt-4 text-start text-xs leading-normal">
              Klasificiramo medijske organizacije, ne posamezne članke
            </p>
          </div>

          <div>
            <h3 className="text-primary mb-2 text-sm font-semibold">
              Raziskave
            </h3>
            <div className="space-y-2">
              <a
                href="https://www.researchgate.net/publication/388646081_Analysing_Bias_in_Slovenian_News_Media_A_Computational_Comparison_Based_on_Readers'_Political_Orientation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/80 hover:text-primary border-primary/10 bg-background/50 flex items-start justify-between gap-2 rounded border p-2 text-xs transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    Analiza pristranskosti v slovenskih medijih
                  </div>
                  <div className="text-primary/60 text-xs">
                    Caporusso et al. (2024)
                  </div>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              </a>

              <a
                href="https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2023.1143786/full"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/80 hover:text-primary border-primary/10 bg-background/50 flex items-start justify-between gap-2 rounded border p-2 text-xs transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    Medijski pluralizem in ideološka usmeritev
                  </div>
                  <div className="text-primary/60 text-xs">
                    Besednjak Valič et al. (2023)
                  </div>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="bg-primary text-background"
            asChild
          >
            <Link to={href("/metodologija")}>
              Več o metodologiji
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
