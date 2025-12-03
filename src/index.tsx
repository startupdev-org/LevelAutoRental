import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./i18n/i18n.ts";


// Handle GitHub Pages SPA routing
(function (l) {
  if (l.search && l.search.includes('~and~')) {
    var decoded = l.search.replace(/~and~/g, '&');
    window.history.replaceState(null, '', l.pathname + decoded + l.hash);
  }
}(window.location))

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
