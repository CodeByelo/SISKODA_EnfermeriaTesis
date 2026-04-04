// src/App.tsx
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NuevaConsulta from "./pages/nueva-consulta";
import ConsultasHoy from "./pages/consultas-hoy";
import Expedientes from "./pages/expedientes";
import NuevoExpediente from "./pages/expedientes/nuevo-expediente";
import Inventario from "./pages/inventario";
import EntradaInventario from "./pages/inventario/entrada";
import SalidaInventario from "./pages/inventario/salida";
import NuevoInsumo from "./pages/inventario/nuevo";
import HistorialPaciente from './pages/expedientes/historial';
import Reportes from './pages/reportes';
import Login from "./pages/Login/Registro/login";
import Register from "./pages/Login/Registro/registro";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Ruta principal: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta oculta para registro */}
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas (después de login) */}
        <Route path="/dashboard" element={<Home />} />
        <Route path="/nueva-consulta" element={<NuevaConsulta />} />
        <Route path="/consultas-hoy" element={<ConsultasHoy />} />
        <Route path="/expedientes" element={<Expedientes />} />
        <Route path="/expedientes/nuevo" element={<NuevoExpediente />} />
        <Route path="/expedientes/:id/historial" element={<HistorialPaciente />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/inventario/entrada" element={<EntradaInventario />} />
        <Route path="/inventario/salida" element={<SalidaInventario />} />
        <Route path="/inventario/nuevo" element={<NuevoInsumo />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </HashRouter>
  );
}
