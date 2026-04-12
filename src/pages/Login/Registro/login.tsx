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
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="absolute inset-0 z-0 opacity-40">
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid w-full items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)] lg:gap-6">
          <section className="hidden overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/88 p-6 text-slate-900 shadow-[0_30px_80px_-40px_rgba(76,29,149,0.28)] backdrop-blur-md lg:flex lg:flex-col lg:justify-between xl:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-500">ISUM Enfermeria</p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight xl:text-5xl">
                Control clinico, identidad institucional y seguimiento en una sola capa.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 xl:text-base xl:leading-7">
                Accede al sistema institucional para gestionar expedientes, consultas, inventario y reportes con trazabilidad.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Portal', value: 'Estudiantes y personal' },
                { label: 'Clinica', value: 'Expedientes y consultas' },
                { label: 'Operacion', value: 'Inventario y reportes' },
              ].map((item) => (
                <article key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4 xl:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-xl items-center">
            <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/75 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex justify-center">
                  <img
                    src={`${import.meta.env.BASE_URL}ISUMlogo.png`}
                    alt="Logo ISUM"
                    className="h-14 w-auto cursor-pointer transition-transform duration-300 hover:scale-105 sm:h-18"
                    onClick={() => setClickCount((prev) => prev + 1)}
                  />
                </div>

                <div className="mt-4 text-center sm:mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">Acceso</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Acceso restringido</h2>
                  <p className="mt-2 text-sm font-medium text-slate-300 sm:text-base">
                    Ingresa tus credenciales para continuar
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                      Correo electronico
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="ejemplo@isum.edu.ve"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-slate-600 bg-slate-800/70 px-4 text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                      Contrasena
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-slate-600 bg-slate-800/70 px-4 text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      required
                    />
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {isLoading ? 'Validando...' : 'Acceder'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/registro-portal')}
                    className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Crear cuenta institucional
                  </button>
                </form>
              </div>

              <div className="border-t border-white/10 bg-slate-950/30 px-6 py-4 text-center text-sm text-slate-300 sm:px-8">
                Sistema de Gestion ISUM | {new Date().getFullYear()}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
