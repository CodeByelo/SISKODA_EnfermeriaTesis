import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../../contexts/notification-context";
import api from "../../services/api";
import { authFetch } from "../../lib/auth";
import type { ConsultaForm } from "./types";

const formVacio: ConsultaForm = {
  tipo_paciente: "",
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  carnet_uni: "",
  carrera: "",
  semestre_anio: "",
  codigo_empleado: "",
  departamento: "",
  categoria: "",
  cargo: "",
  extension: "",
  motivo: "",
  sintomas: "",
  diagnostico: "",
  medicamentos: [],
  notas_recom: "",
  prioridad: "Normal",
  antecedentes: "",
  alergias: "",
  temperatura: "",
  tension_arterial: "",
  frecuencia_cardiaca: "",
};

const pasos = [
  { numero: 1, titulo: "Identidad", texto: "Datos base del paciente.", icono: UserCircleIcon },
  { numero: 2, titulo: "Perfil", texto: "Contexto academico o laboral.", icono: IdentificationIcon },
  { numero: 3, titulo: "Evaluacion", texto: "Motivo, sintomas y prioridad.", icono: ClipboardDocumentCheckIcon },
  { numero: 4, titulo: "Cierre", texto: "Diagnostico y recomendaciones.", icono: CheckBadgeIcon },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function NuevaConsulta() {
  const nav = useNavigate();
  const { paciente_id } = useParams<{ paciente_id?: string }>();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<ConsultaForm>(formVacio);
  const { notify } = useNotifications();

  useEffect(() => {
    if (!paciente_id) return;

    authFetch(`/api/expedientes/${paciente_id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...formVacio,
          tipo_paciente: data.tipo_paciente,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email || "",
          telefono: data.telefono || "",
          carnet_uni: data.carnet_uni || "",
          carrera: data.carrera_depto || "",
          codigo_empleado: data.codigo_empleado || "",
          departamento: data.carrera_depto || "",
          categoria: data.categoria || "",
          cargo: data.cargo || "",
        });
      });
  }, [paciente_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const siguiente = () => paso < 4 && setPaso((actual) => actual + 1);
  const anterior = () => paso > 1 && setPaso((actual) => actual - 1);

  const progreso = (paso / pasos.length) * 100;
  const pasoActual = pasos[paso - 1];
  const resumen = useMemo(
    () => [
      { k: "Paciente", v: `${form.nombre || "Sin"} ${form.apellido || "asignar"}` },
      { k: "Tipo", v: form.tipo_paciente || "Pendiente" },
      { k: "ID", v: form.carnet_uni || form.codigo_empleado || "No definido" },
      { k: "Prioridad", v: form.prioridad },
    ],
    [form]
  );

  const checkIfPacienteExists = async (carnet: string, tipo: string) => {
    try {
      const res = await authFetch(
        `/api/expedientes/check?carnet=${encodeURIComponent(carnet)}&tipo=${encodeURIComponent(tipo)}`
      );
      const data = await res.json();
      return data.exists;
    } catch (err) {
      console.error("Error al verificar paciente:", err);
      return false;
    }
  };

  const enviar = async () => {
    if (!form.tipo_paciente) return notify({ tone: "info", title: "Falta el tipo de paciente" });
    if (!form.nombre.trim() || !form.apellido.trim()) {
      return notify({ tone: "info", title: "Nombre y apellido son obligatorios" });
    }
    if (!form.motivo.trim()) {
      return notify({ tone: "info", title: "El motivo de la consulta es obligatorio" });
    }

    if (!paciente_id && form.carnet_uni) {
      const exists = await checkIfPacienteExists(form.carnet_uni, form.tipo_paciente);
      if (exists) {
        return notify({
          tone: "info",
          title: "Paciente ya registrado",
          message: "Agrega la consulta desde el historial del expediente.",
        });
      }
    }

    try {
      const resumenClinico = [
        form.antecedentes.trim() ? `Antecedentes: ${form.antecedentes.trim()}` : "",
        form.alergias.trim() ? `Alergias: ${form.alergias.trim()}` : "",
        form.temperatura.trim() ? `Temperatura: ${form.temperatura.trim()}` : "",
        form.tension_arterial.trim() ? `Tension arterial: ${form.tension_arterial.trim()}` : "",
        form.frecuencia_cardiaca.trim() ? `Frecuencia cardiaca: ${form.frecuencia_cardiaca.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await api.post("/api/consultas", {
        ...form,
        medicamentos: form.medicamentos.join("\n"),
        sintomas: [form.sintomas.trim(), resumenClinico].filter(Boolean).join("\n\n"),
        paciente_id: paciente_id || undefined,
        antecedentes: undefined,
        alergias: undefined,
        temperatura: undefined,
        tension_arterial: undefined,
        frecuencia_cardiaca: undefined,
      });
      notify({ tone: "success", title: "Consulta guardada", message: "La consulta quedo registrada correctamente." });
      nav("/consultas-hoy");
    } catch (error) {
      console.error("Error al enviar:", error);
      notify({ tone: "error", title: "No se pudo guardar", message: "Revisa los datos e intenta nuevamente." });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_85%_10%,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(160deg,_#f8fbff_0%,_#edf4ff_42%,_#f7fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <SparklesIcon className="h-4 w-4" />
                Nueva consulta premium
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Un flujo de consulta con presencia, jerarquia y mejor lectura clinica.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300">
                Reorganicé la experiencia para que se sienta mas cercana a una plataforma clinica
                seria y menos a un formulario plano.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Progreso</span>
                <span className="font-semibold text-white">{paso} / 4</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {resumen.map((item) => (
                  <div key={item.k} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.k}</p>
                    <p className="mt-2 text-sm font-medium text-white">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white/85 p-4 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600">Ruta</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Bitacora visual</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                {Math.round(progreso)}%
              </div>
            </div>

            <div className="space-y-3">
              {pasos.map((item) => {
                const Icono = item.icono;
                const activo = item.numero === paso;
                const completado = item.numero < paso;

                return (
                  <button
                    key={item.numero}
                    type="button"
                    onClick={() => setPaso(item.numero)}
                    className={`w-full rounded-[26px] border px-4 py-4 text-left transition ${
                      activo
                        ? "border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-100"
                        : completado
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        activo ? "bg-slate-950 text-cyan-200" : completado ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        <Icono className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Paso {item.numero}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">{item.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.texto}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="rounded-[34px] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(148,163,184,0.22)] backdrop-blur-xl">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600">
                {pasoActual.titulo}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {pasoActual.texto}
              </h2>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {paso === 1 && (
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-950 p-3 text-cyan-200">
                        <UserCircleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">Identidad primaria</h3>
                        <p className="text-sm text-slate-500">Los datos que dominan el expediente.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo label="Tipo de paciente">
                        <select name="tipo_paciente" value={form.tipo_paciente} onChange={handleChange} className={inputClass} disabled={!!paciente_id}>
                          <option value="">Seleccione una categoria</option>
                          <option value="Estudiante">Estudiante</option>
                          <option value="Profesor">Profesor</option>
                          <option value="Personal Administrativo">Personal Administrativo</option>
                        </select>
                      </Campo>
                      <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                        El tipo del paciente define el bloque institucional de la siguiente etapa.
                      </div>
                      <Campo label="Nombre">
                        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Maria Fernanda" className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Apellido">
                        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Salcedo" className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                    <h3 className="text-xl font-semibold">Canales de contacto</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">Utiles para seguimiento y recomendaciones.</p>
                    <div className="mt-5 space-y-4">
                      <Campo label="Correo">
                        <input name="email" value={form.email} onChange={handleChange} placeholder="correo@dominio.com" className={`${inputClass} border-white/10 bg-white/10 text-white placeholder:text-slate-300`} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Telefono">
                        <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+58..." className={`${inputClass} border-white/10 bg-white/10 text-white placeholder:text-slate-300`} disabled={!!paciente_id} />
                      </Campo>
                    </div>
                  </div>
                </div>
              )}

              {paso === 2 && (
                <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                  <h3 className="text-xl font-semibold text-slate-900">Perfil institucional</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">Campos dinamicos segun el tipo de paciente.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {form.tipo_paciente === "Estudiante" && (
                      <>
                        <Campo label="Carnet universitario">
                          <input name="carnet_uni" value={form.carnet_uni} onChange={handleChange} placeholder="202401245" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Carrera">
                          <input name="carrera" value={form.carrera} onChange={handleChange} placeholder="Enfermeria" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Semestre o ano">
                          <input name="semestre_anio" value={form.semestre_anio} onChange={handleChange} placeholder="5to semestre" className={inputClass} />
                        </Campo>
                      </>
                    )}
                    {form.tipo_paciente === "Profesor" && (
                      <>
                        <Campo label="Codigo de empleado">
                          <input name="codigo_empleado" value={form.codigo_empleado} onChange={handleChange} placeholder="PR-204" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Departamento">
                          <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Coordinacion academica" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Categoria">
                          <select name="categoria" value={form.categoria} onChange={handleChange} className={inputClass} disabled={!!paciente_id}>
                            <option value="">Seleccione categoria</option>
                            <option value="Auxiliar">Auxiliar</option>
                            <option value="Asociado">Asociado</option>
                            <option value="Titular">Titular</option>
                          </select>
                        </Campo>
                      </>
                    )}
                    {form.tipo_paciente === "Personal Administrativo" && (
                      <>
                        <Campo label="Codigo de empleado">
                          <input name="codigo_empleado" value={form.codigo_empleado} onChange={handleChange} placeholder="ADM-111" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Cargo">
                          <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Analista" className={inputClass} disabled={!!paciente_id} />
                        </Campo>
                        <Campo label="Extension">
                          <input name="extension" value={form.extension} onChange={handleChange} placeholder="220" className={inputClass} />
                        </Campo>
                      </>
                    )}
                    {!form.tipo_paciente && (
                      <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                        Selecciona primero el tipo de paciente para desbloquear este bloque.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paso === 3 && (
                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-slate-900">Narrativa clinica</h3>
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Campo label="Antecedentes relevantes">
                          <input name="antecedentes" value={form.antecedentes} onChange={handleChange} placeholder="Hipertension, asma..." className={inputClass} />
                        </Campo>
                        <Campo label="Alergias">
                          <input name="alergias" value={form.alergias} onChange={handleChange} placeholder="Penicilina, latex..." className={inputClass} />
                        </Campo>
                        <Campo label="Temperatura">
                          <input name="temperatura" value={form.temperatura} onChange={handleChange} placeholder="37.2 C" className={inputClass} />
                        </Campo>
                        <Campo label="Tension arterial">
                          <input name="tension_arterial" value={form.tension_arterial} onChange={handleChange} placeholder="120/80" className={inputClass} />
                        </Campo>
                        <Campo label="Frecuencia cardiaca">
                          <input name="frecuencia_cardiaca" value={form.frecuencia_cardiaca} onChange={handleChange} placeholder="78 lpm" className={inputClass} />
                        </Campo>
                      </div>
                      <Campo label="Motivo de la consulta">
                        <textarea name="motivo" value={form.motivo} onChange={handleChange} placeholder="Describe la razon principal del ingreso." className={`${inputClass} min-h-[140px] resize-none`} />
                      </Campo>
                      <Campo label="Sintomas observados">
                        <textarea name="sintomas" value={form.sintomas} onChange={handleChange} placeholder="Sintomas, signos o evolucion." className={`${inputClass} min-h-[190px] resize-none`} />
                      </Campo>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                      <h3 className="text-xl font-semibold">Prioridad</h3>
                      <div className="mt-5 grid gap-3">
                        {["Normal", "Urgente"].map((nivel) => (
                          <button
                            key={nivel}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, prioridad: nivel as "Normal" | "Urgente" }))}
                            className={`rounded-2xl border px-4 py-4 text-left ${
                              form.prioridad === nivel ? "border-cyan-300 bg-cyan-400/15" : "border-white/10 bg-white/5"
                            }`}
                          >
                            <p className="text-sm font-semibold uppercase tracking-[0.18em]">{nivel}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {nivel === "Urgente" ? "Atencion prioritaria." : "Flujo ordinario."}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[28px] border border-cyan-100 bg-cyan-50/70 p-5 text-sm leading-7 text-slate-600">
                      Escribe primero el motivo con lenguaje claro y deja los sintomas para el detalle
                      clinico.
                    </div>
                  </div>
                </div>
              )}

              {paso === 4 && (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-slate-900">Diagnostico</h3>
                    <div className="mt-5">
                      <Campo label="Impresion diagnostica">
                        <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} placeholder="Hallazgos y juicio clinico." className={`${inputClass} min-h-[220px] resize-none`} />
                      </Campo>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white">
                    <h3 className="text-xl font-semibold">Plan de cuidado</h3>
                    <div className="mt-5">
                      <Campo label="Notas y recomendaciones">
                        <textarea name="notas_recom" value={form.notas_recom} onChange={handleChange} placeholder="Reposo, control, remision, vigilancia..." className={`${inputClass} min-h-[220px] resize-none border-white/10 bg-white/10 text-white placeholder:text-slate-300`} />
                      </Campo>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-300">
                        Los antecedentes, alergias y signos vitales se anexaran al resumen clinico de la consulta.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => nav("/dashboard")} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                    <ArrowLongLeftIcon className="h-5 w-5" />
                    Volver al inicio
                  </button>
                  <button type="button" onClick={anterior} disabled={paso === 1} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40">
                    Paso anterior
                  </button>
                </div>

                <button
                  type="button"
                  onClick={paso === 4 ? enviar : siguiente}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-slate-950 via-cyan-700 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(8,47,73,0.26)]"
                >
                  {paso === 4 ? "Registrar consulta" : "Continuar"}
                  <ArrowLongRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
