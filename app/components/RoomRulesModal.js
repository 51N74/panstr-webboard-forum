"use client";

import React, { useEffect, useState } from "react";

/**
 * RoomRulesModal - แสดงกฎของห้องก่อนการโพสต์
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal เปิดหรือไม่
 * @param {Function} props.onClose - ฟังก์ชันปิด modal
 * @param {Function} props.onAgree - ฟังก์ชันเมื่อกดยอมรับกฎ
 * @param {string} props.roomName - ชื่อห้อง
 * @param {string[]} props.rules - รายการกฎของห้อง
 */
export default function RoomRulesModal({
  isOpen,
  onClose,
  onAgree,
  roomName,
  rules,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setIsChecked(false);
      // ป้องกันการ scroll ของ body เมื่อ modal เปิด
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container px-6 py-4">
          <div className="flex items-center justify-between">
            <h2
              id="modal-title"
              className="text-xl font-bold text-white"
            >
              📋 กฎของห้อง
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="ปิด"
            >
              <span className="material-symbols-outlined text-2xl">
                close
              </span>
            </button>
          </div>
          <p className="text-white/90 text-sm mt-1">
            {roomName}
          </p>
        </div>

        {/* Rules List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {rules && rules.length > 0 ? (
            <ul className="space-y-3">
              {rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-surface-container-high rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-container text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-on-surface text-sm leading-relaxed">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary text-center py-8">
              ไม่มีกฎสำหรับห้องนี้
            </p>
          )}
        </div>

        {/* Footer with Agreement Checkbox */}
        <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/20">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-2"
            />
            <span className="text-sm text-on-surface leading-relaxed">
              ฉันได้อ่านและตกลงที่จะปฏิบัติตามกฎของห้อง
            </span>
          </label>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-secondary font-semibold border border-outline-variant/30 rounded-lg hover:bg-surface-container-high transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => isChecked && onAgree()}
              disabled={!isChecked}
              className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-all ${
                isChecked
                  ? "bg-primary text-white hover:bg-primary-container shadow-lg hover:shadow-xl"
                  : "bg-surface-container-high text-secondary cursor-not-allowed"
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
