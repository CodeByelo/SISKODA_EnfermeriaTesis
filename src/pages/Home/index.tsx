import { useState } from "react";
import DashboardButtons from '../../components/DashboardButtons'; // Agrega esta línea
import { useNavigate } from "react-router-dom";
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  FolderOpenIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const menu = [
  { name: "Nueva Consulta", route: "/nueva-consulta", icon: ClipboardDocumentCheckIcon },
  { name: "Consultas de Hoy", route: "/consultas-hoy", icon: CalendarDaysIcon },
  { name: "Expedientes", route: "/expedientes", icon: FolderOpenIcon },
  { name: "Inventario", route: "/inventario", icon: CubeIcon },
  { name: "Reportes", route: "/reportes", icon: ChartBarIcon },
  { name: "Salir", route: "/", icon: ArrowRightOnRectangleIcon },
];

export default function Home() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative"> {/* Agrega 'relative' aquí */}
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-indigo-600">ISUM</h1>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menu.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                nav(item.route);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
          <span className="text-sm text-gray-500">Enfermería</span>
        </header>

        <section className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menu.map((card) => (
              <button
                key={card.name}
                onClick={() => nav(card.route)}
                className="bg-white rounded-xl shadow p-6 text-left hover:shadow-lg hover:scale-105 transition"
              >
                <card.icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">{card.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Accede al módulo de {card.name.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Agrega DashboardButtons aquí, fuera del sidebar y main content */}
      <DashboardButtons />
    </div>
  );
}