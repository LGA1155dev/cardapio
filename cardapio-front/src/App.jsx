import Login from "./pages/Login/Login.jsx";
import Refeicoes from "./pages/Cardapio/Refeicoes.jsx";
import Admin from "./pages/Admin/Admin.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

function App() {

  return (
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
  )
}

export default App;
