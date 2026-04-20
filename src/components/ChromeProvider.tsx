/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { ChromeApi } from "@/lib/chrome-api";

const ChromeApiContext = createContext<ChromeApi | null>(null);

export function ChromeProvider({
  api,
  children,
}: {
  api: ChromeApi;
  children: ReactNode;
}) {
  return (
    <ChromeApiContext.Provider value={api}>
      {children}
    </ChromeApiContext.Provider>
  );
}

export function useChromeApi(): ChromeApi {
  const api = useContext(ChromeApiContext);
  if (!api) {
    throw new Error("useChromeApi must be used inside <ChromeProvider>");
  }
  return api;
}
