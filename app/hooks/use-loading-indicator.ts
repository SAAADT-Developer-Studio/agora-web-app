import { useState, useRef, useCallback, useEffect } from "react";

type LoadingIndicatorOpts = {
  duration?: number;
  throttle?: number;
  hideDelay?: number;
  resetDelay?: number;
  estimatedProgress?: (duration: number, elapsed: number) => number;
};

function defaultEstimatedProgress(duration: number, elapsed: number): number {
  const completionPercentage = (elapsed / duration) * 100;
  return (2 / Math.PI) * 100 * Math.atan(completionPercentage / 50);
}

export function useLoadingIndicator(opts: LoadingIndicatorOpts = {}) {
  const {
    duration = 2000,
    throttle = 200,
    hideDelay = 500,
    resetDelay = 400,
    estimatedProgress = defaultEstimatedProgress,
  } = opts;

  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const rafId = useRef<number>(0);
  const done = useRef(false);
  const throttleTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const resetTimeout = useRef<number | null>(null);

  const clear = useCallback(() => {
    clearTimeout(throttleTimeout.current);
    cancelAnimationFrame(rafId.current);
  }, []);

  const clearTimeouts = useCallback(() => {
    clearTimeout(hideTimeout.current);
    clearTimeout(resetTimeout.current);
  }, []);

  const startProgress = useCallback(() => {
    done.current = false;
    let startTime: number;

    const step = (timestamp: number) => {
      if (done.current) return;
      startTime ??= timestamp;
      const elapsed = timestamp - startTime;
      setProgress(Math.min(100, estimatedProgress(duration, elapsed)));
      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);
  }, [duration, estimatedProgress]);

  const finish = useCallback(
    (opts: { force?: boolean; error?: boolean } = {}) => {
      setProgress(100);
      done.current = true;
      clear();
      clearTimeouts();

      if (opts.error) setError(true);

      if (opts.force) {
        setProgress(0);
        setIsLoading(false);
      } else {
        // @ts-expect-error because of the stupid NodeJS.Timeout type
        hideTimeout.current = setTimeout(() => {
          setIsLoading(false);
          // @ts-expect-error because of the stupid NodeJS.Timeout type
          resetTimeout.current = setTimeout(() => setProgress(0), resetDelay);
        }, hideDelay);
      }
    },
    [clear, clearTimeouts, hideDelay, resetDelay],
  );

  const set = useCallback(
    (value: number, opts: { force?: boolean } = {}) => {
      if (value >= 100) return finish({ force: opts.force });

      clear();
      setProgress(Math.max(0, value));

      const delay = opts.force ? 0 : throttle;
      if (delay) {
        // @ts-expect-error because of the stupid NodeJS.Timeout type
        throttleTimeout.current = setTimeout(() => {
          setIsLoading(true);
          startProgress();
        }, delay);
      } else {
        setIsLoading(true);
        startProgress();
      }
    },
    [clear, finish, startProgress, throttle],
  );

  const start = useCallback(
    (opts: { force?: boolean } = {}) => {
      clearTimeouts();
      setError(false);
      set(0, opts);
    },
    [clearTimeouts, set],
  );

  useEffect(() => {
    return () => {
      clear();
      clearTimeouts();
    };
  }, [clear, clearTimeouts]);

  return { progress, isLoading, error, start, set, finish, clear };
}
