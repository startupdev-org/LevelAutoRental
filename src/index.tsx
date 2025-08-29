import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./i18n/i18n.ts";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
