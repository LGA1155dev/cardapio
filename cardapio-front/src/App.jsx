import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

const Login = lazy(() => import("./pages/Login/Login.jsx"));
const Refeicoes = lazy(() => import("./pages/Cardapio/Refeicoes.jsx"));
const Admin = lazy(() => import("./pages/Admin/Admin.jsx"));

function App() {

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/refeicao" element={
        <PrivateRoute>
          <Refeicoes />
        </PrivateRoute>
          } />
        <Route path="/admin" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
          }
          />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App;
