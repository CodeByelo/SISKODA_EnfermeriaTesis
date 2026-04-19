import { Suspense, lazy, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/auth-context';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LiquidEther = lazy(() => import('../../../components/LiquidEther'));

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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showMasterKey, setShowMasterKey] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.masterKey) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un correo electronico valido.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/register`, formData);
      setSuccess(true);
      setError('');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error as string);
      } else {
        setError('Error al registrar. Intenta nuevamente.');
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0 opacity-90">
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1fr_minmax(420px,520px)]">
          <section className="hidden rounded-[32px] border border-white/10 bg-white/8 p-8 text-white shadow-2xl backdrop-blur lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-fuchsia-200">Administracion</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight">Alta de administrador del sistema.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200">
              Este acceso es exclusivo para la configuracion inicial y gestion segura del sistema institucional.
            </p>
          </section>

          <section className="mx-auto flex w-full max-w-xl items-center">
            <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/75 shadow-2xl backdrop-blur-xl">
              <div className="px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex justify-center">
                  <img
                    src={`${import.meta.env.BASE_URL}ISUMlogo.png`}
                    alt="Logo ISUM"
                    className="h-16 w-auto transition-transform duration-300 hover:scale-105 sm:h-20"
                  />
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200">Registro</p>
                  <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Administrador</h2>
                  <p className="mt-3 text-sm font-medium text-slate-300 sm:text-base">
                    Solo para personal autorizado
                  </p>
                </div>

                {success ? (
                  <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-center text-sm text-emerald-200">
                    Registro exitoso. Redirigiendo al login...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                        className="h-12 w-full rounded-2xl border border-slate-600 bg-slate-800/70 px-4 text-white placeholder-slate-400 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                        Contrasena
                      </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 w-full rounded-2xl border border-slate-600 bg-slate-800/70 px-4 pr-12 text-white placeholder-slate-400 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-white"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    </div>

                    <div>
                      <label htmlFor="masterKey" className="mb-2 block text-sm font-medium text-slate-200">
                        Clave maestra
                      </label>
                    <div className="relative">
                      <input
                        id="masterKey"
                        type={showMasterKey ? "text" : "password"}
                        placeholder="Clave secreta"
                        value={formData.masterKey}
                        onChange={(e) => setFormData({ ...formData, masterKey: e.target.value })}
                        className="h-12 w-full rounded-2xl border border-slate-600 bg-slate-800/70 px-4 pr-12 text-white placeholder-slate-400 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterKey(!showMasterKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-white"
                      >
                        {showMasterKey ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-sm font-bold text-white shadow-lg transition hover:from-purple-700 hover:to-pink-700"
                    >
                      Registrar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
