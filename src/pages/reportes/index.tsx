import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { API_URL } from '../../config/api';
import { authFetch, buildAuthHeaders } from '../../lib/auth';

type PrioridadItem = {
  prioridad: string;
  cantidad: number;
};

type TendenciaItem = {
  fecha: string;
  total: number;
};

type StockItem = {
  nombre: string;
  stock_actual: number;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

export default function Reportes() {
  const nav = useNavigate();
  const [prioridadData, setPrioridadData] = useState<PrioridadItem[]>([]);
  const [tendenciaData, setTendenciaData] = useState<TendenciaItem[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prioridad, tendencia, stock] = await Promise.all([
          authFetch('/api/reportes/consultas-por-prioridad').then(r => r.json() as Promise<PrioridadItem[]>),
          authFetch('/api/reportes/consultas-por-dia').then(r => r.json() as Promise<TendenciaItem[]>),
          authFetch('/api/reportes/stock-por-insumo').then(r => r.json() as Promise<StockItem[]>),
        ]);
        setPrioridadData(prioridad);
        setTendenciaData(tendencia);
        setStockData(stock);
      } catch (err) {
        console.error(err);
      }
    };

    void fetchData();
  }, []);

  const barData = {
    labels: prioridadData.map((d) => d.prioridad),
    datasets: [
      {
        label: 'Consultas',
        data: prioridadData.map((d) => d.cantidad),
        backgroundColor: ['rgba(239, 68, 68, 0.6)', 'rgba(59, 130, 246, 0.6)'],
      },
    ],
  };

  const pieData = {
    labels: stockData.map((d) => d.nombre),
    datasets: [
      {
        data: stockData.map((d) => d.stock_actual),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#EC4899', '#06B6D4', '#F97316', '#6B7280', '#84CC16'
        ],
      },
    ],
  };

  const lineData = {
    labels: tendenciaData.map((d) => d.fecha),
    datasets: [
      {
        label: 'Consultas por dia',
        data: tendenciaData.map((d) => d.total),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reportes/excel`, {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        alert('No se pudo exportar el reporte');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Reporte_Enfermeria.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('No se pudo exportar el reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Exportar a Excel
            </button>
            <button
              onClick={() => nav('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Volver al Inicio
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Consultas por Prioridad</h2>
            {prioridadData.length > 0 ? (
              <Bar data={barData} options={{ responsive: true }} />
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Stock Actual por Insumo</h2>
            {stockData.length > 0 ? (
              <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'right' as const } } }} />
            ) : (
              <p className="text-gray-500">Sin stock registrado</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Tendencia de Consultas (Ultimos 14 dias)</h2>
          {tendenciaData.length > 0 ? (
            <Line data={lineData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <p className="text-gray-500">Sin datos</p>
          )}
        </div>
      </div>
    </div>
  );
}
