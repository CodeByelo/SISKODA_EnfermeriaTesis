import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../../lib/auth';
import { useNotifications } from '../../contexts/notification-context';

export default function NuevoInsumo() {
  const nav = useNavigate();
  const { notify } = useNotifications();
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
      notify({ tone: 'info', title: 'El nombre del insumo es obligatorio' });
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
        notify({ tone: 'success', title: 'Insumo creado exitosamente' });
        nav('/inventario');
      } else {
        const err = await res.json();
        notify({ tone: 'error', title: 'No se pudo crear el insumo', message: err.error || 'Revisa los datos ingresados.' });
      }
    } catch (err) {
      console.error(err);
      notify({ tone: 'error', title: 'Error de conexion al crear el insumo' });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_36%),linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1d1029] via-[#2e1742] to-[#4f2671] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">Inventario</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Nuevo insumo</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Crea un insumo con la misma lectura visual operativa del resto del sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => nav('/inventario')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <ArrowLongLeftIcon className="h-5 w-5" />
              Volver al inventario
            </button>
          </div>
        </section>

        <section className="rounded-[28px] bg-white shadow-[0_24px_60px_-36px_rgba(76,29,149,0.25)]">
          <div className="border-b border-violet-100 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <ArchiveBoxIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">Alta de stock</p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-900">Registro de insumo</h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nombre *</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Ej: Paracetamol 500mg"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Descripcion (opcional)</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Categoria (opcional)</label>
                <input
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Ej: Medicamento, Material, Equipo"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Stock minimo</label>
                <input
                  name="stock_minimo"
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Unidad</label>
                <select
                  name="unidad_medida"
                  value={form.unidad_medida}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="unidades">unidades</option>
                  <option value="ml">ml</option>
                  <option value="gr">gr</option>
                  <option value="mg">mg</option>
                  <option value="caja">caja</option>
                  <option value="frasco">frasco</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Lote (opcional)</label>
                <input
                  name="lote"
                  value={form.lote}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Vencimiento (opcional)</label>
                <input
                  name="fecha_vencimiento"
                  type="date"
                  value={form.fecha_vencimiento}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => nav('/inventario')}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-800"
              >
                Crear insumo
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
