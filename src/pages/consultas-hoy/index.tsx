import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { authFetch, getCachedJson, setCachedJson } from "../../lib/auth";

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
  const cached = getCachedJson<ConsultaHoy[]>("consultas-hoy");
  const [list, setList] = useState<ConsultaHoy[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchHoy = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await authFetch("/api/consultas-hoy");
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      setList(normalized);
      setCachedJson("consultas-hoy", normalized, 45_000);
    } catch (err) {
      console.error(err);
      if (!options?.silent) {
        setList([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchHoy({ silent: Boolean(cached?.length) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = list.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.carnet_uni ?? ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-64 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-100" />
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
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="rounded-[24px] border border-gray-100 p-5">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="mt-4 h-6 w-48 rounded bg-gray-200" />
                  <div className="mt-4 h-4 w-full rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const urgentes = filtered.filter((item) => item.prioridad === "Urgente").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_35%),linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_24px_60px_-40px_rgba(76,29,149,0.35)]">
          <div className="flex flex-col gap-6 bg-gradient-to-r from-[#23102f] via-[#34164c] to-[#4c1d72] px-6 py-7 text-white lg:flex-row lg:items-center lg:justify-between xl:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-200">
                Agenda clínica
              </p>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Consultas de hoy</h1>
              <p className="mt-3 text-sm leading-6 text-violet-100 md:text-base">
                Revisa la jornada activa, detecta prioridades urgentes y entra rápido al flujo de atención.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Total</p>
                <p className="mt-2 text-3xl font-semibold">{list.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Urgentes</p>
                <p className="mt-2 text-3xl font-semibold">{urgentes}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Estado</p>
                <p className="mt-2 text-base font-semibold">{refreshing ? "Actualizando" : "Al día"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-violet-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between xl:px-8">
            <div className="relative flex-1">
              <FunnelIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o carnet..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-2xl border border-violet-100 bg-violet-50/50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void fetchHoy({ silent: true })}
                className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
              <button
                onClick={() => nav("/dashboard")}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-violet-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-800">Sin consultas visibles</p>
            <p className="mt-2 text-sm text-gray-500">
              {filter
                ? "No hay coincidencias con el filtro aplicado."
                : "Todavía no hay consultas registradas para hoy."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {filtered.map((c) => (
                <article
                  key={c.id}
                  className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-[0_20px_40px_-34px_rgba(76,29,149,0.35)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {c.nombre} {c.apellido}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{c.carnet_uni ?? "Sin carnet"}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        c.prioridad === "Urgente"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {c.prioridad}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-violet-50/60 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 text-violet-500" />
                      {c.hora}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 text-violet-500" />
                      Atención del día
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Motivo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{c.motivo}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_22px_50px_-40px_rgba(76,29,149,0.35)] md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-violet-50/80">
                    <tr className="border-b border-violet-100 text-sm text-gray-600">
                      <th className="px-6 py-4 font-semibold">Hora</th>
                      <th className="px-6 py-4 font-semibold">Nombre</th>
                      <th className="px-6 py-4 font-semibold">Apellido</th>
                      <th className="px-6 py-4 font-semibold">Carnet</th>
                      <th className="px-6 py-4 font-semibold">Motivo</th>
                      <th className="px-6 py-4 font-semibold">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100 align-top transition hover:bg-violet-50/40">
                        <td className="px-6 py-4 font-medium text-gray-700">{c.hora}</td>
                        <td className="px-6 py-4 text-gray-800">{c.nombre}</td>
                        <td className="px-6 py-4 text-gray-800">{c.apellido}</td>
                        <td className="px-6 py-4 text-gray-500">{c.carnet_uni ?? "—"}</td>
                        <td className="px-6 py-4 text-gray-600">{c.motivo}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              c.prioridad === "Urgente"
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
