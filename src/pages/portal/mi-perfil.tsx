import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLongLeftIcon, 
  IdentificationIcon, 
  ShieldCheckIcon, 
  ClipboardDocumentListIcon,
  EyeIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/auth-context";
import { authFetch } from "../../lib/auth";

type PortalProfile = {
  user_id: string;
  email: string;
  role: string;
  estado_cuenta: string;
  ultimo_acceso: string | null;
  persona_id: string | null;
  tipo_miembro: string | null;
  cedula: string | null;
  codigo_institucional: string | null;
  nombres: string | null;
  apellidos: string | null;
  correo_institucional: string | null;
  telefono: string | null;
  carrera_depto: string | null;
  categoria: string | null;
  cargo: string | null;
  lapso: string | null;
  fecha_vencimiento_carnet: string | null;
  activo: boolean;
  expediente_id: string | null;
  visibilidad_paciente: string | null;
};

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

export default function MiPerfil() {
  const nav = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsulta, setSelectedConsulta] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          authFetch("/api/portal/me/profile"),
          authFetch("/api/portal/me/history")
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-8 relative">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#0891b2] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">Portal personal</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mi perfil institucional</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50">
                Consulta tu identidad institucional y tu historial médico directamente aquí.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                nav("/", { replace: true });
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white"
            >
              <ArrowLongLeftIcon className="h-5 w-5" />
              Salir
            </button>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[28px] bg-white p-8 shadow-sm">Cargando datos...</section>
        ) : !profile ? (
          <section className="rounded-[28px] bg-white p-8 shadow-sm">No se pudo cargar tu perfil.</section>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <IdentificationIcon className="h-8 w-8 text-sky-600" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">Identidad</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {[profile.nombres, profile.apellidos].filter(Boolean).join(" ")}
                </p>
                <p className="mt-2 text-sm text-slate-500">{profile.tipo_miembro ?? "Sin clasificacion"}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <ShieldCheckIcon className="h-8 w-8 text-emerald-600" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">Acceso</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.estado_cuenta}</p>
                <p className="mt-2 text-sm text-slate-500">Rol: {profile.role}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Expediente</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {profile.expediente_id ? `#${profile.expediente_id}` : "Pendiente"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Visibilidad: {profile.visibilidad_paciente ?? "Sin definir"}
                </p>
              </article>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500 mb-6">Mi Historial Médico</p>
              
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-base font-semibold text-slate-800">No hay consultas registradas todavía.</p>
                  <p className="mt-2 text-sm text-slate-500">Tu historial aparecerá aquí en cuanto el personal de enfermería registre una atención.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map((item) => (
                    <article key={item.id} className="rounded-[24px] border border-violet-100 bg-slate-50/50 p-6 relative group transition hover:border-violet-300">
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
                        <div className="flex items-center gap-3">
                          <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                            Prioridad: {item.prioridad}
                          </span>
                          <button
                            onClick={() => setSelectedConsulta(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition hover:bg-violet-600 hover:text-white hover:border-violet-600"
                            title="Ver detalle completo"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnóstico</p>
                          <p className="mt-2 text-sm text-slate-700 line-clamp-2">{item.diagnostico ?? "Sin detalle"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Medicamentos</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-700 line-clamp-2">{item.medicamentos ?? "Sin registro"}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Datos institucionales</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p><span className="font-semibold">Cedula:</span> {profile.cedula ?? "No registrada"}</p>
                    <p><span className="font-semibold">Codigo institucional:</span> {profile.codigo_institucional ?? "No registrado"}</p>
                    <p><span className="font-semibold">Correo:</span> {profile.correo_institucional ?? profile.email}</p>
                    <p><span className="font-semibold">Telefono:</span> {profile.telefono ?? "No registrado"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Relacion academica</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p><span className="font-semibold">Carrera / departamento:</span> {profile.carrera_depto ?? "No registrado"}</p>
                    <p><span className="font-semibold">Categoria:</span> {profile.categoria ?? "No registrada"}</p>
                    <p><span className="font-semibold">Cargo:</span> {profile.cargo ?? "No registrado"}</p>
                    <p><span className="font-semibold">Lapso:</span> {profile.lapso ?? "No registrado"}</p>
                    <p><span className="font-semibold">Vencimiento carnet:</span> {profile.fecha_vencimiento_carnet ?? "No registrado"}</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative p-8">
              <button 
                onClick={() => setSelectedConsulta(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition"
              >
                <XMarkIcon className="h-6 w-6 text-slate-400" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <ClipboardDocumentListIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{selectedConsulta.motivo ?? "Detalle de Consulta"}</h3>
                  <p className="text-sm text-slate-500">{new Date(selectedConsulta.creado_en).toLocaleString("es-VE")}</p>
                </div>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-5 rounded-2xl bg-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 mb-2">Prioridad</p>
                    <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {selectedConsulta.prioridad}
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 mb-2">Estado</p>
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Finalizada
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Síntomas Observados</p>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {selectedConsulta.sintomas || "No se registraron síntomas específicos."}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-violet-50/30 border border-violet-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">Diagnóstico Médico</p>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {selectedConsulta.diagnostico || "Diagnóstico pendiente de evaluación detallada."}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-6 rounded-2xl bg-emerald-50/30 border border-emerald-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">Medicamentos</p>
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {selectedConsulta.medicamentos || "Ningún medicamento recetado."}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Recomendaciones</p>
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {selectedConsulta.notas_recom || "Sin notas adicionales."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setSelectedConsulta(null)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-semibold shadow-xl transition hover:bg-slate-800"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
