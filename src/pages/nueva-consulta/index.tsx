// src/pages/nueva-consulta/index.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { authFetch } from "../../lib/auth";
import type { ConsultaForm } from "./types";

const pasoInicial = 1;
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
  prioridad: "Normal"
};

export default function NuevaConsulta() {
  const nav = useNavigate();
  const { paciente_id } = useParams<{ paciente_id?: string }>();
  const [paso, setPaso] = useState(pasoInicial);
  const [form, setForm] = useState<ConsultaForm>(formVacio);

  useEffect(() => {
    if (paciente_id) {
      authFetch(`/api/expedientes/${paciente_id}`)
        .then(res => res.json())
        .then(data => {
          setForm({
            ...formVacio,
            tipo_paciente: data.tipo_paciente,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email || '',
            telefono: data.telefono || '',
            carnet_uni: data.carnet_uni || '',
            carrera: data.carrera_depto || '',
            codigo_empleado: data.codigo_empleado || '',
            departamento: data.carrera_depto || '',
            categoria: data.categoria || '',
            cargo: data.cargo || '',
          });
        });
    }
  }, [paciente_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const siguiente = () => paso < 4 && setPaso(p => p + 1);
  const anterior = () => paso > 1 && setPaso(p => p - 1);

  const checkIfPacienteExists = async (carnet: string, tipo: string) => {
    try {
      const res = await authFetch(`/api/expedientes/check?carnet=${encodeURIComponent(carnet)}&tipo=${encodeURIComponent(tipo)}`);
      const data = await res.json();
      return data.exists;
    } catch (err) {
      console.error("Error al verificar paciente:", err);
      return false;
    }
  };

  const enviar = async () => {
    if (!form.tipo_paciente) {
      alert("⚠️ Seleccione el tipo de paciente");
      return;
    }
    if (!form.nombre.trim() || !form.apellido.trim()) {
      alert("⚠️ Nombre y apellido son obligatorios");
      return;
    }
    if (!form.motivo.trim()) {
      alert("⚠️ El motivo de la consulta es obligatorio");
      return;
    }

    if (!paciente_id && form.carnet_uni) {
      const exists = await checkIfPacienteExists(form.carnet_uni, form.tipo_paciente);
      if (exists) {
        alert("⚠️ Este paciente ya está registrado. Puedes agregarle una nueva consulta desde su historial.");
        return;
      }
    }

    const payload = {
      ...form,
      medicamentos: form.medicamentos.join('\n'),
      paciente_id: paciente_id || undefined
    };

    try {
      await api.post("/api/consultas", payload);
      alert("✅ Consulta guardada");
      nav("/consultas-hoy");
    } catch (error: unknown) {
      console.error("Error al enviar:", error);
      alert("❌ Error al guardar. Revise la consola.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Nueva Consulta</h1>

        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${paso >= n ? "bg-blue-600" : "bg-gray-300"}`}>
              {n}
            </div>
          ))}
        </div>

        {paso === 1 && (
          <div className="grid gap-4">
            <select name="tipo_paciente" value={form.tipo_paciente} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id}>
              <option value="">Seleccione tipo</option>
              <option value="Estudiante">Estudiante</option>
              <option value="Profesor">Profesor</option>
              <option value="Personal Administrativo">Personal Administrativo</option>
            </select>
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
            <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
          </div>
        )}

        {paso === 2 && (
          <>
            {form.tipo_paciente === "Estudiante" && (
              <div className="grid gap-4">
                <input name="carnet_uni" value={form.carnet_uni} onChange={handleChange} placeholder="Carnet universitario" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
                <input name="carrera" value={form.carrera} onChange={handleChange} placeholder="Carrera" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
                <input name="semestre_anio" value={form.semestre_anio} onChange={handleChange} placeholder="Semestre/Año" className="w-full px-4 py-2 border rounded-lg" />
              </div>
            )}
            {(form.tipo_paciente === "Profesor" || form.tipo_paciente === "Personal Administrativo") && (
              <div className="grid gap-4">
                <input name="codigo_empleado" value={form.codigo_empleado} onChange={handleChange} placeholder="Código de empleado" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
                {form.tipo_paciente === "Profesor" && (
                  <>
                    <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Departamento" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
                    <select name="categoria" value={form.categoria} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id}>
                      <option value="">Categoría</option>
                      <option value="Auxiliar">Auxiliar</option>
                      <option value="Asociado">Asociado</option>
                      <option value="Titular">Titular</option>
                    </select>
                  </>
                )}
                {form.tipo_paciente === "Personal Administrativo" && (
                  <>
                    <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Cargo" className="w-full px-4 py-2 border rounded-lg" disabled={!!paciente_id} />
                    <input name="extension" value={form.extension} onChange={handleChange} placeholder="Extensión" className="w-full px-4 py-2 border rounded-lg" />
                  </>
                )}
              </div>
            )}
          </>
        )}

        {paso === 3 && (
          <div className="grid gap-4">
            <textarea name="motivo" value={form.motivo} onChange={handleChange} placeholder="Motivo de la consulta" className="w-full px-4 py-2 border rounded-lg h-24" />
            <textarea name="sintomas" value={form.sintomas} onChange={handleChange} placeholder="Síntomas" className="w-full px-4 py-2 border rounded-lg h-24" />
            <select name="prioridad" value={form.prioridad} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
              <option value="Normal">Normal</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        )}

        {paso === 4 && (
          <div className="grid gap-4">
            <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} placeholder="Diagnóstico" className="w-full px-4 py-2 border rounded-lg h-24" />
            <textarea name="notas_recom" value={form.notas_recom} onChange={handleChange} placeholder="Notas y recomendaciones" className="w-full px-4 py-2 border rounded-lg h-24" />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <div className="flex gap-3">
            <button onClick={() => nav("/dashboard")} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg">Volver al Inicio</button>
            <button onClick={anterior} disabled={paso === 1} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50">Anterior</button>
          </div>
          <button onClick={paso === 4 ? enviar : siguiente} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {paso === 4 ? "Registrar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
