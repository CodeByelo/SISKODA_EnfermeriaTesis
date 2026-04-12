import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLongLeftIcon, IdentificationIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { authFetch } from "../../lib/auth";

type PortalProfile = {
  user_id: number;
  email: string;
  role: string;
  estado_cuenta: string;
  ultimo_acceso: string | null;
  persona_id: number | null;
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
  expediente_id: number | null;
  visibilidad_paciente: string | null;
};

export default function MiPerfil() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authFetch("/api/portal/me/profile");
        const data = (await response.json()) as PortalProfile;
        if (response.ok) {
          setProfile(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#0891b2] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">Portal personal</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mi perfil institucional</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50">
                Consulta tu identidad institucional, estado de cuenta y vinculo con tu expediente clinico.
              </p>
            </div>
            <button
              onClick={() => nav("/dashboard")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white"
            >
              <ArrowLongLeftIcon className="h-5 w-5" />
              Volver
            </button>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[28px] bg-white p-8 shadow-sm">Cargando perfil...</section>
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
    </div>
  );
}
