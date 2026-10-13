import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Fonts are bundled with the app (no request to Google). Only the Latin subset is included, to keep it small.
import "@fontsource/merriweather/latin-400.css";
import "@fontsource/merriweather/latin-400-italic.css";
import "@fontsource/merriweather/latin-700.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-400-italic.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
