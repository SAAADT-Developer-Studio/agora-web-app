import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type {
  ClientInstrumentation,
  InstrumentationHandlerResult,
} from "react-router";
import { HydratedRouter } from "react-router/dom";
import { agentDebugLog } from "~/lib/agent-debug-log";

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    args.some(
      (arg) =>
        typeof arg === "string" &&
        arg.includes("Each child in a list should have a unique key prop"),
    )
  ) {
    // #region agent log
    agentDebugLog({
      hypothesisId: "A,B,C,E",
      location: "app/entry.client.tsx:console.error",
      message: "React unique-key warning captured",
      data: {
        arguments: args.map((arg) =>
          typeof arg === "string" ? arg : String(arg),
        ),
        stack: new Error("React key warning capture").stack,
      },
    });
    // #endregion
  }
  originalConsoleError(...args);
};

const windowPerf: ClientInstrumentation = {
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
  cb: () => Promise<InstrumentationHandlerResult>,
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
      <HydratedRouter instrumentations={instrumentations} />
    </StrictMode>,
  );
});
