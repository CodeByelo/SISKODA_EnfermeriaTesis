import { useState } from "react";
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
import { useAuth } from "../../contexts/auth-context";

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
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
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
          {menu.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === "Salir") {
                  logout();
                }
                nav(item.route);
                setSidebarOpen(false);
              }}
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
            <p className="text-sm text-gray-500">Acceso rapido a modulos y reportes.</p>
          </div>
          <span className="text-sm text-gray-500">{user?.role ?? "Enfermeria"}</span>
        </header>

        <section className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menu.map((card) => (
              <button
                key={card.name}
                onClick={() => {
                  if (card.name === "Salir") {
                    logout();
                  }
                  nav(card.route);
                }}
                className="rounded-xl bg-white p-6 text-left shadow transition hover:scale-[1.01] hover:shadow-lg"
              >
                <card.icon className="mb-4 h-10 w-10 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">{card.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Accede al modulo de {card.name.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
