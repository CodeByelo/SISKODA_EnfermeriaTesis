import { FiEdit3, FiFileText, FiMail, FiShoppingCart } from 'react-icons/fi';

const items = [
  {
    icon: <FiShoppingCart />,
    label: 'Pagina de Farmatodo',
    url: 'https://www.farmatodo.com.ve/',
  },
  {
    icon: <FiShoppingCart />,
    label: 'Pagina de Locatel',
    url: 'https://www.locatel.com.ve/',
  },
  {
    icon: <FiFileText />,
    label: 'Tipos de documentos',
    url: 'https://www.ilovepdf.com/',
  },
  {
    icon: <FiEdit3 />,
    label: 'Corrector ortografico',
    url: 'https://quillbot.com/es/corrector-ortografico',
  },
  {
    icon: <FiMail />,
    label: 'Pagina de Gmail',
    url: 'https://workspace.google.com/intl/es-419/gmail/',
  },
];

export default function DashboardButtons() {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Accesos rapidos
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">
          Herramientas complementarias
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleClick(item.url)}
            className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md"
            aria-label={item.label}
          >
            <div className="mb-3 text-2xl text-indigo-600 transition-colors group-hover:text-indigo-700">
              {item.icon}
            </div>
            <span className="text-sm font-medium leading-5 text-gray-700">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
