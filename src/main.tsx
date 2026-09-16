import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App/App.tsx";
import { AuthProvider } from "./Contexts/AuthContext.tsx";
import { ForeignWorkersProvider } from "./Contexts/ForeignWorkersContext.tsx";
import { EvaluationProvider } from "./Contexts/evaluationContext.tsx";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      
      <ForeignWorkersProvider>
        <EvaluationProvider>
        <App />
        </EvaluationProvider>
      </ForeignWorkersProvider>
    </AuthProvider>
  </StrictMode>,
);
