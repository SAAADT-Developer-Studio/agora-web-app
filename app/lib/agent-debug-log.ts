import * as React from "react";

type DebugEntry = {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: number;
};

function getElementTypeName(type: unknown) {
  if (typeof type === "string") {
    return type;
  }
  if (
    (typeof type === "function" ||
      (typeof type === "object" && type !== null)) &&
    ("displayName" in type || "name" in type)
  ) {
    const namedType = type as { displayName?: string; name?: string };
    return namedType.displayName || namedType.name || "anonymous";
  }
  return typeof type;
}

export function agentDebugLog(entry: Omit<DebugEntry, "timestamp">) {
  if (!import.meta.env.DEV || typeof navigator === "undefined") {
    return;
  }

  navigator.sendBeacon(
    "/__agent-debug-log",
    JSON.stringify({ ...entry, timestamp: Date.now() }),
  );
}

export function summarizeChildren(children: React.ReactNode) {
  const childArray = Array.isArray(children) ? children : [children];
  return {
    isArray: Array.isArray(children),
    count: childArray.length,
    children: childArray.map((child) => {
      if (React.isValidElement(child)) {
        return {
          kind: getElementTypeName(child.type),
          key: child.key,
        };
      }
      return { kind: child === null ? "null" : typeof child, key: null };
    }),
  };
}

export function summarizeElement(element: unknown) {
  if (!React.isValidElement(element)) {
    return { valid: false, type: typeof element, key: null };
  }

  return {
    valid: true,
    type: getElementTypeName(element.type),
    key: element.key,
  };
}
