import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolvePlural({
  count,
  singular,
  dual,
  plural,
}: {
  count: number;
  singular: string;
  dual: string;
  plural: string;
}) {
  if (count === 1) return singular;
  if (count === 2) return dual;
  return plural;
}
