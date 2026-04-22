// @ts-expect-error - fontsource ESM import not typed
import "@fontsource-variable/inter";
// @ts-expect-error - fontsource ESM import not typed
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ChromeProvider } from "@/components/ChromeProvider";
import { realChromeApi, type ChromeApi } from "@/lib/chrome-api";

// Demo mode: build with `VITE_DEMO=1 npm run build` to ship a curated fake
// history dataset for store screenshots. The dynamic import is dead-code
// eliminated from production builds because the env literal constant-folds
// to false.
async function loadApi(): Promise<ChromeApi> {
  if (import.meta.env.VITE_DEMO === "1") {
    const { demoChromeApi } = await import("@/lib/demo-api");
    return demoChromeApi;
  }
  return realChromeApi;
}

const api = await loadApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChromeProvider api={api}>
      <App />
    </ChromeProvider>
  </StrictMode>,
);
