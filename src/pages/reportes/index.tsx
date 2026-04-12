import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
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
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { API_URL } from "../../config/api";
import { authFetch, buildAuthHeaders } from "../../lib/auth";
import { useNotifications } from "../../contexts/notification-context";

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
  const { notify } = useNotifications();
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [exporting, setExporting] = useState(false);
  const [prioridadData, setPrioridadData] = useState<PrioridadItem[]>([]);
  const [tendenciaData, setTendenciaData] = useState<TendenciaItem[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [prioridad, tendencia, stock] = await Promise.all([
          authFetch("/api/reportes/consultas-por-prioridad").then(
            (response) => response.json() as Promise<PrioridadItem[]>
          ),
          authFetch("/api/reportes/consultas-por-dia").then(
            (response) => response.json() as Promise<TendenciaItem[]>
          ),
          authFetch("/api/reportes/stock-por-insumo").then(
            (response) => response.json() as Promise<StockItem[]>
          ),
        ]);
        setPrioridadData(prioridad);
        setTendenciaData(tendencia);
        setStockData(stock);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const barData = {
    labels: prioridadData.map((item) => item.prioridad),
    datasets: [
      {
        label: "Consultas",
        data: prioridadData.map((item) => item.cantidad),
        backgroundColor: ["rgba(124, 58, 237, 0.7)", "rgba(236, 72, 153, 0.7)"],
        borderRadius: 12,
      },
    ],
  };

  const pieData = {
    labels: stockData.map((item) => item.nombre),
    datasets: [
      {
        data: stockData.map((item) => item.stock_actual),
        backgroundColor: [
          "#4F46E5",
          "#EC4899",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
          "#06B6D4",
          "#F97316",
          "#84CC16",
          "#EF4444",
          "#6B7280",
        ],
      },
    ],
  };

  const lineData = {
    labels: tendenciaData.map((item) => item.fecha),
    datasets: [
      {
        label: "Consultas por dia",
        data: tendenciaData.map((item) => item.total),
        borderColor: "#7C3AED",
        backgroundColor: "rgba(124, 58, 237, 0.12)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const resumen = useMemo(
    () => [
      {
        etiqueta: "Prioridades",
        valor: prioridadData.reduce((total, item) => total + item.cantidad, 0),
      },
      { etiqueta: "Tendencias", valor: tendenciaData.length },
      { etiqueta: "Stock visible", valor: stockData.length },
    ],
    [prioridadData, stockData, tendenciaData]
  );

  const exportToExcel = async () => {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      notify({ tone: "error", title: "El rango de fechas no es valido" });
      return;
    }

    try {
      setExporting(true);
      const params = new URLSearchParams();

      if (fechaDesde) {
        params.set("desde", fechaDesde);
      }

      if (fechaHasta) {
        params.set("hasta", fechaHasta);
      }

      const query = params.toString();
      const response = await fetch(`${API_URL}/api/reportes/excel${query ? `?${query}` : ""}`, {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        notify({ tone: "error", title: "No se pudo exportar el reporte" });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const fileName = disposition?.match(/filename="([^"]+)"/i)?.[1] ?? "Reporte_Enfermeria.xlsx";
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      notify({ tone: "success", title: "Reporte exportado correctamente" });
    } catch (err) {
      console.error(err);
      notify({ tone: "error", title: "No se pudo exportar el reporte" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7fb_0%,#f2f4f8_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-64 rounded bg-gray-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-5 h-8 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-[28px] bg-white shadow-sm" />
            <div className="h-80 rounded-[28px] bg-white shadow-sm" />
          </div>
          <div className="h-96 rounded-[28px] bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1d1029] via-[#2e1742] to-[#4f2671] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
                Reportes
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Lectura operativa</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Visualiza volumen de consultas, prioridad clinica y estado del inventario en una sola capa analitica.
              </p>
            </div>

            <div className="grid gap-3 self-center sm:grid-cols-3">
              {resumen.map((item) => (
                <div
                  key={item.etiqueta}
                  className="flex min-h-[104px] min-w-[132px] flex-col justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-200">
                    {item.etiqueta}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.valor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white shadow-lg">
          <div className="border-b border-gray-100 px-8 py-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
                  Consola analitica
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">Indicadores clave</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                  <label className="flex min-w-[168px] flex-col gap-1 text-sm text-gray-700">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(event) => setFechaDesde(event.target.value)}
                    className="h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-gray-800 outline-none"
                  />
                  </label>
                  <label className="flex min-w-[168px] flex-col gap-1 text-sm text-gray-700">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(event) => setFechaHasta(event.target.value)}
                    className="h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-gray-800 outline-none"
                  />
                  </label>
                </div>
                <button
                  onClick={() => void exportToExcel()}
                  disabled={exporting}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {exporting ? "Exportando..." : "Exportar a Excel"}
                </button>
                <button
                  onClick={() => nav("/dashboard")}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700"
                >
                  <ArrowLongLeftIcon className="h-5 w-5" />
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[28px] border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 shadow-[0_24px_45px_-38px_rgba(76,29,149,0.45)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                      Prioridades
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">
                      Consultas por prioridad
                    </h3>
                  </div>
                </div>
                <div className="mt-6">
                  {prioridadData.length > 0 ? (
                    <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  ) : (
                    <p className="text-sm text-gray-500">Sin datos disponibles.</p>
                  )}
                </div>
              </article>

              <article className="rounded-[28px] border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 shadow-[0_24px_45px_-38px_rgba(76,29,149,0.45)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Squares2X2Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                      Inventario
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">
                      Stock actual por insumo
                    </h3>
                  </div>
                </div>
                <div className="mt-6">
                  {stockData.length > 0 ? (
                    <Pie
                      data={pieData}
                      options={{ responsive: true, plugins: { legend: { position: "right" as const } } }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">Sin stock registrado.</p>
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-[28px] border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 shadow-[0_24px_45px_-38px_rgba(76,29,149,0.45)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <PresentationChartLineIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                    Tendencia
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">
                    Consultas por dia
                  </h3>
                </div>
              </div>
              <div className="mt-6">
                {tendenciaData.length > 0 ? (
                  <Line
                    data={lineData}
                    options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
                  />
                ) : (
                  <p className="text-sm text-gray-500">Sin datos disponibles.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
