"use client";

import React, { useEffect, useState } from "react";

/**
 * ReportModal - Modal สำหรับรายงานเนื้อหาที่ไม่เหมาะสม
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal เปิดหรือไม่
 * @param {Function} props.onClose - ฟังก์ชันปิด modal
 * @param {Function} props.onSubmit - ฟังก์ชันส่งรายงาน (reason, evidence)
 * @param {string} props.eventId - ID ของ event ที่ถูก báoง
 * @param {string} props.eventType - ประเภทของ event (thread, reply)
 */
export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  eventId,
  eventType = "thread",
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // รายงานเหตุผล (ภาษาไทย)
  const reportReasons = [
    {
      value: "spam",
      label: "สแปม / โฆษณา",
      description: "โพสต์โฆษณา ขายของ หรือเนื้อหาซ้ำๆ",
      icon: "📢",
    },
    {
      value: "off-topic",
      label: "ไม่ตรงห้อง",
      description: "เนื้อหาไม่เกี่ยวข้องกับหัวข้อของห้อง",
      icon: "📌",
    },
    {
      value: "inappropriate",
      label: "เนื้อหาไม่เหมาะสม",
      description: "ภาษาไม่สุภาพ เนื้อหาลามก หรือก้าวร้าว",
      icon: "⚠️",
    },
    {
      value: "harassment",
      label: "กลั่นแกล้ง / ละเมิด",
      description: "การกลั่นแกล้ง คุกคาม หรือโจมตีส่วนตัว",
      icon: "🚫",
    },
    {
      value: "misinformation",
      label: "ข้อมูลเท็จ",
      description: "ข้อมูลปลอม หรือบิดเบือนข้อเท็จจริง",
      icon: "❌",
    },
    {
      value: "illegal",
      label: "ผิดกฎหมาย",
      description: "เนื้อหาที่ผิดกฎหมายหรือส่งเสริมกิจกรรมผิดกฎหมาย",
      icon: "⚖️",
    },
    {
      value: "other",
      label: "อื่นๆ",
      description: "เหตุผลอื่นๆ ที่ไม่ระบุไว้ด้านบน",
      icon: "📝",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setSelectedReason("");
      setEvidence("");
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

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        eventId,
        eventType,
        reason: selectedReason,
        evidence: evidence.trim() || null,
      });
      // Reset form after successful submission
      setSelectedReason("");
      setEvidence("");
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-error to-error-container px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚩</span>
              <div>
                <h2
                  id="report-modal-title"
                  className="text-xl font-bold text-white"
                >
                  รายงานเนื้อหา
                </h2>
                <p className="text-white/90 text-sm">
                  แจ้งเนื้อหาที่ไม่เหมาะสมให้เราทราบ
                </p>
              </div>
            </div>
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
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Reason Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-on-surface mb-3">
              เลือกเหตุผลในการรายงาน
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedReason === reason.value
                      ? "border-error bg-error-container/10"
                      : "border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container-high"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">
                      {reason.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-on-surface">
                        {reason.label}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {reason.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Input */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-on-surface mb-2">
              รายละเอียดเพิ่มเติม (ไม่บังคับ)
            </h3>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="อธิบายเพิ่มเติมเกี่ยวกับปัญหาที่พบ..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/30 rounded-lg text-on-surface placeholder-secondary text-sm focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error transition-all resize-none"
            />
            <div className="text-xs text-secondary mt-1 text-right">
              {evidence.length}/500 ตัวอักษร
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                การรายงานเท็จหรือรายงานในทางที่ผิดอาจส่งผลให้บัญชีของคุณถูกจำกัดการใช้งาน
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/20 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-secondary font-semibold border border-outline-variant/30 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedReason && !isSubmitting
                  ? "bg-error text-white hover:bg-error-container shadow-lg hover:shadow-xl"
                  : "bg-surface-container-high text-secondary cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    flag
                  </span>
                  ส่งรายงาน
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
