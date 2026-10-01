"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";
import Toast from "./Toast";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastData = {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
  nonce: number;
};

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 30000;

type ToastContextType = {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  show: (type: ToastType, message: string, duration?: number) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);

  const hide = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const hideAll = useCallback(() => setToasts([]), []);

  const show = useCallback((type: ToastType, message: string, duration: number = DEFAULT_DURATION) => {
    nextId.current += 1;
    const item: ToastData = { id: nextId.current, type, message, duration, nonce: 0 };
    setToasts((prev) => {
      const index = prev.findIndex((toast) => toast.type === type && toast.message === message);
      if (index === -1) {
        return [item, ...prev].slice(0, MAX_TOASTS);
      }
      const next = [...prev];
      next[index] = { ...next[index], duration, nonce: next[index].nonce + 1 };
      return next;
    });
  }, []);

  const success = useCallback((message: string, duration?: number) => show("success", message, duration), [show]);
  const error = useCallback((message: string, duration?: number) => show("error", message, duration), [show]);
  const info = useCallback((message: string, duration?: number) => show("info", message, duration), [show]);
  const warning = useCallback((message: string, duration?: number) => show("warning", message, duration), [show]);

  const value = useMemo<ToastContextType>(
    () => ({ success, error, info, warning, show, hide: hideAll }),
    [success, error, info, warning, show, hideAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-6 right-6 z-[10000] flex flex-col items-end gap-3">
        {toasts.map((item) => (
          <Toast
            key={item.id}
            id={item.id}
            type={item.type}
            message={item.message}
            duration={item.duration}
            nonce={item.nonce}
            onClose={hide}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
