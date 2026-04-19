import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon, ShieldCheckIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/auth";
import { useAuth } from "../../contexts/auth-context";
import { useNotifications } from "../../contexts/notification-context";

type UserRecord = {
  id: string;
  email: string;
  role: string;
};

type HistoryRecord = {
  tipo: string;
  referencia_id: string;
  origen: string;
  fecha: string;
  actor_email: string;
  actor_role: string;
  paciente_nombre: string;
  paciente_codigo: string;
  titulo: string;
  detalle: string;
  eliminable: boolean;
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
  const { notify, confirm } = useNotifications();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyType, setHistoryType] = useState("todos");
  const [historyDeletingId, setHistoryDeletingId] = useState<string | null>(null);
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

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const response = await authFetch("/api/users/history");
      const data = (await response.json()) as HistoryRecord[] | { error?: string };

      if (!response.ok || !Array.isArray(data)) {
        return;
      }

      setHistory(data);
    } catch (historyError) {
      console.error(historyError);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
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

  const deleteUser = async (id: string, email: string) => {
    const accepted = await confirm({
      title: "Eliminar usuario",
      message: `Se eliminara la cuenta ${email}. Esta accion no se puede deshacer.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tone: "error",
    });

    if (!accepted) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const response = await authFetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "No se pudo eliminar el usuario");
        return;
      }

      setUsers((current) => current.filter((item) => item.id !== id));
      notify({ tone: "success", title: "Usuario eliminado" });
    } catch (deleteError) {
      console.error(deleteError);
      setError("No se pudo eliminar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void fetchUsers();
    void fetchHistory();
  }, []);

  const deleteHistoryItem = async (item: HistoryRecord) => {
    if (!item.eliminable) {
      notify({
        tone: "info",
        title: "Este registro no se puede borrar aqui",
        message: "Las consultas y movimientos reales se eliminan desde sus modulos correspondientes.",
      });
      return;
    }

    const accepted = await confirm({
      title: "Eliminar registro de auditoria",
      message: "Esta accion solo limpia la bitacora visual de auditoria. No revierte la accion original.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tone: "error",
    });

    if (!accepted) return;

    setHistoryDeletingId(`${item.origen}:${item.referencia_id}`);

    try {
      const response = await authFetch(`/api/users/history/${item.origen}/${item.referencia_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        notify({ tone: "error", title: "No se pudo eliminar", message: data.error ?? "Intenta nuevamente." });
        return;
      }

      setHistory((current) =>
        current.filter((entry) => !(entry.origen === item.origen && entry.referencia_id === item.referencia_id))
      );
      notify({ tone: "success", title: "Registro de auditoria eliminado" });
    } catch (historyDeleteError) {
      console.error(historyDeleteError);
      notify({ tone: "error", title: "No se pudo eliminar el registro" });
    } finally {
      setHistoryDeletingId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();

    return history.filter((item) => {
      if (historyType !== "todos" && item.tipo !== historyType) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.actor_email,
        item.actor_role,
        item.paciente_nombre,
        item.paciente_codigo,
        item.titulo,
        item.detalle,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [history, historyQuery, historyType]);

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
              onClick={() => {
                void fetchUsers();
                void fetchHistory();
              }}
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
                      disabled={savingId === item.id || deletingId === item.id}
                      onChange={(event) => void updateRole(item.id, event.target.value)}
                      className="min-w-52 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void deleteUser(item.id, item.email)}
                      disabled={item.id === user?.id || deletingId === item.id || savingId === item.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(76,29,149,0.35)]">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-500">
                Historial operativo
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Trazabilidad de acciones</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                Aqui puedes ver quien registro pacientes, quien creo consultas, que medicamento se entrego en cada consulta y quien hizo entradas o salidas de inventario.
              </p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm font-semibold text-violet-700">
              {filteredHistory.length} de {history.length} eventos
            </div>
          </div>

          {historyLoading ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-gray-500">
              Cargando historial...
            </div>
          ) : history.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
              Aun no hay eventos visibles en el historial operativo.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
                <label className="relative block">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
                  <input
                    type="text"
                    value={historyQuery}
                    onChange={(event) => setHistoryQuery(event.target.value)}
                    placeholder="Buscar por usuario, paciente, identificador o detalle..."
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
                <select
                  value={historyType}
                  onChange={(event) => setHistoryType(event.target.value)}
                  className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="todos">Todos los eventos</option>
                  <option value="consulta">Consultas</option>
                  <option value="inventario">Inventario</option>
                  <option value="auditoria">Auditoria</option>
                </select>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">
                  No hay coincidencias con los filtros aplicados.
                </div>
              ) : (
                <div className="overflow-hidden rounded-[24px] border border-violet-100">
                  <div className="max-h-[680px] overflow-auto">
                    <table className="min-w-full text-left">
                      <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur">
                        <tr className="border-b border-violet-100 text-xs uppercase tracking-[0.18em] text-gray-500">
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Tipo</th>
                          <th className="px-4 py-3 font-semibold">Accion</th>
                          <th className="px-4 py-3 font-semibold">Usuario</th>
                          <th className="px-4 py-3 font-semibold">Paciente</th>
                          <th className="px-4 py-3 font-semibold">Detalle</th>
                          <th className="px-4 py-3 font-semibold text-right">Opciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredHistory.map((item) => {
                          const deleteKey = `${item.origen}:${item.referencia_id}`;

                          return (
                            <tr key={`${item.tipo}-${item.referencia_id}-${item.fecha}`} className="border-b border-gray-100 align-top text-sm">
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                {new Date(item.fecha).toLocaleString("es-VE")}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                                  {item.tipo}
                                </span>
                              </td>
                              <td className="px-4 py-3 min-w-[220px]">
                                <p className="font-semibold text-gray-900">{item.titulo}</p>
                              </td>
                              <td className="px-4 py-3 min-w-[220px] text-gray-700">
                                <p className="font-medium text-gray-900">{item.actor_email}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">{item.actor_role}</p>
                              </td>
                              <td className="px-4 py-3 min-w-[200px] text-gray-700">
                                <p className="font-medium text-gray-900">{item.paciente_nombre}</p>
                                <p className="mt-1 text-xs text-gray-500">{item.paciente_codigo}</p>
                              </td>
                              <td className="px-4 py-3 min-w-[320px] text-gray-600">
                                <p className="line-clamp-3 leading-6">{item.detalle}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {item.eliminable ? (
                                  <button
                                    type="button"
                                    onClick={() => void deleteHistoryItem(item)}
                                    disabled={historyDeletingId === deleteKey}
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {historyDeletingId === deleteKey ? "Eliminando..." : "Eliminar"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">Desde su modulo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
