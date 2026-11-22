import { useEffect } from "react";
import { useNavigation } from "react-router";
import { useLoadingIndicator } from "~/hooks/use-loading-indicator";

export function LoadingBar({
  height = 3,
  color = "var(--color-electricblue)",
}: {
  height?: number;
  color?: string;
}) {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const { progress, start, finish, isLoading } = useLoadingIndicator();

  useEffect(() => {
    if (isNavigating) {
      start({ force: true });
    } else {
      finish();
    }
  }, [isNavigating, start, finish]);

  return (
    <div
      role="progressbar"
      aria-hidden={!isLoading}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        pointerEvents: "none",
        width: "auto",
        height: `${height}px`,
        opacity: isLoading ? 1 : 0,
        background: color,
        transform: `scaleX(${progress / 100})`,
        transformOrigin: "left",
        transition: "transform 0.1s, height 0.4s, opacity 0.4s",
        zIndex: 999999,
      }}
    />
  );
}
