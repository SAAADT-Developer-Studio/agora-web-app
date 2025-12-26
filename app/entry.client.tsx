import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type {
  unstable_ClientInstrumentation,
  unstable_InstrumentationHandlerResult,
} from "react-router";
import { HydratedRouter } from "react-router/dom";

const windowPerf: unstable_ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      navigate: (fn, { to, currentUrl }) =>
        measure(`navigation:${currentUrl}->${to}`, fn),
      fetch: (fn, { href }) => measure(`fetcher:${href}`, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => measure(`middleware:${id}`, fn),
      loader: (fn) => measure(`loader:${id}`, fn),
      action: (fn) => measure(`action:${id}`, fn),
    });
  },
};

async function measure(
  label: string,
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
) {
  performance.mark(`start:${label}`);
  await cb();
  performance.mark(`end:${label}`);
  performance.measure(label, `start:${label}`, `end:${label}`);
}

const instrumentations = import.meta.env.DEV ? [windowPerf] : [];

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter unstable_instrumentations={instrumentations} />
    </StrictMode>,
  );
});
