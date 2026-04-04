import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LiquidEther from '../../../components/LiquidEther';
import { API_URL } from '../../../config/api';

interface FormData {
  email: string;
  password: string;
  masterKey: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    masterKey: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.masterKey) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/register`, formData);
      setSuccess(true);
      setError('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al registrar. Intenta nuevamente.');
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img
                src={`${import.meta.env.BASE_URL}ISUMlogo.png`}
                alt="Logo ISUM"
                className="h-20 w-auto transition-all duration-300 hover:scale-105"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-white text-center mb-4 bg-clip-text">
              REGISTRO DE ADMINISTRADOR
            </h2>
            <p className="text-center text-gray-300 mb-8 font-medium">
              Solo para personal autorizado
            </p>
            {success ? (
              <div className="bg-green-900/50 text-green-200 p-4 rounded-lg text-center border border-green-600">
                ¡Registro exitoso! Redirigiendo al login...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ejemplo@isum.edu.ve"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="masterKey" className="block text-sm font-medium text-gray-300 mb-1">
                    Clave Maestra
                  </label>
                  <input
                    id="masterKey"
                    type="password"
                    placeholder="Clave secreta"
                    value={formData.masterKey}
                    onChange={(e) => setFormData({ ...formData, masterKey: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                {error && (
                  <div className="bg-red-900/50 text-red-200 p-4 rounded-lg text-center border border-red-600">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  <span className="mr-2">REGISTRAR</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
