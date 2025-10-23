import { config } from "~/config";

export function getProviderImageUrl(
  providerKey: string,
  size: 60 | 160 = 60,
): string {
  return `${config.imagesUrl}/providers/${providerKey}-${size}.webp`;
}

export function ProviderImage({
  provider,
  size,
  ...rest
}: {
  provider: { key: string; name: string };
  size?: 60 | 160;
} & React.ComponentProps<"img">) {
  return (
    <img
      src={getProviderImageUrl(provider.key, size)}
      alt={provider.name}
      {...rest}
    />
  );
}
