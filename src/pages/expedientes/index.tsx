// src/pages/expedientes/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Expediente } from "./types";
import { buildApiUrl } from "../../config/api";

export default function Expedientes() {
  const nav = useNavigate();
  const [list, setList] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchExp = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/expedientes'));
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este expediente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/expedientes/${id}`), {
        method: "DELETE",
      });

      if (res.ok) {
        setList(list.filter((e) => e.id !== id));
        alert("✅ Expediente eliminado correctamente.");
      } else {
        const errorText = await res.text();
        console.error("Error del servidor:", errorText);
        alert("❌ No se pudo eliminar el expediente.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error de conexión al intentar eliminar.");
    }
  };

  useEffect(() => {
    fetchExp();
  }, []);

  const filtered = list.filter((e) =>
    `${e.nombre} ${e.apellido} ${e.carnet_uni ?? ""} ${e.codigo_empleado ?? ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando expedientes...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Expedientes</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchExp}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
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
          placeholder="Buscar por nombre, carnet o código..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {filtered.length === 0 ? (
          <p className="text-gray-600">No hay expedientes registrados.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Apellido</th>
                  <th className="py-2">Carnet</th>
                  <th className="py-2">Cód. Empleado</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Carrera/Depto</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{e.tipo_paciente}</td>
                    <td className="py-2">{e.nombre}</td>
                    <td className="py-2">{e.apellido}</td>
                    <td className="py-2">{e.carnet_uni ?? "—"}</td>
                    <td className="py-2">{e.codigo_empleado ?? "—"}</td>
                    <td className="py-2">{e.email ?? "—"}</td>
                    <td className="py-2">{e.carrera_depto ?? "—"}</td>
                    <td className="py-2">
                      <button
                        onClick={() => nav(`/expedientes/${e.id}/historial`)}
                        className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Historial
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="ml-2 text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
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
