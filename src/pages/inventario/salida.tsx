import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        setInsumos((Array.isArray(data) ? data : []).filter(i => i.stock_actual > 0));
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.insumo_id || form.cantidad <= 0) {
      notify({ tone: 'info', title: 'Selecciona un insumo y una cantidad valida' });
      return;
    }

    const insumo = insumos.find(i => i.id === Number(form.insumo_id));
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

  if (loading) return <div className="p-6">Cargando insumos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Salida</h1>

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
            <label className="block mb-2 font-medium">Motivo *</label>
            <select
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="Uso en consulta">Uso en consulta</option>
              <option value="Vencido">Vencido</option>
              <option value="PÃ©rdida">PÃ©rdida</option>
              <option value="Otro">Otro</option>
            </select>
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Registrar Salida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
