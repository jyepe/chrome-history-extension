// @ts-expect-error - fontsource ESM import not typed
import "@fontsource-variable/inter";
// @ts-expect-error - fontsource ESM import not typed
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ChromeProvider } from "@/components/ChromeProvider";
import { realChromeApi } from "@/lib/chrome-api";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChromeProvider api={realChromeApi}>
      <App />
    </ChromeProvider>
  </StrictMode>,
);
