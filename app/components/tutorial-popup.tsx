"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BiasDistribution } from "./bias-distribution";

interface TutorialStep {
  title: string;
  description: string;
  biasDistribution?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Dobrodošli na Vidiku!",
    description:
      "Ta platforma zbira novice iz različnih virov in vam omogoča, da vidite več perspektiv iste zgodbe. Preberite več o tem, kako uporabljati vse funkcije.",
  },
  {
    title: "Distribucija pristranskosti",
    description:
      "Vsak članek prikazuje politično usmerjenost virov, ki poročajo o zgodbi. Vidite lahko, koliko virov je levo, sredinskih ali desno usmerjenih, kar vam pomaga razumeti različne perspektive.",
    biasDistribution: true,
  },
  {
    title: "Začnite raziskovati",
    description:
      "Zdaj ste pripravljeni uporabljati platformo! Kliknite na katerokoli zgodbo za več podrobnosti in različne perspektive.",
  },
];

const TUTORIAL_STORAGE_KEY = "vidik-tutorial-completed";

export function TutorialPopup() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasCompletedTutorial) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      setOpen(newOpen);
    }
  };

  const currentStepData = tutorialSteps[currentStep];
  const biasDistribution = {
    leftPercent: 63,
    centerPercent: 31,
    rightPercent: 6,
    leftCount: 10,
    centerCount: 5,
    rightCount: 1,
    totalCount: 16,
  };

  const placeholderData = [
    {
      key: "n1info",
      name: "N1 Info",
      url: "https://n1info.si",
      biasRating: "center",
      articleCount: 3,
      rank: 1,
    },
    {
      key: "reporter",
      name: "Reporter",
      url: "https://reporter.si",
      biasRating: "right",
      articleCount: 1,
      rank: 2,
    },
    {
      key: "delo",
      name: "Delo",
      url: "https://www.delo.si",
      biasRating: "left",
      articleCount: 2,
      rank: 1,
    },
    {
      key: "dnevnik",
      name: "Dnevnik",
      url: "https://www.dnevnik.si",
      biasRating: "left",
      articleCount: 4,
      rank: 1,
    },
    {
      key: "rtv",
      name: "RTV",
      url: "https://www.rtvslo.si",
      biasRating: "center-left",
      articleCount: 3,
      rank: 0,
    },
    {
      key: "siol",
      name: "Siol",
      url: "https://siol.net",
      biasRating: "center",
      articleCount: 2,
      rank: 0,
    },
    {
      key: "svet24",
      name: "Svet24",
      url: "https://www.svet24.si",
      biasRating: "left",
      articleCount: 1,
      rank: 0,
    },
    {
      key: "ljubljanskenovice",
      name: "Ljubljanske novice",
      url: "https://ljnovice.si/",
      biasRating: null,
      articleCount: 1,
      rank: 3,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[600px]">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold md:text-2xl">
              {currentStepData.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {currentStepData.biasDistribution && (
            <div className="mb-4 overflow-hidden rounded-lg">
              <BiasDistribution
                providers={placeholderData}
                biasDistribution={biasDistribution}
              />
            </div>
          )}

          <p className="text-muted-foreground mb-6 text-sm leading-relaxed md:text-base">
            {currentStepData.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep ? "bg-primary w-8" : "bg-primary w-2"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="bg-primary text-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Nazaj
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="bg-primary text-background"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  "Začni"
                ) : (
                  <>
                    Naprej
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
