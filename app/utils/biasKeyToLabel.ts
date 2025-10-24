export function biasKeyToLabel(biasKey: string) {
  const biasMap: Record<string, string> = {
    left: "levo",
    "center-left": "center levo",
    center: "center",
    "center-right": "center desno",
    right: "desno",
  };

  return biasMap[biasKey] || "Neznano";
}
