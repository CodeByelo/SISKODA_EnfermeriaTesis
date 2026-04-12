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
  const [query, setQuery] = useState("");
  const { logout, user } = useAuth();
  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">ISUM</h1>
            <p className="text-xs text-gray-500 mt-1">{user?.email ?? "Sesion activa"}</p>
          </div>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 px-4">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">Acceso rapido a modulos, reportes y acciones frecuentes.</p>
          </div>
          <span className="text-sm text-gray-500">{user?.role ?? "Enfermeria"}</span>
        </header>

        <section className="p-6">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Busqueda global
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modulo, por ejemplo inventario o reportes"
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {filteredMenu.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-500">
              No hay modulos que coincidan con la busqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((card) => (
              <button
                key={card.name}
                onClick={() => {
                  if (card.name === "Salir") {
                    logout();
                  }
                  nav(card.route);
                }}
                className="bg-white rounded-xl shadow p-6 text-left hover:shadow-lg hover:scale-105 transition"
              >
                <card.icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">{card.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Accede al modulo de {card.name.toLowerCase()}
                </p>
              </button>
            ))}
            </div>
          )}
        </section>
      </main>

      <DashboardButtons />
    </div>
  );
}
