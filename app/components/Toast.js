"use client";

import React, { useEffect, useState } from "react";

/**
 * Toast - Panstr Minimal Pop-up Notifications
 * Refined layering: z-toast for global priority.
 */
export default function Toast({ message, type = "info", isOpen, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        const animationTimer = setTimeout(() => {
          setIsAnimating(false);
          onClose?.();
        }, 300);
        return () => clearTimeout(animationTimer);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isAnimating && !visible) return null;

  const typeStyles = {
    success: { bg: "bg-success", icon: "check_circle" },
    error: { bg: "bg-error", icon: "error" },
    warning: { bg: "bg-warning", icon: "warning" },
    info: { bg: "bg-accent", icon: "info" },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-toast transition-all duration-300 ${
        visible && isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
      role="alert"
    >
      <div
        className={`${style.bg} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[280px] sm:min-w-[320px]`}
      >
        <span className="material-symbols-outlined text-xl">
          {style.icon}
        </span>
        <span className="font-bold text-[11px] uppercase tracking-widest flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer - Container for multiple toasts with z-toast priority
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-toast space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            isOpen={true}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message) => addToast(message, "success");
  const error = (message) => addToast(message, "error");
  const warning = (message) => addToast(message, "warning");
  const info = (message) => addToast(message, "info");

  return { toasts, addToast, removeToast, success, error, warning, info };
}
