// src/pages/inventario/nuevo.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../lib/auth';

export default function NuevoInsumo() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    stock_minimo: 5,
    unidad_medida: 'unidades',
    lote: '',
    fecha_vencimiento: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('⚠️ El nombre del insumo es obligatorio');
      return;
    }

    try {
      const res = await authFetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          categoria: form.categoria.trim() || null,
          stock_minimo: Number(form.stock_minimo),
          unidad_medida: form.unidad_medida,
          lote: form.lote || null,
          fecha_vencimiento: form.fecha_vencimiento || null,
        }),
      });

      if (res.ok) {
        alert('✅ Insumo creado exitosamente');
        nav('/inventario');
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.error || 'No se pudo crear el insumo'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error de conexión al crear el insumo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Insumo</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: Paracetamol 500mg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Descripción (opcional)</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={2}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Categoría (opcional)</label>
            <input
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: Medicamento, Material, Equipo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-medium">Stock mínimo</label>
              <input
                name="stock_minimo"
                type="number"
                min="0"
                value={form.stock_minimo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Unidad</label>
              <select
                name="unidad_medida"
                value={form.unidad_medida}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="unidades">unidades</option>
                <option value="ml">ml</option>
                <option value="gr">gr</option>
                <option value="mg">mg</option>
                <option value="caja">caja</option>
                <option value="frasco">frasco</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Lote (opcional)</label>
              <input
                name="lote"
                value={form.lote}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Vencimiento (opcional)</label>
              <input
                name="fecha_vencimiento"
                type="date"
                value={form.fecha_vencimiento}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => nav('/inventario')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Crear Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
