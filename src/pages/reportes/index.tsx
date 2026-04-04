// src/pages/reportes/index.tsx
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
import { buildApiUrl } from '../../config/api';

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
  const [prioridadData, setPrioridadData] = useState<any[]>([]);
  const [tendenciaData, setTendenciaData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [prioridad, tendencia, stock] = await Promise.all([
        fetch(buildApiUrl('/api/reportes/consultas-por-prioridad')).then(r => r.json()),
        fetch(buildApiUrl('/api/reportes/consultas-por-dia')).then(r => r.json()),
        fetch(buildApiUrl('/api/reportes/stock-por-insumo')).then(r => r.json()),
      ]);
      setPrioridadData(prioridad);
      setTendenciaData(tendencia);
      setStockData(stock);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gráfico de barras: consultas por prioridad
  const barData = {
    labels: prioridadData.map((d: any) => d.prioridad),
    datasets: [
      {
        label: 'Consultas',
        data: prioridadData.map((d: any) => d.cantidad),
        backgroundColor: ['rgba(239, 68, 68, 0.6)', 'rgba(59, 130, 246, 0.6)'],
      },
    ],
  };

  // Gráfico de pastel: stock actual
  const pieData = {
    labels: stockData.map((d: any) => d.nombre),
    datasets: [
      {
        data: stockData.map((d: any) => d.stock_actual),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#EC4899', '#06B6D4', '#F97316', '#6B7280', '#84CC16'
        ],
      },
    ],
  };

  // Gráfico de líneas: tendencia diaria
  const lineData = {
    labels: tendenciaData.map((d: any) => d.fecha),
    datasets: [
      {
        label: 'Consultas por día',
        data: tendenciaData.map((d: any) => d.total),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // ✅ Llama al backend para descargar el Excel REAL
  const exportToExcel = () => {
    window.open(buildApiUrl('/api/reportes/excel'), "_blank");
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
              📊 Exportar a Excel
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
          {/* Gráfico de barras */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Consultas por Prioridad</h2>
            {prioridadData.length > 0 ? (
              <Bar data={barData} options={{ responsive: true }} />
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>

          {/* Gráfico de pastel: STOCK ACTUAL */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Stock Actual por Insumo</h2>
            {stockData.length > 0 ? (
              <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
            ) : (
              <p className="text-gray-500">Sin stock registrado</p>
            )}
          </div>
        </div>

        {/* Gráfico de tendencia */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Tendencia de Consultas (Últimos 14 días)</h2>
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
