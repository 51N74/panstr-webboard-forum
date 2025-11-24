"use client";

import React, { useState } from "react";

const REACTIONS = [
    { label: "Like", emoji: "👍", icon: "👍" },
    { label: "Love", emoji: "❤️", icon: "❤️" },
    { label: "Haha", emoji: "😂", icon: "😂" },
    { label: "Wow", emoji: "😮", icon: "😮" },
    { label: "Sad", emoji: "😢", icon: "😢" },
    { label: "Angry", emoji: "😡", icon: "😡" },
];

const ReactionPicker = ({ onSelect, currentReaction }) => {
    return (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex items-center space-x-1 animate-fade-in z-50">
            {REACTIONS.map((reaction) => (
                <button
                    key={reaction.label}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(reaction.emoji);
                    }}
                    className={`
            p-2 rounded-full hover:bg-gray-100 hover:scale-125 transition-all duration-200
            ${currentReaction === reaction.emoji ? "bg-blue-50 scale-110" : ""}
          `}
                    title={reaction.label}
                >
                    <span className="text-xl leading-none block">{reaction.icon}</span>
                </button>
            ))}
        </div>
    );
};

export default ReactionPicker;
