import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App/App.tsx";
import { AuthProvider } from "./Contexts/AuthContext.tsx";
import { ForeignWorkersProvider } from "./Contexts/ForeignWorkersContext.tsx";
import { EvaluationProvider } from "./Contexts/evaluationContext.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./App/100--Home/Home.tsx";
import Evaluacion from "./App/Evaluacion/Evaluacion.tsx";
import PerformanceVariationAlert from "./App/Evaluacion/PerformanceVariationAlert.tsx";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "evaluaciones-mensuales",
        element: <Evaluacion />
      },
      {
        path: "variacion-de-desempeno",
        element: <PerformanceVariationAlert />
      }
    ]
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      
      <ForeignWorkersProvider>
        <EvaluationProvider>
        <RouterProvider router={router} />
        </EvaluationProvider>
      </ForeignWorkersProvider>
    </AuthProvider>
  </StrictMode>,
);
