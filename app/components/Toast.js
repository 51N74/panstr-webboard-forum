"use client";

import React, { useEffect, useState } from "react";

/**
 * Toast - การแจ้งเตือนแบบ Pop-up
 * @param {Object} props
 * @param {string} props.message - ข้อความที่จะแสดง
 * @param {'success' | 'error' | 'info' | 'warning'} props.type - ประเภทของการแจ้งเตือน
 * @param {boolean} props.isOpen - เปิดหรือไม่
 * @param {Function} props.onClose - ฟังก์ชันปิด
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
      }, 3000); // Auto-close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isAnimating && !visible) return null;

  const typeStyles = {
    success: {
      bg: "bg-green-500",
      icon: "check_circle",
      iconColor: "text-green-500",
    },
    error: {
      bg: "bg-error",
      icon: "error",
      iconColor: "text-error",
    },
    warning: {
      bg: "bg-amber-500",
      icon: "warning",
      iconColor: "text-amber-500",
    },
    info: {
      bg: "bg-primary",
      icon: "info",
      iconColor: "text-primary",
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${
        visible && isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
      role="alert"
    >
      <div
        className={`${style.bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}
      >
        <span className="material-symbols-outlined text-xl">
          {style.icon}
        </span>
        <span className="font-medium text-sm flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="ปิด"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer - Container สำหรับจัดการ multiple toasts
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isOpen={true}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * useToast - Hook สำหรับใช้งาน Toast
 * @returns {Object} methods สำหรับแสดง toast
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message) => addToast(message, "success");
  const error = (message) => addToast(message, "error");
  const warning = (message) => addToast(message, "warning");
  const info = (message) => addToast(message, "info");

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
