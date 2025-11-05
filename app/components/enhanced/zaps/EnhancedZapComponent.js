"use client";

import React, { useState, useEffect } from "react";
import {
  createZapRequest,
  verifyZapReceipt,
  createZapGoal,
  calculateZapGoalProgress,
  getZapAnalytics,
  formatPubkey,
} from "../../../lib/nostrClient";

const EnhancedZapComponent = ({
  targetEvent,
  recipientPubkey,
  currentPubkey,
  onZap,
}) => {
  const [amount, setAmount] = useState(1000);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [zapType, setZapType] = useState("public");
  const [splits, setSplits] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [goalData, setGoalData] = useState({
    amount: 100000,
    message: "",
    image: "",
    closed: false,
  });
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("7d");

  useEffect(() => {
    if (showAnalytics && recipientPubkey) {
      loadAnalytics();
    }
  }, [showAnalytics, analyticsTimeframe, recipientPubkey]);

  const loadAnalytics = async () => {
    try {
      const data = await getZapAnalytics(recipientPubkey, analyticsTimeframe);
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading zap analytics:", error);
    }
  };

  const handleZap = async () => {
    try {
      const zapRequest = createZapRequest(
        amount,
        recipientPubkey,
        targetEvent?.id,
        ["wss://relay.damus.io", "wss://nos.lol"],
        message,
        {
          splits,
          anon: isAnonymous,
          zapType,
        },
      );

      if (onZap) {
        await onZap(zapRequest, amount);
      }

      // Reset form
      setMessage("");
      setAmount(1000);
      setIsAnonymous(false);
      setZapType("public");
    } catch (error) {
      console.error("Error sending zap:", error);
    }
  };

  const addSplit = () => {
    setSplits([...splits, { pubkey: "", percentage: 0, relay: "" }]);
  };

  const updateSplit = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const removeSplit = (index) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const createGoal = async () => {
    try {
      const goal = createZapGoal(
        recipientPubkey,
        ["wss://relay.damus.io", "wss://nos.lol"],
        goalData.amount,
        goalData.message,
        {
          closed: goalData.closed,
          image: goalData.image || null,
        },
      );

      // Here you would typically sign and publish the goal event
      console.log("Created zap goal:", goal);
      setShowGoalCreator(false);
      setGoalData({ amount: 100000, message: "", image: "", closed: false });
    } catch (error) {
      console.error("Error creating zap goal:", error);
    }
  };

  const formatSats = (amount) => {
    return new Intl.NumberFormat().format(amount);
  };

  const formatAmount = (amount) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(2)} BTC`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k sats`;
    }
    return `${amount} sats`;
  };

  return (
    <div className="enhanced-zap-component bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Enhanced Zap System
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showAnalytics
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setShowGoalCreator(!showGoalCreator)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showGoalCreator
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Create Goal
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Zap Analytics
            </h3>
            <select
              value={analyticsTimeframe}
              onChange={(e) => setAnalyticsTimeframe(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500">Total Received</div>
              <div className="text-lg font-bold text-green-600">
                {formatAmount(analytics.summary.totalReceived)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500">Total Sent</div>
              <div className="text-lg font-bold text-red-600">
                {formatAmount(analytics.summary.totalSent)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500">Net Amount</div>
              <div
                className={`text-lg font-bold ${analytics.summary.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatAmount(Math.abs(analytics.summary.netAmount))}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500">Unique Zappers</div>
              <div className="text-lg font-bold text-blue-600">
                {analytics.summary.totalZappers}
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          {analytics.goals.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Zap Goals Progress
              </h4>
              <div className="space-y-2">
                {analytics.goals.map((goal, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Goal {index + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          goal.isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {goal.isCompleted
                          ? "Completed"
                          : `${goal.percentage.toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatAmount(goal.currentAmount)}</span>
                      <span>{formatAmount(goal.targetAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal Creator */}
      {showGoalCreator && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create Zap Goal
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Amount (sats)
              </label>
              <input
                type="number"
                value={goalData.amount}
                onChange={(e) =>
                  setGoalData({
                    ...goalData,
                    amount: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Message
              </label>
              <textarea
                value={goalData.message}
                onChange={(e) =>
                  setGoalData({ ...goalData, message: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Describe your funding goal..."
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={goalData.closed}
                  onChange={(e) =>
                    setGoalData({ ...goalData, closed: e.target.checked })
                  }
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Closed goal</span>
              </label>
            </div>
            <button
              onClick={createGoal}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Zap Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zap Amount (sats)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[100, 1000, 10000, 100000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  amount === preset
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formatAmount(preset)}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter custom amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add a message with your zap..."
          />
        </div>

        {/* Zap Options */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Zap Options
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Anonymous zap</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zap Type
              </label>
              <select
                value={zapType}
                onChange={(e) => setZapType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>
          </div>
        </div>

        {/* Zap Splits */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Zap Splits</h4>
            <button
              onClick={addSplit}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Split
            </button>
          </div>

          {splits.length === 0 ? (
            <p className="text-sm text-gray-500">No splits configured</p>
          ) : (
            <div className="space-y-2">
              {splits.map((split, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={split.pubkey}
                    onChange={(e) =>
                      updateSplit(index, "pubkey", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Recipient pubkey"
                  />
                  <input
                    type="number"
                    value={split.percentage}
                    onChange={(e) =>
                      updateSplit(
                        index,
                        "percentage",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="%"
                  />
                  <input
                    type="text"
                    value={split.relay}
                    onChange={(e) =>
                      updateSplit(index, "relay", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Relay (optional)"
                  />
                  <button
                    onClick={() => removeSplit(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zap Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleZap}
            disabled={amount <= 0}
            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Zap {formatAmount(amount)} to {formatPubkey(recipientPubkey)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedZapComponent;
