import { config } from "~/config";

export function ProviderImage({
  provider,
  ...rest
}: { provider: { key: string; name: string } } & React.ComponentProps<"img">) {
  return (
    <img
      src={`${config.imagesUrl}/providers/${provider.key}.webp`}
      alt={provider.name}
      {...rest}
    />
  );
}
