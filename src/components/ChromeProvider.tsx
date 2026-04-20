/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ChromeApi } from "@/lib/chrome-api";

interface ChromeApiContextValue {
  api: ChromeApi;
  extensionId: string | null;
}

const ChromeApiContext = createContext<ChromeApiContextValue | null>(null);

export function ChromeProvider({
  api,
  children,
}: {
  api: ChromeApi;
  children: ReactNode;
}) {
  const value = useMemo<ChromeApiContextValue>(
    () => ({ api, extensionId: api.runtime.getExtensionId() }),
    [api],
  );
  return (
    <ChromeApiContext.Provider value={value}>
      {children}
    </ChromeApiContext.Provider>
  );
}

export function useChromeApi(): ChromeApi {
  const ctx = useContext(ChromeApiContext);
  if (!ctx) {
    throw new Error("useChromeApi must be used inside <ChromeProvider>");
  }
  return ctx.api;
}

export function useExtensionId(): string | null {
  const ctx = useContext(ChromeApiContext);
  if (!ctx) {
    throw new Error("useExtensionId must be used inside <ChromeProvider>");
  }
  return ctx.extensionId;
}
