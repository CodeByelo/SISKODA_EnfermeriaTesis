import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import { authFetch } from "../../lib/auth";
import { useNotifications } from "../../contexts/notification-context";
import type { Expediente } from "./types";

type Consulta = {
  id: string;
  motivo: string;
  sintomas: string | null;
  diagnostico: string | null;
  medicamentos: string | null;
  notas_recom: string | null;
  prioridad: string;
  creado_en: string;
};

type InventarioMedicamento = {
  id: string;
  nombre: string;
  cantidad_disponible: number;
};

type ConsultaPayload = {
  motivo: string;
  sintomas: string;
  diagnostico: string;
  medicamentos: string[] | string;
  notas_recom: string;
  prioridad: string;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatPrintDate = (value: string) =>
  new Date(value).toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  });

export default function HistorialPaciente() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { notify } = useNotifications();
  const [paciente, setPaciente] = useState<Expediente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoConsulta, setEditandoConsulta] = useState<Consulta | null>(null);
  const [inventario, setInventario] = useState<InventarioMedicamento[]>([]);
  const [errorInventario, setErrorInventario] = useState<string | null>(null);

  const fetchPaciente = useCallback(async () => {
    try {
      const res = await authFetch(`/api/expedientes/${id}`);
      if (res.ok) {
        const data = (await res.json()) as Expediente;
        setPaciente(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const fetchConsultas = useCallback(async () => {
    try {
      const res = await authFetch(`/api/consultas?paciente_id=${id}`);
      if (res.ok) {
        const data = (await res.json()) as Consulta[];
        setConsultas(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    const cargarInventario = async () => {
      try {
        const respuesta = await api.get("/api/inventario/medicamentos");
        setInventario(respuesta.data as InventarioMedicamento[]);
      } catch (error) {
        console.error("Error al cargar el inventario:", error);
        setErrorInventario("No se pudo cargar la lista de medicamentos");
      }
    };

    void cargarInventario();
  }, []);

  useEffect(() => {
    if (id) {
      void fetchPaciente();
      void fetchConsultas();
    }
  }, [id, fetchConsultas, fetchPaciente]);

  const carnetVisible = paciente?.carnet_uni || paciente?.codigo_empleado || "—";
  const totalConsultas = consultas.length;

  const enviarNuevaConsulta = async (datos: ConsultaPayload) => {
    try {
      const response = await authFetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: id,
          motivo: datos.motivo,
          sintomas: datos.sintomas,
          diagnostico: datos.diagnostico,
          medicamentos: Array.isArray(datos.medicamentos) ? datos.medicamentos.join("\n") : datos.medicamentos,
          notas_recom: datos.notas_recom,
          prioridad: datos.prioridad,
        }),
      });

      if (response.ok) {
        notify({ tone: "success", title: "Consulta agregada" });
        setMostrarFormulario(false);
        await fetchConsultas();
      } else {
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        notify({ tone: "error", title: "No se pudo guardar", message: "Revisa los datos e intenta nuevamente." });
      }
    } catch (err) {
      console.error("Error al enviar:", err);
      notify({ tone: "error", title: "Error de conexión" });
    }
  };

  const guardarEdicionConsulta = async (consultaId: string, datos: ConsultaPayload) => {
    try {
      const response = await authFetch(`/api/consultas/${consultaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: datos.motivo,
          sintomas: datos.sintomas,
          diagnostico: datos.diagnostico,
          medicamentos: typeof datos.medicamentos === "string" ? datos.medicamentos : (datos.medicamentos || []).join("\n"),
          notas_recom: datos.notas_recom,
          prioridad: datos.prioridad,
        }),
      });

      if (response.ok) {
        setEditandoConsulta(null);
        await fetchConsultas();
        notify({ tone: "success", title: "Consulta actualizada" });
      } else {
        const err = await response.json().catch(() => ({}));
        notify({ tone: "error", title: "No se pudo actualizar", message: err.error || "Error desconocido" });
      }
    } catch (err) {
      console.error(err);
      notify({ tone: "error", title: "Error de conexión" });
    }
  };

  const eliminarConsulta = async (consultaId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta consulta?")) return;
    try {
      const res = await authFetch(`/api/consultas/${consultaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        notify({ tone: "success", title: "Consulta eliminada" });
        await fetchConsultas();
      } else {
        notify({ tone: "error", title: "No se pudo eliminar" });
      }
    } catch (err) {
      console.error(err);
      notify({ tone: "error", title: "Error de conexión" });
    }
  };

  const imprimirInforme = () => {
    const filas = consultas
      .map(
        (c) => `
      <tr>
        <td>${formatPrintDate(c.creado_en)}</td>
        <td>${(c.motivo || "—").replace(/</g, "&lt;")}</td>
        <td>${(c.sintomas || "—").replace(/</g, "&lt;")}</td>
        <td>${(c.diagnostico || "—").replace(/</g, "&lt;")}</td>
        <td>${(c.medicamentos || "—").replace(/\n/g, ", ").replace(/</g, "&lt;")}</td>
        <td>${(c.notas_recom || "—").replace(/</g, "&lt;")}</td>
        <td>${(c.prioridad || "").replace(/</g, "&lt;")}</td>
      </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Informe - ${(paciente?.nombre || "")} ${(paciente?.apellido || "")}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background: linear-gradient(180deg, #f8f7ff 0%, #ffffff 100%);
    }
    .sheet {
      padding: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      border-radius: 18px;
      color: white;
      background: linear-gradient(90deg, #23102f 0%, #34164c 55%, #4c1d72 100%);
    }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
    .pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.15);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .section {
      margin-top: 18px;
      padding: 18px;
      background: #fff;
      border: 1px solid #e9ddff;
      border-radius: 18px;
      box-shadow: 0 16px 40px -32px rgba(76,29,149,0.35);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 22px;
      margin-top: 12px;
    }
    .field { font-size: 13px; line-height: 1.45; }
    .field strong { color: #111827; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }
    th {
      background: #f5f3ff;
      color: #4c1d72;
      font-weight: 700;
    }
    tbody tr:nth-child(even) td { background: #fafafa; }
    .meta {
      margin-top: 10px;
      font-size: 11px;
      color: #6b7280;
    }
    @media print {
      .sheet { padding: 0; }
      .section { box-shadow: none; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <span class="pill">Informe clínico</span>
        <h1>Historial de consultas</h1>
        <p>${(paciente?.nombre || "").replace(/</g, "&lt;")} ${(paciente?.apellido || "").replace(/</g, "&lt;")}</p>
      </div>
      <div style="text-align:right">
        <div class="pill">${consultas.length} consultas</div>
        <p>${new Date().toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short", hour12: true })}</p>
      </div>
    </div>

    <div class="section">
      <h2 style="margin:0;font-size:16px;">Datos del paciente</h2>
      <div class="grid">
        <div class="field"><strong>Tipo:</strong> ${(paciente?.tipo_paciente || "—").replace(/</g, "&lt;")}</div>
        <div class="field"><strong>Carnet:</strong> ${(carnetVisible || "—").replace(/</g, "&lt;")}</div>
        <div class="field"><strong>Código empleado:</strong> ${(paciente?.codigo_empleado || "—").replace(/</g, "&lt;")}</div>
        <div class="field"><strong>Email:</strong> ${(paciente?.email || "—").replace(/</g, "&lt;")}</div>
        <div class="field"><strong>Teléfono:</strong> ${(paciente?.telefono || "—").replace(/</g, "&lt;")}</div>
        <div class="field"><strong>Carrera/Departamento:</strong> ${(paciente?.carrera_depto || "—").replace(/</g, "&lt;")}</div>
      </div>
    </div>

    <div class="section">
      <h2 style="margin:0;font-size:16px;">Historial de consultas</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Motivo</th>
            <th>Síntomas</th>
            <th>Diagnóstico</th>
            <th>Medicamentos</th>
            <th>Notas</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>${filas || '<tr><td colspan="7">Sin consultas registradas.</td></tr>'}</tbody>
      </table>
      <div class="meta">Generado el ${new Date().toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short", hour12: true })}.</div>
    </div>
  </div>
</body>
</html>`;

    const ventana = window.open("", "_blank");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      ventana.onload = () => ventana.print();
    } else {
      notify({ tone: "error", title: "Permite ventanas emergentes para imprimir." });
    }
  };

  if (!paciente) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] bg-white p-8 shadow-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_35%),linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] border border-violet-100 bg-white shadow-[0_24px_60px_-40px_rgba(76,29,149,0.35)]">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#23102f] via-[#34164c] to-[#4c1d72] px-6 py-6 text-white lg:flex-row lg:items-center lg:justify-between xl:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-200">Historial clínico</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="mt-3 text-sm leading-6 text-violet-100">
                Consulta y seguimiento con la misma estética operativa del sistema.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setMostrarFormulario((value) => !value)}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {mostrarFormulario ? "Cancelar" : "+ Agregar nueva historia"}
              </button>
              <button
                onClick={imprimirInforme}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Generar e imprimir informe
              </button>
              <button
                onClick={() => nav("/expedientes")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Volver a Expedientes
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-3 xl:px-8">
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500">Tipo</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{paciente.tipo_paciente}</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500">Carnet</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{carnetVisible}</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500">Consultas</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{totalConsultas}</p>
            </div>
          </div>
        </section>

        {mostrarFormulario && (
          <div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(76,29,149,0.25)]">
            <h3 className="text-xl font-semibold text-gray-900">Agregar nueva historia</h3>
            <form
              className="mt-6 grid gap-5 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const datos = {
                  motivo: formData.get("motivo") as string,
                  sintomas: formData.get("sintomas") as string,
                  diagnostico: formData.get("diagnostico") as string,
                  medicamentos: (formData.get("medicamentos") as string).split("\n").filter(Boolean),
                  notas_recom: formData.get("notas_recom") as string,
                  prioridad: formData.get("prioridad") as string,
                };
                await enviarNuevaConsulta(datos);
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Motivo</span>
                <input name="motivo" required className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Síntomas</span>
                <textarea name="sintomas" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Diagnóstico</span>
                <textarea name="diagnostico" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Medicamentos</span>
                <select
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor) {
                      const [nombre] = valor.split("|");
                      const textarea = document.querySelector('textarea[name="medicamentos"]') as HTMLTextAreaElement | null;
                      if (textarea) {
                        const valorActual = textarea.value.trim();
                        textarea.value = valorActual ? `${valorActual}\n${nombre}` : nombre;
                      }
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">— Seleccionar medicamento —</option>
                  {inventario
                    .filter((item) => item.cantidad_disponible > 0)
                    .map((item) => (
                      <option key={item.id} value={`${item.nombre}|${item.id}`}>
                        {item.nombre} ({item.cantidad_disponible} disponibles)
                      </option>
                    ))}
                </select>
                <textarea
                  name="medicamentos"
                  className="mt-3 h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Los medicamentos seleccionados aparecerán aquí (una por línea)"
                />
                {errorInventario && <p className="mt-2 text-sm text-red-500">{errorInventario}</p>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Notas y recomendaciones</span>
                <textarea name="notas_recom" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Prioridad</span>
                <select name="prioridad" required className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                  <option value="">Seleccione</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button type="submit" className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {consultas.length > 0 && (
          <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_22px_50px_-40px_rgba(76,29,149,0.35)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-violet-50/80">
                  <tr className="border-b border-violet-100 text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Motivo</th>
                    <th className="px-6 py-4 font-semibold">Síntomas</th>
                    <th className="px-6 py-4 font-semibold">Diagnóstico</th>
                    <th className="px-6 py-4 font-semibold">Medicamentos</th>
                    <th className="px-6 py-4 font-semibold">Notas</th>
                    <th className="px-6 py-4 font-semibold">Prioridad</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {consultas.map((consulta) => (
                    <tr key={consulta.id} className="border-b border-gray-100 align-top hover:bg-violet-50/40">
                      <td className="px-6 py-4 text-sm text-gray-700">{formatTime(consulta.creado_en)}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{consulta.motivo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{consulta.sintomas || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{consulta.diagnostico || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{consulta.medicamentos || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{consulta.notas_recom || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          consulta.prioridad?.toLowerCase() === "critica"
                            ? "bg-red-100 text-red-700"
                            : consulta.prioridad?.toLowerCase() === "alta"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {consulta.prioridad}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditandoConsulta(consulta)}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void eliminarConsulta(consulta.id)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
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

        {editandoConsulta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900">Editar consulta</h3>
              <form
                className="mt-6 grid gap-5 md:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await guardarEdicionConsulta(editandoConsulta.id, {
                    motivo: formData.get("motivo") as string,
                    sintomas: formData.get("sintomas") as string,
                    diagnostico: formData.get("diagnostico") as string,
                    medicamentos: (formData.get("medicamentos") as string) || "",
                    notas_recom: formData.get("notas_recom") as string,
                    prioridad: formData.get("prioridad") as string,
                  });
                }}
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Motivo</span>
                  <input defaultValue={editandoConsulta.motivo} name="motivo" required className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Síntomas</span>
                  <textarea defaultValue={editandoConsulta.sintomas || ""} name="sintomas" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Diagnóstico</span>
                  <textarea defaultValue={editandoConsulta.diagnostico || ""} name="diagnostico" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Medicamentos</span>
                  <textarea defaultValue={editandoConsulta.medicamentos || ""} name="medicamentos" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Notas y recomendaciones</span>
                  <textarea defaultValue={editandoConsulta.notas_recom || ""} name="notas_recom" className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Prioridad</span>
                  <select defaultValue={editandoConsulta.prioridad} name="prioridad" required className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">
                    Guardar cambios
                  </button>
                  <button type="button" onClick={() => setEditandoConsulta(null)} className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
