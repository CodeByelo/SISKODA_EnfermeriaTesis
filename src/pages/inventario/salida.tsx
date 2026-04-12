import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import type { Insumo, MovimientoSalida } from './types';
import { authFetch } from '../../lib/auth';
import { useNotifications } from '../../contexts/notification-context';

export default function SalidaInventario() {
  const nav = useNavigate();
  const { notify } = useNotifications();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<MovimientoSalida>({
    insumo_id: 0,
    cantidad: 1,
    motivo: 'Uso en consulta',
    notas: '',
  });

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const res = await authFetch('/api/inventario');
        const data = await res.json();
        setInsumos((Array.isArray(data) ? data : []).filter((i) => i.stock_actual > 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchInsumos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.insumo_id || form.cantidad <= 0) {
      notify({ tone: 'info', title: 'Selecciona un insumo y una cantidad valida' });
      return;
    }

    const insumo = insumos.find((i) => i.id === Number(form.insumo_id));
    if (insumo && form.cantidad > insumo.stock_actual) {
      notify({ tone: 'info', title: 'Stock insuficiente', message: `Maximo disponible: ${insumo.stock_actual}` });
      return;
    }

    try {
      const res = await authFetch('/api/inventario/salida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notify({ tone: 'success', title: 'Salida registrada' });
        nav('/inventario');
      } else {
        const err = await res.json();
        notify({ tone: 'error', title: 'No se pudo registrar', message: err.error || 'Revisa los datos de la salida.' });
      }
    } catch (err) {
      console.error(err);
      notify({ tone: 'error', title: 'Error de conexion' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-white p-8 shadow-lg">Cargando insumos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_36%),linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1d1029] via-[#2e1742] to-[#4f2671] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">Inventario</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Registrar salida</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Registra consumos con una interfaz coherente con todo el sistema.
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <ArrowTrendingDownIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Movimiento</p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-900">Salida de insumo</h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Insumo *</label>
                <select
                  name="insumo_id"
                  value={form.insumo_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  required
                >
                  <option value="0">Seleccione un insumo</option>
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.stock_actual} {i.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Cantidad *</label>
                <input
                  name="cantidad"
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Motivo *</label>
                <select
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  required
                >
                  <option value="Uso en consulta">Uso en consulta</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Pérdida">Pérdida</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Notas (opcional)</label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  rows={3}
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
                className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-700"
              >
                Registrar salida
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
