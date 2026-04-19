import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLongLeftIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { authFetch } from "../../lib/auth";

type HistoryItem = {
  id: string;
  creado_en: string;
  prioridad: string;
  motivo: string | null;
  sintomas: string | null;
  diagnostico: string | null;
  medicamentos: string | null;
  notas_recom: string | null;
};

export default function MiHistorial() {
  const nav = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await authFetch("/api/portal/me/history");
        const data = (await response.json()) as HistoryItem[];
        if (response.ok && Array.isArray(data)) {
          setItems(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#172554] via-[#3730a3] to-[#6d28d9] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-100">Portal personal</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mi historial</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-50">
                Revisa tus atenciones registradas, prioridades y recomendaciones de seguimiento.
              </p>
            </div>
            <button
              onClick={() => nav("/")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white"
            >
              <ArrowLongLeftIcon className="h-5 w-5" />
              Volver
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 rounded-[24px] border border-violet-100 bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Informacion</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Aqui solo aparecen las consultas que el personal de enfermeria ya registro en tu expediente.
              Si acabas de crear tu cuenta institucional y aun no ves movimientos, no es un error: tu historial se mostrara cuando existan atenciones cargadas a tu identidad.
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando historial...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
              <p className="text-base font-semibold text-slate-800">Aun no hay consultas visibles en tu portal.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Esto puede pasar si todavia no te han registrado una atencion o si tu cuenta institucional fue creada antes de que se cargara el expediente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <ClipboardDocumentListIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{item.motivo ?? "Consulta registrada"}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(item.creado_en).toLocaleString("es-VE")}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      Prioridad: {item.prioridad}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sintomas</p>
                      <p className="mt-2 text-sm text-slate-700">{item.sintomas ?? "Sin detalle"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnostico</p>
                      <p className="mt-2 text-sm text-slate-700">{item.diagnostico ?? "Sin detalle"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Medicamentos</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{item.medicamentos ?? "Sin registro"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recomendaciones</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{item.notas_recom ?? "Sin registro"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
