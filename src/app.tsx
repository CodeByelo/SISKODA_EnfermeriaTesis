import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/auth-context";

const Home = lazy(() => import("./pages/Home"));
const NuevaConsulta = lazy(() => import("./pages/nueva-consulta"));
const ConsultasHoy = lazy(() => import("./pages/consultas-hoy"));
const Expedientes = lazy(() => import("./pages/expedientes"));
const NuevoExpediente = lazy(() => import("./pages/expedientes/nuevo-expediente"));
const Inventario = lazy(() => import("./pages/inventario"));
const EntradaInventario = lazy(() => import("./pages/inventario/entrada"));
const SalidaInventario = lazy(() => import("./pages/inventario/salida"));
const NuevoInsumo = lazy(() => import("./pages/inventario/nuevo"));
const HistorialPaciente = lazy(() => import("./pages/expedientes/historial"));
const Reportes = lazy(() => import("./pages/reportes"));
const Login = lazy(() => import("./pages/Login/Registro/login"));
const Register = lazy(() => import("./pages/Login/Registro/registro"));

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

function PublicRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AppFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      Cargando...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppFallback />}>
        <Routes>
          <Route element={<PublicRoutes />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/nueva-consulta" element={<NuevaConsulta />} />
            <Route path="/nueva-consulta/:paciente_id" element={<NuevaConsulta />} />
            <Route path="/consultas-hoy" element={<ConsultasHoy />} />
            <Route path="/expedientes" element={<Expedientes />} />
            <Route path="/expedientes/nuevo" element={<NuevoExpediente />} />
            <Route path="/expedientes/:id/historial" element={<HistorialPaciente />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/inventario/entrada" element={<EntradaInventario />} />
            <Route path="/inventario/salida" element={<SalidaInventario />} />
            <Route path="/inventario/nuevo" element={<NuevoInsumo />} />
            <Route path="/reportes" element={<Reportes />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
