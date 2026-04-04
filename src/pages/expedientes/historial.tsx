// src/pages/expedientes/historial.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';

export default function HistorialPaciente() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [paciente, setPaciente] = useState<any>(null);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoConsulta, setEditandoConsulta] = useState<any>(null);
  const [inventario, setInventario] = useState<any[]>([]);
  const [errorInventario, setErrorInventario] = useState<string | null>(null);

  const fetchPaciente = async () => {
    try {
      const res = await fetch(`${API_URL}/api/expedientes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPaciente(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConsultas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/consultas?paciente_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setConsultas(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Cargar inventario al montar el componente
  useEffect(() => {
    const cargarInventario = async () => {
      try {
        const respuesta = await axios.get(`${API_URL}/api/inventario/medicamentos`);
        setInventario(respuesta.data);
      } catch (error) {
        console.error('Error al cargar el inventario:', error);
        setErrorInventario('No se pudo cargar la lista de medicamentos');
      }
    };

    cargarInventario();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPaciente();
      fetchConsultas();
    }
  }, [id]);

  const enviarNuevaConsulta = async (datos: any) => {
    try {
      const response = await fetch(`${API_URL}/api/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: Number(id),
          motivo: datos.motivo,
          sintomas: datos.sintomas,
          diagnostico: datos.diagnostico,
          medicamentos: datos.medicamentos.join('\n'),
          notas_recom: datos.notas_recom,
          prioridad: datos.prioridad,
        }),
      });

      if (response.ok) {
        alert('✅ Nueva consulta agregada');
        setMostrarFormulario(false);
        await fetchConsultas();
      } else {
        const errorText = await response.text();
        console.error('Error del servidor:', errorText);
        alert('❌ Error al guardar la consulta');
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      alert('❌ Error de conexión');
    }
  };

  const guardarEdicionConsulta = async (consultaId: number, datos: any) => {
    try {
      const response = await fetch(`${API_URL}/api/consultas/${consultaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: datos.motivo,
          sintomas: datos.sintomas,
          diagnostico: datos.diagnostico,
          medicamentos: typeof datos.medicamentos === 'string' ? datos.medicamentos : (datos.medicamentos || []).join('\n'),
          notas_recom: datos.notas_recom,
          prioridad: datos.prioridad,
        }),
      });
      if (response.ok) {
        setEditandoConsulta(null);
        await fetchConsultas();
        alert('✅ Consulta actualizada');
      } else {
        const err = await response.json().catch(() => ({}));
        alert('❌ ' + (err.error || 'Error al actualizar'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  const eliminarConsulta = async (consultaId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta consulta?')) return;

    try {
      const res = await fetch(`${API_URL}/api/consultas/${consultaId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('✅ Consulta eliminada');
        await fetchConsultas();
      } else {
        alert('❌ Error al eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  const imprimirInforme = () => {
    const filas = consultas
      .map(
        (c) => `
      <tr>
        <td>${new Date(c.creado_en).toLocaleString()}</td>
        <td>${(c.motivo || '').replace(/</g, '&lt;')}</td>
        <td>${(c.sintomas || '—').replace(/</g, '&lt;')}</td>
        <td>${(c.diagnostico || '—').replace(/</g, '&lt;')}</td>
        <td>${(c.medicamentos || '—').replace(/\n/g, ', ').replace(/</g, '&lt;')}</td>
        <td>${(c.notas_recom || '—').replace(/</g, '&lt;')}</td>
        <td>${(c.prioridad || '').replace(/</g, '&lt;')}</td>
      </tr>`
      )
      .join('');
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Informe - ${(paciente?.nombre || '')} ${(paciente?.apellido || '')}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1f2937; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    .datos { margin-bottom: 24px; }
    .datos p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Informe de historial clínico</h1>
  <div class="datos">
    <p><strong>Paciente:</strong> ${(paciente?.nombre || '').replace(/</g, '&lt;')} ${(paciente?.apellido || '').replace(/</g, '&lt;')}</p>
    <p><strong>Tipo:</strong> ${(paciente?.tipo_paciente || '—').replace(/</g, '&lt;')}</p>
    <p><strong>Carnet:</strong> ${(paciente?.carnet_uni || '—').replace(/</g, '&lt;')}</p>
    <p><strong>Código empleado:</strong> ${(paciente?.codigo_empleado || '—').replace(/</g, '&lt;')}</p>
    <p><strong>Email:</strong> ${(paciente?.email || '—').replace(/</g, '&lt;')}</p>
    <p><strong>Teléfono:</strong> ${(paciente?.telefono || '—').replace(/</g, '&lt;')}</p>
    <p><strong>Carrera/Departamento:</strong> ${(paciente?.carrera_depto || '—').replace(/</g, '&lt;')}</p>
  </div>
  <h2>Historial de consultas</h2>
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
  <p style="margin-top: 24px; font-size: 0.875rem; color: #6b7280;">Generado el ${new Date().toLocaleString()}.</p>
</body>
</html>`;
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      ventana.onload = () => ventana.print();
    } else {
      alert('Permite ventanas emergentes para poder imprimir el informe.');
    }
  };

  if (!paciente) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Historial de {paciente.nombre} {paciente.apellido}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {mostrarFormulario ? 'Cancelar' : '+ Agregar nueva historia'}
            </button>
            <button
              onClick={imprimirInforme}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Generar e imprimir informe
            </button>
            <button
              onClick={() => nav('/expedientes')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Volver a Expedientes
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Datos del Paciente</h2>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Tipo:</strong> {paciente.tipo_paciente}</p>
            <p><strong>Carnet:</strong> {paciente.carnet_uni || '—'}</p>
            <p><strong>Código Empleado:</strong> {paciente.codigo_empleado || '—'}</p>
            <p><strong>Email:</strong> {paciente.email || '—'}</p>
            <p><strong>Teléfono:</strong> {paciente.telefono || '—'}</p>
            <p><strong>Carrera/Departamento:</strong> {paciente.carrera_depto || '—'}</p>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Agregar nueva historia</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const datos = {
                  motivo: formData.get('motivo') as string,
                  sintomas: formData.get('sintomas') as string,
                  diagnostico: formData.get('diagnostico') as string,
                  medicamentos: (formData.get('medicamentos') as string).split('\n').filter(Boolean),
                  notas_recom: formData.get('notas_recom') as string,
                  prioridad: formData.get('prioridad') as string,
                };
                await enviarNuevaConsulta(datos);
              }}
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2">Motivo</label>
                  <input name="motivo" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block mb-2">Síntomas</label>
                  <textarea name="sintomas" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                </div>
                <div>
                  <label className="block mb-2">Diagnóstico</label>
                  <textarea name="diagnostico" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                </div>
                <div>
                  <label className="block mb-2">Medicamentos (selecciona del inventario)</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg"
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor) {
                        const [nombre] = valor.split('|');
                        const textarea = document.querySelector('textarea[name="medicamentos"]') as HTMLTextAreaElement;
                        if (textarea) {
                          const valorActual = textarea.value.trim();
                          const nuevoValor = valorActual
                            ? valorActual + '\n' + nombre
                            : nombre;
                          textarea.value = nuevoValor;
                        }
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">— Seleccionar medicamento —</option>
                    {inventario
                      .filter((item: any) => item.cantidad_disponible > 0)
                      .map((item: any) => (
                        <option key={item.id} value={`${item.nombre}|${item.id}`}>
                          {item.nombre} ({item.cantidad_disponible} disponibles)
                        </option>
                      ))}
                  </select>
                  <textarea
                    name="medicamentos"
                    className="w-full px-4 py-2 border rounded-lg mt-2 h-24"
                    placeholder="Los medicamentos seleccionados aparecerán aquí (una por línea)"
                  ></textarea>
                  {errorInventario && (
                    <p className="text-red-500 text-sm mt-1">{errorInventario}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Notas y recomendaciones</label>
                  <textarea name="notas_recom" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                </div>
                <div>
                  <label className="block mb-2">Prioridad</label>
                  <select name="prioridad" required className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Seleccione</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {editandoConsulta && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold mb-4">Editar consulta</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await guardarEdicionConsulta(editandoConsulta.id, {
                    motivo: formData.get('motivo') as string,
                    sintomas: formData.get('sintomas') as string,
                    diagnostico: formData.get('diagnostico') as string,
                    medicamentos: (formData.get('medicamentos') as string) || '',
                    notas_recom: formData.get('notas_recom') as string,
                    prioridad: formData.get('prioridad') as string,
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2">Motivo</label>
                    <input name="motivo" required defaultValue={editandoConsulta.motivo} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block mb-2">Síntomas</label>
                    <textarea name="sintomas" defaultValue={editandoConsulta.sintomas || ''} className="w-full px-4 py-2 border rounded-lg h-24" />
                  </div>
                  <div>
                    <label className="block mb-2">Diagnóstico</label>
                    <textarea name="diagnostico" defaultValue={editandoConsulta.diagnostico || ''} className="w-full px-4 py-2 border rounded-lg h-24" />
                  </div>
                  <div>
                    <label className="block mb-2">Medicamentos (uno por línea)</label>
                    <textarea name="medicamentos" className="w-full px-4 py-2 border rounded-lg h-24" defaultValue={editandoConsulta.medicamentos || ''} />
                  </div>
                  <div>
                    <label className="block mb-2">Notas y recomendaciones</label>
                    <textarea name="notas_recom" defaultValue={editandoConsulta.notas_recom || ''} className="w-full px-4 py-2 border rounded-lg h-24" />
                  </div>
                  <div>
                    <label className="block mb-2">Prioridad</label>
                    <select name="prioridad" required defaultValue={editandoConsulta.prioridad} className="w-full px-4 py-2 border rounded-lg">
                      <option value="Normal">Normal</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Guardar cambios</button>
                  <button type="button" onClick={() => setEditandoConsulta(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Fecha</th>
                <th className="py-2">Motivo</th>
                <th className="py-2">Síntomas</th>
                <th className="py-2">Diagnóstico</th>
                <th className="py-2">Medicamentos</th>
                <th className="py-2">Notas</th>
                <th className="py-2">Prioridad</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consultas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-gray-500">
                    No hay consultas registradas.
                  </td>
                </tr>
              ) : (
                consultas.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(c.creado_en).toLocaleString()}</td>
                    <td className="py-2">{c.motivo}</td>
                    <td className="py-2">{c.sintomas || '—'}</td>
                    <td className="py-2">{c.diagnostico || '—'}</td>
                    <td className="py-2">{c.medicamentos?.split('\n').join(', ') || '—'}</td>
                    <td className="py-2">{c.notas_recom || '—'}</td>
                    <td
                      className={`py-2 ${
                        c.prioridad === 'Urgente' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {c.prioridad}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditandoConsulta(c)}
                          className="text-sm px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarConsulta(c.id)}
                          className="text-sm px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
