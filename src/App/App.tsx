

import { Outlet } from "react-router-dom";
import "../index.css";

import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return <ProtectedRoute><Outlet /></ProtectedRoute>;
}
