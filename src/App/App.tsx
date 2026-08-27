

import "../index.css";
import Evaluacion from "./Evaluacion/Evaluacion";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return <ProtectedRoute><Evaluacion /></ProtectedRoute>;
}
