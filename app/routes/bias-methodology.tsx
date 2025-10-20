import type { Route } from "./+types/bias-methodology";

export default function BiasMethodologyPage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Metodologija Ocenjevanja Pristranskosti
      </h1>
      <p className="mb-2">
        Naša metodologija ocenjevanja pristranskosti virov novic temelji na več
        ključnih dejavnikih:
      </p>
      <ul className="mb-4 list-inside list-disc">
        <li>
          <strong>Analiza vsebine:</strong> Pregledamo jezik, ton in teme, ki
          jih vir pokriva, da ugotovimo morebitno pristranskost.
        </li>
        <li>
          <strong>Lastništvo in financiranje:</strong> Preučimo lastniško
          strukturo in vire financiranja, ki lahko vplivajo na uredniško
          politiko.
        </li>
        <li>
          <strong>Zgodovina poročanja:</strong> Analiziramo pretekle članke in
          poročila za vzorce pristranskosti.
        </li>
        <li>
          <strong>Neodvisne ocene:</strong> Upoštevamo ocene neodvisnih
          organizacij, ki spremljajo medijsko pristranskost.
        </li>
      </ul>
      <p>
        Na podlagi teh dejavnikov dodelimo vsakemu viru oceno pristranskosti, ki
        uporabnikom pomaga razumeti perspektivo in zanesljivost informacij, ki
        jih prejemajo.
      </p>
    </div>
  );
}
