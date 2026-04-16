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
      className={`fixed inset-0 z-modal flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-surface border border-surface-border rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="bg-error px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-2xl">flag</span>
              <div>
                <h2
                  id="report-modal-title"
                  className="text-sm font-black uppercase tracking-widest text-white"
                >
                  Report Content
                </h2>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-tight">
                  Help us keep the community safe
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 -mr-2"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-2xl">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface">
          {/* Reason Selection */}
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">
              Select Reason
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedReason === reason.value
                      ? "border-error bg-error/5"
                      : "border-surface-border hover:border-accent/30 bg-surface-muted"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">
                      {reason.icon}
                    </span>
                    <div>
                      <div className={`font-bold text-xs ${selectedReason === reason.value ? 'text-error' : 'text-primary'}`}>
                        {reason.label}
                      </div>
                      <div className="text-[10px] text-secondary mt-0.5 leading-tight">
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
            <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">
              Additional Details (Optional)
            </h3>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe the issue in more detail..."
              rows={3}
              maxLength={500}
              className="input bg-surface-muted border-transparent text-primary text-xs focus:ring-1 focus:ring-error focus:border-error transition-all resize-none"
            />
            <div className="text-[9px] text-secondary mt-1 text-right font-bold uppercase">
              {evidence.length}/500 characters
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-warning text-lg">warning</span>
              <p className="text-[10px] text-warning font-bold uppercase leading-tight tracking-tight">
                False reporting may result in account restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 bg-surface-muted border-t border-surface-border flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-outline h-12 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className={`flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2 ${
                selectedReason && !isSubmitting
                  ? "bg-error text-white hover:bg-error/90 shadow-lg"
                  : "bg-surface-border text-secondary cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    flag
                  </span>
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
