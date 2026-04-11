// src/pages/inventario/entrada.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Insumo, MovimientoEntrada } from './types';
import { authFetch } from '../../lib/auth';

export default function EntradaInventario() {
  const nav = useNavigate();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<MovimientoEntrada>({
    insumo_id: 0,
    cantidad: 1,
    lote: '',
    fecha_vencimiento: '',
    notas: '',
  });

  const fetchInsumos = async () => {
    try {
      const res = await authFetch('/api/inventario');
      const data = await res.json();
      setInsumos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.insumo_id || form.cantidad <= 0) {
      alert('⚠️ Seleccione un insumo y cantidad válida');
      return;
    }

    try {
      const res = await authFetch('/api/inventario/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('✅ Entrada registrada');
        nav('/inventario');
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.error || 'No se pudo registrar'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión');
    }
  };

  if (loading) return <div className="p-6">Cargando insumos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Entrada</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Insumo *</label>
            <select
              name="insumo_id"
              value={form.insumo_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="0">Seleccione un insumo</option>
              {insumos.map(i => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.stock_actual} {i.unidad_medida})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Cantidad *</label>
            <input
              name="cantidad"
              type="number"
              min="1"
              value={form.cantidad}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Lote (opcional)</label>
            <input
              name="lote"
              value={form.lote}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Fecha de vencimiento (opcional)</label>
            <input
              name="fecha_vencimiento"
              type="date"
              value={form.fecha_vencimiento}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Notas (opcional)</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => nav('/inventario')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
