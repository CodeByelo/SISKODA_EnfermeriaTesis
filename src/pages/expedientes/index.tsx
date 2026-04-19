import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLongLeftIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { Expediente } from "./types";
import { authFetch } from "../../lib/auth";
import { useNotifications } from "../../contexts/notification-context";

export default function Expedientes() {
  const nav = useNavigate();
  const { notify, confirm } = useNotifications();
  const [list, setList] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchExp = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/expedientes");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: "Eliminar expediente",
      message: "Esta accion no se puede deshacer y eliminara el registro clinico seleccionado.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tone: "error",
    });

    if (!accepted) {
      return;
    }

    try {
      const res = await authFetch(`/api/expedientes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setList((current) => current.filter((item) => item.id !== id));
        notify({ tone: "success", title: "Expediente eliminado" });
      } else {
        const errorText = await res.text();
        console.error("Error del servidor:", errorText);
        notify({ tone: "error", title: "No se pudo eliminar el expediente" });
      }
    } catch (err) {
      console.error(err);
      notify({ tone: "error", title: "Error de conexion al intentar eliminar" });
    }
  };

  useEffect(() => {
    void fetchExp();
  }, []);

  const filtered = useMemo(
    () =>
      list.filter((item) =>
        `${item.nombre} ${item.apellido} ${item.carnet_uni ?? ""} ${item.codigo_empleado ?? ""}`
          .toLowerCase()
          .includes(filter.toLowerCase())
      ),
    [filter, list]
  );

  const resumen = useMemo(() => {
    const estudiantes = list.filter((item) => item.tipo_paciente === "Estudiante").length;
    const personal = list.length - estudiantes;

    return [
      { etiqueta: "Expedientes", valor: list.length },
      { etiqueta: "Estudiantes", valor: estudiantes },
      { etiqueta: "Otros perfiles", valor: personal },
    ];
  }, [list]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-64 rounded bg-gray-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-5 h-8 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="h-12 w-full rounded-2xl bg-gray-100" />
            <div className="mt-6 h-72 rounded-3xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1d1029] via-[#2e1742] to-[#4f2671] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
                Expedientes
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Base clinica de pacientes</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Consulta historiales, ubica pacientes rapido y entra al expediente sin romper el flujo de atencion.
              </p>
            </div>

            <div className="grid gap-3 self-center sm:grid-cols-3">
              {resumen.map((item) => (
                <div
                  key={item.etiqueta}
                  className="flex min-h-[104px] min-w-[132px] flex-col justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-200">
                    {item.etiqueta}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.valor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white shadow-lg">
          <div className="border-b border-gray-100 px-8 py-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
                  Busqueda operativa
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">Expedientes disponibles</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void fetchExp()}
                  className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <ArrowPathIcon className="h-5 w-5" />
                    Actualizar
                  </span>
                </button>
                <button
                  onClick={() => nav("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
                >
                  <ArrowLongLeftIcon className="h-5 w-5" />
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <input
                type="text"
                placeholder="Buscar por nombre, carnet o codigo..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                  Visibles
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{filtered.length}</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                  Registros
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{list.length}</p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                <FolderOpenIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-4 text-lg font-semibold text-gray-800">Sin expedientes visibles</p>
                <p className="mt-2 text-sm text-gray-500">
                  Ajusta el filtro o registra nuevos pacientes desde el flujo clinico.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-violet-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-violet-50/80">
                      <tr className="border-b border-violet-100 text-sm text-gray-600">
                        <th className="px-6 py-4 font-semibold">Tipo</th>
                        <th className="px-6 py-4 font-semibold">Nombre</th>
                        <th className="px-6 py-4 font-semibold">Apellido</th>
                        <th className="px-6 py-4 font-semibold">Carnet</th>
                        <th className="px-6 py-4 font-semibold">Cod. empleado</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Carrera/Depto</th>
                        <th className="px-6 py-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filtered.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 align-top transition hover:bg-violet-50/40"
                        >
                          <td className="px-6 py-4 text-gray-700">{item.tipo_paciente}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.nombre}</td>
                          <td className="px-6 py-4 text-gray-700">{item.apellido}</td>
                          <td className="px-6 py-4 text-gray-500">{item.carnet_uni ?? "-"}</td>
                          <td className="px-6 py-4 text-gray-500">{item.codigo_empleado ?? "-"}</td>
                          <td className="px-6 py-4 text-gray-500">{item.email ?? "-"}</td>
                          <td className="px-6 py-4 text-gray-500">{item.carrera_depto ?? "-"}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => nav(`/expedientes/${item.id}/historial`)}
                                className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                                Historial
                              </button>
                              <button
                                onClick={() => void handleDelete(item.id)}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
