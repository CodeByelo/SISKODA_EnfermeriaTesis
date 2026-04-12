import { FiEdit3, FiFileText, FiMail, FiShoppingCart } from "react-icons/fi";

const items = [
  {
    icon: <FiShoppingCart />,
    label: "Página de Farmatodo",
    url: "https://www.farmatodo.com.ve/",
    detail: "Consulta precios y disponibilidad de productos.",
  },
  {
    icon: <FiShoppingCart />,
    label: "Página de Locatel",
    url: "https://www.locatel.com.ve/",
    detail: "Apoyo para cotizaciones y referencias rápidas.",
  },
  {
    icon: <FiFileText />,
    label: "Tipos de documentos",
    url: "https://www.ilovepdf.com/",
    detail: "Herramientas externas para trabajo administrativo.",
  },
  {
    icon: <FiEdit3 />,
    label: "Corrector ortográfico",
    url: "https://quillbot.com/es/corrector-ortografico",
    detail: "Verifica redacción y ortografía clínica.",
  },
  {
    icon: <FiMail />,
    label: "Página de Gmail",
    url: "https://workspace.google.com/intl/es-419/gmail/",
    detail: "Acceso directo al correo institucional.",
  },
];

export default function DashboardButtons() {
  const handleClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <section className="mt-8 rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_22px_50px_-42px_rgba(76,29,149,0.4)]">
      <div className="mb-6 flex flex-col gap-2 border-b border-violet-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">
          Accesos rápidos
        </p>
        <h3 className="text-2xl font-semibold text-gray-900">Herramientas complementarias</h3>
        <p className="text-sm text-gray-500">
          Enlaces útiles para compras, validación documental, correo y revisión de texto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleClick(item.url)}
            className="group flex min-h-40 flex-col rounded-[24px] border border-violet-100 bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-5 py-5 text-left transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_22px_40px_-30px_rgba(76,29,149,0.35)]"
            aria-label={item.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-indigo-600 transition-colors group-hover:bg-violet-700 group-hover:text-white">
                {item.icon}
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500 ring-1 ring-violet-100">
                Externo
              </span>
            </div>
            <span className="mt-6 text-base font-semibold leading-6 text-gray-900">{item.label}</span>
            <span className="mt-2 text-sm leading-6 text-gray-500">{item.detail}</span>
            <span className="mt-auto pt-5 text-sm font-semibold text-violet-700 transition group-hover:translate-x-1">
              Abrir enlace
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
