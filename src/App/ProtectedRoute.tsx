import { useEffect, type ReactNode } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { redirectToPortalHome, redirectToPortalLogin } from "../Utils/portalRedirect";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, authChecked } = useAuth();
  const hasAccess = Boolean(user?.appAccess?.some((app) => app.slug === "evaluacion" && ["admin", "user"].includes(app.role)));

  useEffect(() => {
    if (!authChecked) return;
    if (!user) redirectToPortalLogin();
    else if (!hasAccess) redirectToPortalHome();
  }, [authChecked, user, hasAccess]);

  if (loading || !authChecked) return <main className="grid min-h-screen place-items-center p-6"><p className="font-semibold text-slate-700">Verificando acceso…</p></main>;
  if (!user || !hasAccess) return <main className="grid min-h-screen place-items-center p-6"><p className="text-center font-semibold text-slate-700">Redirigiendo al portal…</p></main>;
  return children;
}
