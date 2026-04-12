import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/auth";
import { useAuth } from "../../contexts/auth-context";

type UserRecord = {
  id: number;
  email: string;
  role: string;
};

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "enfermeria", label: "Enfermería" },
  { value: "consulta", label: "Consulta" },
  { value: "inventario", label: "Inventario" },
  { value: "reportes", label: "Reportes" },
  { value: "estudiante", label: "Estudiante" },
  { value: "profesor", label: "Profesor" },
  { value: "personal", label: "Personal" },
];

const roleTone: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 ring-violet-200",
  enfermeria: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  consulta: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  inventario: "bg-slate-100 text-slate-700 ring-slate-200",
  reportes: "bg-stone-100 text-stone-700 ring-stone-200",
  estudiante: "bg-sky-100 text-sky-700 ring-sky-200",
  profesor: "bg-amber-100 text-amber-700 ring-amber-200",
  personal: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export default function Usuarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const summary = useMemo(
    () =>
      roleOptions.map((role) => ({
        ...role,
        total: users.filter((item) => item.role === role.value).length,
      })),
    [users]
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/users");
      const data = (await response.json()) as UserRecord[] | { error?: string };

      if (!response.ok || !Array.isArray(data)) {
        setError(Array.isArray(data) ? "No se pudieron cargar los usuarios" : data.error ?? "No se pudieron cargar los usuarios");
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch (fetchError) {
      console.error(fetchError);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: number, role: string) => {
    setSavingId(id);
    setError("");

    try {
      const response = await authFetch(`/api/users/${id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = (await response.json()) as UserRecord | { error?: string };

      if (!response.ok || !("id" in data)) {
        setError("error" in data ? data.error ?? "No se pudo actualizar el rol" : "No se pudo actualizar el rol");
        return;
      }

      setUsers((current) => current.map((item) => (item.id === data.id ? data : item)));
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo actualizar el rol");
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
          <p className="mt-3 text-sm text-gray-600">
            Solo un administrador puede ver y editar roles. Los pacientes se gestionan desde el módulo de expedientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.08),_transparent_34%),linear-gradient(180deg,#f8f7ff_0%,#f5f5f7_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_24px_60px_-36px_rgba(76,29,149,0.35)]">
          <div className="flex flex-col gap-6 border-b border-violet-100 bg-gradient-to-r from-[#23102f] via-[#34164c] to-[#4c1d72] px-6 py-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-200">
                Administración
              </p>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Usuarios y roles</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Aquí defines quién administra el sistema y qué área controla cada cuenta. Los pacientes se gestionan en expedientes, no como usuarios internos del sistema.
              </p>
            </div>

            <div className="ml-auto flex w-full flex-nowrap justify-end gap-3 lg:w-[330px] xl:w-[360px]">
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex h-16 w-[112px] shrink-0 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[11px] font-semibold leading-none text-white transition hover:bg-white/15"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Volver al inicio
              </button>
              <div className="flex h-16 w-[104px] shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm">
                <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200">Usuarios</p>
                <p className="mt-0.5 text-base font-semibold sm:text-lg">{users.length}</p>
              </div>
              <div className="flex h-16 w-[104px] shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm">
                <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200">Tu rol</p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] font-semibold leading-none sm:text-[12px]">
                  Administrador
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-8 py-6 md:grid-cols-2 xl:grid-cols-5">
            {summary.map((item) => (
              <article
                key={item.value}
                className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-5 shadow-[0_16px_35px_-30px_rgba(91,33,182,0.5)]"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleTone[item.value]}`}>
                    {item.label}
                  </span>
                  <ShieldCheckIcon className="h-5 w-5 text-violet-400" />
                </div>
                <p className="mt-5 text-3xl font-semibold text-gray-900">{item.total}</p>
                <p className="mt-1 text-sm text-gray-500">cuentas asignadas</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(76,29,149,0.35)]">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500">
                Control de acceso
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Asignación de roles</h2>
            </div>
            <button
              onClick={() => void fetchUsers()}
              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
            >
              Actualizar listado
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
              Cargando usuarios...
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {users.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-3xl border border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-5 shadow-[0_18px_35px_-32px_rgba(76,29,149,0.45)] lg:grid-cols-[1.4fr,auto]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <UserGroupIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{item.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                          ID {item.id}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleTone[item.role] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}>
                          {roleOptions.find((role) => role.value === item.role)?.label ?? item.role}
                        </span>
                        {item.id === user?.id && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            Tu cuenta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 sm:flex-row sm:items-center lg:justify-end">
                    <label className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
                      Rol
                    </label>
                    <select
                      value={item.role}
                      disabled={savingId === item.id}
                      onChange={(event) => void updateRole(item.id, event.target.value)}
                      className="min-w-52 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
