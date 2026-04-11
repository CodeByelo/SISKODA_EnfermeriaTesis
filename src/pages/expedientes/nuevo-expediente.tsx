import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExpedienteForm } from "./types";
import { authFetch } from "../../lib/auth";

const nullIfEmpty = (s: string) => (s.trim() === "" ? null : s.trim());

const formVacio: ExpedienteForm = {
  tipo_paciente: "",
  carnet_uni: "",
  codigo_empleado: "",
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  carrera_depto: "",
  categoria: "",
  cargo: "",
};

export default function NuevoExpediente() {
  const nav = useNavigate();
  const [form, setForm] = useState<ExpedienteForm>(formVacio);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (!form.tipo_paciente || !form.nombre.trim() || !form.apellido.trim()) {
      alert("Tipo, nombre y apellido son obligatorios");
      return;
    }

    const payload = {
      ...form,
      carnet_uni: nullIfEmpty(form.carnet_uni),
      codigo_empleado: nullIfEmpty(form.codigo_empleado),
      email: nullIfEmpty(form.email),
      telefono: nullIfEmpty(form.telefono),
      carrera_depto: nullIfEmpty(form.carrera_depto),
      categoria: nullIfEmpty(form.categoria),
      cargo: nullIfEmpty(form.cargo),
    };

    try {
      const res = await authFetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "No se pudo crear el expediente");
      }

      alert("Expediente creado");
      nav("/expedientes");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Expediente</h1>

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Tipo de paciente *</label>
          <select
            name="tipo_paciente"
            value={form.tipo_paciente}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Seleccione tipo</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Profesor">Profesor</option>
            <option value="Personal Administrativo">Personal Administrativo</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre *"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            placeholder="Apellido *"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Telefono"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {form.tipo_paciente === "Estudiante" && (
          <>
            <input
              name="carnet_uni"
              value={form.carnet_uni}
              onChange={handleChange}
              placeholder="Carnet universitario"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="carrera_depto"
              value={form.carrera_depto}
              onChange={handleChange}
              placeholder="Carrera"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </>
        )}

        {form.tipo_paciente === "Profesor" && (
          <>
            <input
              name="codigo_empleado"
              value={form.codigo_empleado}
              onChange={handleChange}
              placeholder="Codigo de empleado"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="carrera_depto"
              value={form.carrera_depto}
              onChange={handleChange}
              placeholder="Departamento"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Categoria</option>
              <option value="Auxiliar">Auxiliar</option>
              <option value="Asociado">Asociado</option>
              <option value="Titular">Titular</option>
            </select>
          </>
        )}

        {form.tipo_paciente === "Personal Administrativo" && (
          <>
            <input
              name="codigo_empleado"
              value={form.codigo_empleado}
              onChange={handleChange}
              placeholder="Codigo de empleado"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              placeholder="Cargo"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => nav("/expedientes")}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Guardar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}
