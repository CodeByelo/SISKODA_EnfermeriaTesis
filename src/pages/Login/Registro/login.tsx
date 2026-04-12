import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/auth-context';

const LiquidEther = lazy(() => import('../../../components/LiquidEther'));

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
};

export default function Login() {
  const [clickCount, setClickCount] = useState<number>(0);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (clickCount === 5) {
      navigate('/register');
    }
    const timer = setTimeout(() => setClickCount(0), 1000);
    return () => clearTimeout(timer);
  }, [clickCount, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, formData);
      login(response.data.token, response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Error al iniciar sesion');
      } else {
        setError('Error al iniciar sesion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full bg-slate-950" />}>
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
        </Suspense>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img
                src={`${import.meta.env.BASE_URL}ISUMlogo.png`}
                alt="Logo ISUM"
                className="h-20 w-auto cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => setClickCount(prev => prev + 1)}
              />
            </div>
            <h2 className="text-3xl font-extrabold text-white text-center mb-4 bg-clip-text">
              ACCESO RESTRINGIDO
            </h2>
            <p className="text-center text-gray-300 mb-8 font-medium">
              Ingresa tus credenciales para continuar
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Correo Electronico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@isum.edu.ve"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              {error && (
                <div className="p-3 bg-red-900/50 text-red-200 rounded-lg text-sm text-center border border-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Validando...' : 'ACCEDER'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/registro-portal')}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Crear cuenta institucional
              </button>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-900/50 text-center text-gray-300 text-sm">
            <p>Sistema de Gestion ISUM | {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
