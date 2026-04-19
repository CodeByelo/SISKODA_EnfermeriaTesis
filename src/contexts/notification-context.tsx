/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type NotificationTone = "success" | "error" | "info";

type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  tone: NotificationTone;
};

type NotificationContextValue = {
  notify: (input: Omit<NotificationItem, "id">) => void;
  confirm: (input: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: NotificationTone }) => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const toneClassMap: Record<NotificationTone, string> = {
  success: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))] text-emerald-950 shadow-[0_24px_50px_-36px_rgba(5,150,105,0.45)]",
  error: "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98))] text-rose-950 shadow-[0_24px_50px_-36px_rgba(225,29,72,0.35)]",
  info: "border-violet-200/80 bg-[linear-gradient(135deg,rgba(245,243,255,0.96),rgba(255,255,255,0.98))] text-violet-950 shadow-[0_24px_50px_-36px_rgba(91,33,182,0.4)]",
};

const toneAccentMap: Record<NotificationTone, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  info: "bg-violet-500",
};

type ConfirmState = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: NotificationTone;
};

export function NotificationProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((input: Omit<NotificationItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { ...input, id }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const resolveConfirm = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setConfirmState(null);
  }, []);

  const confirm = useCallback((input: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: NotificationTone }) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setConfirmState({
        title: input.title,
        message: input.message,
        confirmLabel: input.confirmLabel ?? "Confirmar",
        cancelLabel: input.cancelLabel ?? "Cancelar",
        tone: input.tone ?? "info",
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto overflow-hidden rounded-[24px] border px-4 py-4 backdrop-blur-xl ${toneClassMap[item.tone]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${toneAccentMap[item.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.message ? (
                  <p className="mt-1 text-sm opacity-75">{item.message}</p>
                ) : null}
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="opacity-60 transition hover:opacity-100">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#14091f]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] shadow-[0_30px_80px_-40px_rgba(46,22,76,0.55)]">
            <div className="bg-gradient-to-r from-[#23102f] via-[#34164c] to-[#4c1d72] px-6 py-5 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">Confirmacion</p>
                  <h3 className="mt-2 text-xl font-semibold">{confirmState.title}</h3>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              {confirmState.message ? (
                <p className="text-sm leading-6 text-gray-600">{confirmState.message}</p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => resolveConfirm(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {confirmState.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => resolveConfirm(true)}
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                    confirmState.tone === "error"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : confirmState.tone === "success"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-violet-700 hover:bg-violet-800"
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de NotificationProvider");
  }
  return context;
}
