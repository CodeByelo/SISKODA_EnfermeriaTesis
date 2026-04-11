// src/pages/inventario/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Insumo } from './types';
import { authFetch } from '../../lib/auth';

export default function Inventario() {
  const nav = useNavigate();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInsumos = async () => {
    try {
      const res = await authFetch('/api/inventario');
      const data = await res.json();
      setInsumos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const estadoStock = (insumo: Insumo) => {
    const hoy = new Date();
    const vencimiento = insumo.fecha_vencimiento ? new Date(insumo.fecha_vencimiento) : null;

    if (vencimiento && vencimiento < hoy) return 'Vencido';
    if (insumo.stock_actual < insumo.stock_minimo) return 'Bajo stock';
    return 'Normal';
  };

  const colorEstado = (estado: string) => {
    if (estado === 'Vencido') return 'text-red-600 font-bold';
    if (estado === 'Bajo stock') return 'text-yellow-600 font-bold';
    return 'text-green-600';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este insumo?')) return;

    try {
      const res = await authFetch(`/api/inventario/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInsumos(insumos.filter(i => i.id !== id));
        alert('✅ Insumo eliminado');
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.error || 'No se pudo eliminar'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando inventario...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <div className="flex gap-3">
            <button
              onClick={() => nav('/inventario/nuevo')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Nuevo insumo
            </button>
            <button
              onClick={() => nav('/inventario/entrada')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              + Entrada
            </button>
            <button
              onClick={() => nav('/inventario/salida')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              - Salida
            </button>
            <button
              onClick={fetchInsumos}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Actualizar
            </button>
            <button
              onClick={() => nav("/dashboard")}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Volver al Inicio
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o lote..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nombre</th>
                <th className="py-2">Categoría</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Mínimo</th>
                <th className="py-2">Vencimiento</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No hay insumos registrados.
                  </td>
                </tr>
              ) : (
                insumos
                  .filter(item =>
                    (item.nombre.toLowerCase().includes(filtro.toLowerCase())) ||
                    (item.categoria?.toLowerCase().includes(filtro.toLowerCase())) ||
                    (item.lote?.toLowerCase().includes(filtro.toLowerCase()))
                  )
                  .map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{item.nombre}</td>
                      <td className="py-2">{item.categoria || '—'}</td>
                      <td className="py-2">{item.stock_actual} {item.unidad_medida}</td>
                      <td className="py-2">{item.stock_minimo}</td>
                      <td className="py-2">
                        {item.fecha_vencimiento
                          ? new Date(item.fecha_vencimiento).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className={`py-2 ${colorEstado(estadoStock(item))}`}>
                        {estadoStock(item)}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={item.stock_actual > 0}
                          className={`text-sm px-3 py-1 rounded ${
                            item.stock_actual > 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          Eliminar
                        </button>
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
