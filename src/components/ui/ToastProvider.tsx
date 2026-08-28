"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Toast from "./Toast";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastData = {
  type: ToastType;
  message: string;
  duration?: number;
};

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
  const [toast, setToast] = useState<ToastData | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const hide = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setToast(null);
  };

  const show = (type: ToastType, message: string, duration: number = 3000) => {
    if (toast) {
      hide();
      setTimeout(() => {
        setToast({ type, message, duration });
      }, 100);
    } else {
      setToast({ type, message, duration });
    }
  };

  const success = (message: string, duration?: number) => show("success", message, duration);
  const error = (message: string, duration?: number) => show("error", message, duration);
  const info = (message: string, duration?: number) => show("info", message, duration);
  const warning = (message: string, duration?: number) => show("warning", message, duration);

  const value: ToastContextType = {
    success,
    error,
    info,
    warning,
    show,
    hide,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hide}
        />
      )}
    </ToastContext.Provider>
  );
}