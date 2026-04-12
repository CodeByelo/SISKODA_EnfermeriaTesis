import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArchiveBoxIcon,
  ArrowLongLeftIcon,
} from "@heroicons/react/24/outline";
import type { Insumo } from "./types";
import { authFetch } from "../../lib/auth";

export default function Inventario() {
  const nav = useNavigate();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInsumos = async () => {
    setLoading(true);

    try {
      const res = await authFetch("/api/inventario");
      const data = await res.json();
      setInsumos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInsumos();
  }, []);

  const estadoStock = (insumo: Insumo) => {
    const hoy = new Date();
    const vencimiento = insumo.fecha_vencimiento ? new Date(insumo.fecha_vencimiento) : null;

    if (vencimiento && vencimiento < hoy) return "Vencido";
    if (insumo.stock_actual < insumo.stock_minimo) return "Bajo stock";
    return "Normal";
  };

  const colorEstado = (estado: string) => {
    if (estado === "Vencido") return "bg-red-100 text-red-700";
    if (estado === "Bajo stock") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Estas seguro de eliminar este insumo?")) return;

    try {
      const res = await authFetch(`/api/inventario/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInsumos(insumos.filter((item) => item.id !== id));
        alert("Insumo eliminado");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "No se pudo eliminar"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexion");
    }
  };

  const insumosFiltrados = useMemo(
    () =>
      insumos.filter(
        (item) =>
          item.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
          item.categoria?.toLowerCase().includes(filtro.toLowerCase()) ||
          item.lote?.toLowerCase().includes(filtro.toLowerCase())
      ),
    [filtro, insumos]
  );

  const resumen = useMemo(() => {
    const bajos = insumos.filter((item) => estadoStock(item) === "Bajo stock").length;
    const vencidos = insumos.filter((item) => estadoStock(item) === "Vencido").length;

    return [
      { etiqueta: "Insumos", valor: insumos.length },
      { etiqueta: "Bajo stock", valor: bajos },
      { etiqueta: "Vencidos", valor: vencidos },
    ];
  }, [insumos]);

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
                Inventario
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Control de insumos</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Gestiona existencias, entradas, salidas y alertas de stock con la misma vista operativa del sistema.
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
                  Bandeja principal
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">Existencias activas</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => nav("/inventario/nuevo")}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  <ArchiveBoxIcon className="h-5 w-5" />
                  Nuevo insumo
                </button>
                <button
                  onClick={() => nav("/inventario/entrada")}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  Entrada
                </button>
                <button
                  onClick={() => nav("/inventario/salida")}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                  Salida
                </button>
                <button
                  onClick={() => void fetchInsumos()}
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
            <input
              type="text"
              placeholder="Buscar por nombre, categoria o lote..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />

            <div className="overflow-hidden rounded-[28px] border border-violet-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-violet-50/80">
                    <tr className="border-b border-violet-100 text-sm text-gray-600">
                      <th className="px-6 py-4 font-semibold">Nombre</th>
                      <th className="px-6 py-4 font-semibold">Categoria</th>
                      <th className="px-6 py-4 font-semibold">Stock</th>
                      <th className="px-6 py-4 font-semibold">Minimo</th>
                      <th className="px-6 py-4 font-semibold">Vencimiento</th>
                      <th className="px-6 py-4 font-semibold">Estado</th>
                      <th className="px-6 py-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {insumosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                          No hay insumos visibles con el filtro actual.
                        </td>
                      </tr>
                    ) : (
                      insumosFiltrados.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 align-top transition hover:bg-violet-50/40"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{item.nombre}</td>
                          <td className="px-6 py-4 text-gray-600">{item.categoria || "-"}</td>
                          <td className="px-6 py-4 text-gray-700">
                            {item.stock_actual} {item.unidad_medida}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.stock_minimo}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {item.fecha_vencimiento
                              ? new Date(item.fecha_vencimiento).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(estadoStock(item))}`}
                            >
                              {estadoStock(item)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => void handleDelete(item.id)}
                              disabled={item.stock_actual > 0}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                item.stock_actual > 0
                                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                  : "bg-rose-600 text-white hover:bg-rose-700"
                              }`}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
