import fallback from "~/assets/fallback.png";

type ImageProvider = {
  url: string;
  providerRank: number;
  providerKey: string;
};

export function extractHeroImage(images: ImageProvider[]) {
  if (images.length === 0) return fallback;
  const filteredImages = images.filter(
    (img) => img.url && !img.url.toLowerCase().endsWith(".mp4"),
  );
  if (filteredImages.length === 0) return fallback;

  const sorted = [...filteredImages].sort((a, b) => {
    if (a.providerRank !== b.providerRank) {
      return a.providerRank - b.providerRank;
    }
    return a.providerKey.localeCompare(b.providerKey);
  });

  return sorted[0].url;
}
