import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./i18n/i18n.ts";

// Handle GitHub Pages SPA routing
(function(l) {
  if (l.search[1] === '/' ) {
    var decoded = l.search.slice(1).split('&').map(function(s) { 
      return s.replace(/~and~/g, '&')
    }).join('?');
    window.history.replaceState(null, '', l.pathname.slice(0, -1) + decoded + l.hash);
  }
}(window.location))

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
