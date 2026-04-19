import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardButtons from "../../components/DashboardButtons";
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  FolderOpenIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/auth-context";

type MenuItem = {
  name: string;
  route: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
  roles?: string[];
};

const menu: MenuItem[] = [
  { name: "Nueva Consulta", route: "/nueva-consulta", icon: ClipboardDocumentCheckIcon },
  { name: "Consultas de Hoy", route: "/consultas-hoy", icon: CalendarDaysIcon },
  { name: "Expedientes", route: "/expedientes", icon: FolderOpenIcon },
  { name: "Inventario", route: "/inventario", icon: CubeIcon },
  { name: "Reportes", route: "/reportes", icon: ChartBarIcon },
  { name: "Usuarios", route: "/usuarios", icon: ShieldCheckIcon, adminOnly: true },
  { name: "Mi Perfil", route: "/mi-perfil", icon: FolderOpenIcon, roles: ["estudiante", "profesor", "personal"] },
  { name: "Mi Historial", route: "/mi-historial", icon: CalendarDaysIcon, roles: ["estudiante", "profesor", "personal"] },
  { name: "Salir", route: "/", icon: ArrowRightOnRectangleIcon },
];

const descriptions: Record<string, string> = {
  "Nueva Consulta": "Registra atenciones clinicas con orden, seguimiento y mejor lectura operativa.",
  "Consultas de Hoy": "Supervisa la jornada activa y entra rapido a la atencion pendiente.",
  Expedientes: "Gestiona pacientes, historial medico y continuidad clinica.",
  Inventario: "Controla insumos, entradas, salidas y existencias del area.",
  Reportes: "Consulta metricas, tendencias y resumenes para la toma de decisiones.",
  Usuarios: "Administra cuentas internas, accesos y roles del sistema.",
  "Mi Perfil": "Consulta tus datos institucionales y el estado de tu cuenta personal.",
  "Mi Historial": "Revisa tus atenciones ya registradas por enfermeria desde tu portal personal.",
  Salir: "Cierra la sesion actual de forma segura.",
};

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  enfermeria: "Enfermeria",
  consulta: "Consulta",
  inventario: "Inventario",
  reportes: "Reportes",
};

export default function Home() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const visibleMenu = menu.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    if (item.roles && !item.roles.includes(user?.role ?? "")) return false;
    if (!item.roles && ["estudiante", "profesor", "personal"].includes(user?.role ?? "") && !["Salir"].includes(item.name)) {
      return ["Mi Perfil", "Mi Historial"].includes(item.name);
    }
    return true;
  });
  const dashboardCards = visibleMenu.filter((item) => item.name !== "Salir");

  const openMenuItem = (item: MenuItem) => {
    if (item.name === "Salir") {
      logout();
    }

    nav(item.route);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_35%),linear-gradient(180deg,#f7f7fb_0%,#f3f4f6_100%)]">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 transform border-r border-violet-100 bg-white/95 shadow-lg backdrop-blur-sm transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">ISUM</h1>
            <p className="mt-1 text-xs text-gray-500">{user?.email ?? "Sesion activa"}</p>
          </div>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <nav className="space-y-2 p-4">
          {visibleMenu.map((item) => (
            <button
              key={item.name}
              onClick={() => openMenuItem(item)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex-1 px-4">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">Acceso rapido a modulos, reportes y control operativo.</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 ring-1 ring-violet-200">
            {roleLabel[user?.role ?? "enfermeria"] ?? "Enfermeria"}
          </span>
        </header>

        <section className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.map((card) => (
              <button
                key={card.name}
                onClick={() => openMenuItem(card)}
                className="group relative overflow-hidden rounded-[26px] border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 text-left shadow-[0_24px_45px_-38px_rgba(76,29,149,0.45)] transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_30px_60px_-34px_rgba(76,29,149,0.35)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-violet-400 opacity-80" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white">
                    <card.icon className="h-8 w-8" />
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-500 ring-1 ring-violet-100">
                    Modulo
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">{card.name}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{descriptions[card.name]}</p>
                <div className="mt-6 flex items-center justify-between border-t border-violet-100 pt-4 text-sm">
                  <span className="font-medium text-gray-500">Abrir modulo</span>
                  <span className="font-semibold text-violet-700 transition group-hover:translate-x-1">
                    Entrar
                  </span>
                </div>
              </button>
            ))}
          </div>

          <DashboardButtons />
        </section>
      </main>
    </div>
  );
}
