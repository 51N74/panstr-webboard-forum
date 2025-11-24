"use client";

import React, { useState } from "react";
import EnhancedZapComponent from "./EnhancedZapComponent";

const ZapButton = ({ targetEvent, recipientPubkey, currentPubkey }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="text-gray-500 hover:text-orange-500 text-sm font-medium flex items-center space-x-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Zap</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <EnhancedZapComponent
                            targetEvent={targetEvent}
                            recipientPubkey={recipientPubkey}
                            currentPubkey={currentPubkey}
                            onZap={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ZapButton;
