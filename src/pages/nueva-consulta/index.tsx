import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../../contexts/notification-context";
import api from "../../services/api";
import { authFetch, setCachedJson } from "../../lib/auth";
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
  { numero: 1, titulo: "Paciente", descripcion: "Datos personales", icono: UserCircleIcon },
  { numero: 2, titulo: "Perfil", descripcion: "Relacion institucional", icono: IdentificationIcon },
  { numero: 3, titulo: "Evaluacion", descripcion: "Motivo y sintomas", icono: ClipboardDocumentCheckIcon },
  { numero: 4, titulo: "Cierre", descripcion: "Diagnostico y plan", icono: CheckCircleIcon },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100";

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function NuevaConsulta() {
  const nav = useNavigate();
  const { paciente_id } = useParams<{ paciente_id?: string }>();
  const { notify } = useNotifications();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<ConsultaForm>(formVacio);

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

  const resumen = useMemo(
    () => [
      { etiqueta: "Paciente", valor: `${form.nombre || "Sin"} ${form.apellido || "asignar"}` },
      { etiqueta: "Tipo", valor: form.tipo_paciente || "Pendiente" },
      { etiqueta: "Prioridad", valor: form.prioridad },
    ],
    [form]
  );

  const siguiente = () => paso < 4 && setPaso((actual) => actual + 1);
  const anterior = () => paso > 1 && setPaso((actual) => actual - 1);

  const enviar = async () => {
    if (!form.tipo_paciente) {
      return notify({ tone: "info", title: "Falta el tipo de paciente" });
    }
    if (!form.nombre.trim() || !form.apellido.trim()) {
      return notify({ tone: "info", title: "Nombre y apellido son obligatorios" });
    }
    if (!form.motivo.trim()) {
      return notify({ tone: "info", title: "El motivo de la consulta es obligatorio" });
    }

    if (!paciente_id && form.carnet_uni) {
      const exists = await checkIfPacienteExists(form.carnet_uni, form.tipo_paciente);
      if (exists) {
        notify({
          tone: "info",
          title: "Paciente ya identificado",
          message: "El sistema usará el expediente existente para este carnet.",
        });
        // No bloqueamos el flujo, permitimos que el backend lo vincule automáticamente
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

      setCachedJson("consultas-hoy", [], 0);

      notify({
        tone: "success",
        title: "Consulta guardada",
        message: "La consulta quedo registrada correctamente.",
      });
      nav("/consultas-hoy");
    } catch (error) {
      console.error("Error al enviar:", error);
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Revisa los datos e intenta nuevamente."
          : "Revisa los datos e intenta nuevamente.";

      notify({
        tone: "error",
        title: "No se pudo guardar",
        message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-50 to-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-[28px] bg-gradient-to-r from-[#1d1029] via-[#2e1742] to-[#4f2671] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
                Nueva consulta
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Registro clínico</h1>
            </div>

            <div className="grid gap-3 self-center sm:grid-cols-3">
              {resumen.map((item) => (
                <div key={item.etiqueta} className="flex min-h-[104px] flex-col justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-200">{item.etiqueta}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.valor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl bg-white p-4 shadow-lg">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
              Etapas
            </p>
            <div className="mt-4 space-y-3">
              {pasos.map((item) => {
                const Icono = item.icono;
                const activo = item.numero === paso;
                const completado = item.numero < paso;
                return (
                  <button
                    key={item.numero}
                    type="button"
                    onClick={() => setPaso(item.numero)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      activo
                        ? "border-violet-200 bg-violet-50"
                        : completado
                          ? "border-violet-100 bg-white"
                          : "border-gray-200 bg-white hover:border-violet-100 hover:bg-violet-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          activo || completado ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icono className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Paso {item.numero}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-gray-900">{item.titulo}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.descripcion}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="rounded-3xl bg-white shadow-lg">
            <div className="border-b border-gray-100 px-8 py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
                {pasos[paso - 1].titulo}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                {pasos[paso - 1].descripcion}
              </h2>
            </div>

            <div className="space-y-6 px-8 py-8">
              {paso === 1 && (
                <div className="grid gap-5 md:grid-cols-2">
                  <Campo label="Tipo de paciente">
                    <select
                      name="tipo_paciente"
                      value={form.tipo_paciente}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={!!paciente_id}
                    >
                      <option value="">Seleccione una categoria</option>
                      <option value="Estudiante">Estudiante</option>
                      <option value="Profesor">Profesor</option>
                      <option value="Personal Administrativo">Personal Administrativo</option>
                    </select>
                  </Campo>
                  <Campo label="Telefono">
                    <input
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="+58..."
                      className={inputClass}
                      disabled={!!paciente_id}
                    />
                  </Campo>
                  <Campo label="Nombre">
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Nombre"
                      className={inputClass}
                      disabled={!!paciente_id}
                    />
                  </Campo>
                  <Campo label="Apellido">
                    <input
                      name="apellido"
                      value={form.apellido}
                      onChange={handleChange}
                      placeholder="Apellido"
                      className={inputClass}
                      disabled={!!paciente_id}
                    />
                  </Campo>
                  <div className="md:col-span-2">
                    <Campo label="Correo">
                      <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="correo@dominio.com"
                        className={inputClass}
                        disabled={!!paciente_id}
                      />
                    </Campo>
                  </div>
                </div>
              )}

              {paso === 2 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {form.tipo_paciente === "Estudiante" && (
                    <>
                      <Campo label="Carnet universitario">
                        <input name="carnet_uni" value={form.carnet_uni} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Carrera">
                        <input name="carrera" value={form.carrera} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Trimestre">
                        <input name="semestre_anio" value={form.semestre_anio} onChange={handleChange} className={inputClass} />
                      </Campo>
                    </>
                  )}

                  {form.tipo_paciente === "Profesor" && (
                    <>
                      <Campo label="Codigo de empleado">
                        <input name="codigo_empleado" value={form.codigo_empleado} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Departamento">
                        <input name="departamento" value={form.departamento} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
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
                        <input name="codigo_empleado" value={form.codigo_empleado} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Cargo">
                        <input name="cargo" value={form.cargo} onChange={handleChange} className={inputClass} disabled={!!paciente_id} />
                      </Campo>
                      <Campo label="Extension">
                        <input name="extension" value={form.extension} onChange={handleChange} className={inputClass} />
                      </Campo>
                    </>
                  )}

                  {!form.tipo_paciente && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 md:col-span-2">
                      Selecciona primero el tipo de paciente para completar este bloque.
                    </div>
                  )}
                </div>
              )}

              {paso === 3 && (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Campo label="Antecedentes">
                      <input name="antecedentes" value={form.antecedentes} onChange={handleChange} className={inputClass} />
                    </Campo>
                    <Campo label="Alergias">
                      <input name="alergias" value={form.alergias} onChange={handleChange} className={inputClass} />
                    </Campo>
                    <Campo label="Temperatura">
                      <input name="temperatura" value={form.temperatura} onChange={handleChange} className={inputClass} />
                    </Campo>
                    <Campo label="Tension arterial">
                      <input name="tension_arterial" value={form.tension_arterial} onChange={handleChange} className={inputClass} />
                    </Campo>
                    <Campo label="Frecuencia cardiaca">
                      <input name="frecuencia_cardiaca" value={form.frecuencia_cardiaca} onChange={handleChange} className={inputClass} />
                    </Campo>
                    <Campo label="Prioridad">
                      <select name="prioridad" value={form.prioridad} onChange={handleChange} className={inputClass}>
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </Campo>
                  </div>
                  <Campo label="Motivo de la consulta">
                    <textarea name="motivo" value={form.motivo} onChange={handleChange} className={`${inputClass} min-h-[140px] resize-none`} />
                  </Campo>
                  <Campo label="Sintomas observados">
                    <textarea name="sintomas" value={form.sintomas} onChange={handleChange} className={`${inputClass} min-h-[180px] resize-none`} />
                  </Campo>
                </div>
              )}

              {paso === 4 && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Campo label="Diagnostico">
                    <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} className={`${inputClass} min-h-[220px] resize-none`} />
                  </Campo>
                  <Campo label="Notas y recomendaciones">
                    <textarea name="notas_recom" value={form.notas_recom} onChange={handleChange} className={`${inputClass} min-h-[220px] resize-none`} />
                  </Campo>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-100 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => nav("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
                >
                  <ArrowLongLeftIcon className="h-5 w-5" />
                  Volver al inicio
                </button>
                <button
                  type="button"
                  onClick={anterior}
                  disabled={paso === 1}
                  className="rounded-full bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-40"
                >
                  Paso anterior
                </button>
              </div>

              <button
                type="button"
                onClick={paso === 4 ? enviar : siguiente}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-700 via-purple-700 to-black px-7 py-3 text-sm font-semibold text-white shadow-lg"
              >
                {paso === 4 ? "Registrar consulta" : "Continuar"}
                <ArrowLongRightIcon className="h-5 w-5" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
