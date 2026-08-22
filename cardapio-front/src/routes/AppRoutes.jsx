import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import Refeicoes from "../pages/Cardapio/Refeicoes";
import Admin from "../pages/Admin/Admin";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/cardapio"
        element={
          <PrivateRoute>
            <Refeicoes />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
    </Routes>
  );
}