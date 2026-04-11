import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/auth";

interface ConsultaHoy {
  id: number;
  nombre: string;
  apellido: string;
  carnet_uni: string | null;
  motivo: string;
  prioridad: "Normal" | "Urgente";
  hora: string;
}

export default function ConsultasHoy() {
  const nav = useNavigate();
  const [list, setList] = useState<ConsultaHoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchHoy = async () => {
    try {
      const res = await authFetch('/api/consultas-hoy');
      const data = await res.json();
      setList(Array.isArray(data) ? data : []); // seguridad
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoy();
  }, []);

  const filtered = list.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.carnet_uni ?? ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando consultas...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Consultas de Hoy</h1>
          <div className="flex gap-3">
  <button
    onClick={fetchHoy}
    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
  >
    Actualizar
  </button>
  <button
    onClick={() => nav("/dashboard")}
    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
  >
    Volver al Inicio
  </button>
  
</div>

        </div>

        <input
          type="text"
          placeholder="Buscar por nombre o carnet..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {filtered.length === 0 ? (
          <p className="text-gray-600">No hay consultas registradas hoy.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Hora</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Apellido</th>
                  <th className="py-2">Carnet</th>
                  <th className="py-2">Motivo</th>
                  <th className="py-2">Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{c.hora}</td>
                    <td className="py-2">{c.nombre}</td>
                    <td className="py-2">{c.apellido}</td>
                    <td className="py-2">{c.carnet_uni ?? "—"}</td>
                    <td className="py-2">{c.motivo}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.prioridad === "Urgente"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {c.prioridad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
