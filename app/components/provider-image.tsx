import { config } from "~/config";

export function getProviderImageUrl(providerKey: string) {
  return `${config.imagesUrl}/providers/${providerKey}.webp`;
}

export function ProviderImage({
  provider,
  ...rest
}: { provider: { key: string; name: string } } & React.ComponentProps<"img">) {
  return (
    <img
      src={getProviderImageUrl(provider.key)}
      alt={provider.name}
      {...rest}
    />
  );
}
