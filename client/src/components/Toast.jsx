import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* =============================================
   Toast Context + Hook
   ============================================= */

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration, leaving: false }]);

    // Schedule removal
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, duration);

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  // Convenience aliases
  const toast = {
    success: (message, opts) => addToast({ message, type: 'success', ...opts }),
    error:   (message, opts) => addToast({ message, type: 'error',   ...opts }),
    info:    (message, opts) => addToast({ message, type: 'info',    ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* =============================================
   Individual Toast Item
   ============================================= */

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-slate-900',
    border: 'border-emerald-500/40',
    iconColor: 'text-emerald-400',
    progressColor: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-slate-900',
    border: 'border-red-500/40',
    iconColor: 'text-red-400',
    progressColor: 'bg-red-500',
  },
  info: {
    icon: Info,
    bg: 'bg-slate-900',
    border: 'border-blue-500/40',
    iconColor: 'text-blue-400',
    progressColor: 'bg-blue-500',
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 max-w-xs sm:max-w-sm
        px-4 py-3 rounded-xl border shadow-2xl overflow-hidden
        ${cfg.bg} ${cfg.border}
        ${toast.leaving ? 'animate-toast-out' : 'animate-toast-in'}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />

      {/* Message */}
      <p className="flex-1 text-xs text-slate-200 leading-relaxed font-medium">
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.progressColor} animate-toast-progress`}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

/* =============================================
   Toast Container (fixed bottom-right)
   ============================================= */

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
