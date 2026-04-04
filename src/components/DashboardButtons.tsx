import { FiShoppingCart, FiFileText, FiEdit3, FiMail } from 'react-icons/fi';

const DashboardButtons = () => {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  const items = [
    { 
      icon: <FiShoppingCart />, 
      label: 'Página de Farmatodo',
      url: 'https://www.farmatodo.com.ve/'
    },
    { 
      icon: <FiShoppingCart />, 
      label: 'Página de Locatel',
      url: 'https://www.locatel.com.ve/'
    },
    { 
      icon: <FiFileText />, 
      label: 'Tipos de documentos',
      url: 'https://www.ilovepdf.com/'
    },
    { 
      icon: <FiEdit3 />, 
      label: 'Corrector ortográfico',
      url: 'https://quillbot.com/es/corrector-ortografico'
    },
    { 
      icon: <FiMail />, 
      label: 'Página de Gmail',
      url: 'https://workspace.google.com/intl/es-419/gmail/'
    }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex gap-4 justify-center">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(item.url)}
            className="group relative flex flex-col items-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 w-24 h-24"
            aria-label={item.label}
          >
            <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300 text-2xl mb-2">
              {item.icon}
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-800 font-medium transition-colors duration-300 text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardButtons;