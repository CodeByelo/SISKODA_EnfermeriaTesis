import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../config/api";

export default function RegistroPortal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await axios.post(`${API_URL}/api/auth/register-portal`, formData);
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 1800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data?.error as string) ?? "No se pudo registrar la cuenta");
        return;
      }
      setError("No se pudo registrar la cuenta");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#172554_45%,#4c1d95_100%)] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-[28px] border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">Portal ISUM</p>
        <h1 className="mt-4 text-3xl font-semibold">Crear cuenta institucional</h1>
        <p className="mt-3 text-sm text-violet-100">
          Usa tu cedula, codigo institucional o correo institucional para vincular tu cuenta.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100">
            Cuenta creada con exito. Redirigiendo al acceso principal...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-100">Identificador institucional</label>
              <input
                value={formData.identifier}
                onChange={(event) => setFormData((current) => ({ ...current, identifier: event.target.value }))}
                placeholder="Cedula, carnet o correo institucional"
                className="w-full rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-100">Correo de acceso</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="Tu correo para iniciar sesion"
                className="w-full rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-violet-100">Contrasena</label>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder="********"
                className="w-full rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-white outline-none"
                required
              />
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-900"
              >
                Crear cuenta
              </button>
              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white"
              >
                Volver al login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
