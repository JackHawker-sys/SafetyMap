import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import "./index.css";
import App from "./App.tsx";
import { LanguageProvider } from "./GUIs/Context/LanguageContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <LanguageProvider>
            <App />
        </LanguageProvider>
    </StrictMode>,
);
