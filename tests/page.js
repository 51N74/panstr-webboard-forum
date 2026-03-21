// test-fixes/page.js
"use client";

import React, { useState, useEffect } from "react";
import { liveNotifications } from "../lib/storage/indexedDB";

export default function TestPage() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log("=== LIVEQUERY DEBUG TEST ===");

    try {
      const userId = "test-user-123";

      // Test 1: Check function type
      const notificationsFunc = liveNotifications(userId);
      console.log("1. liveNotifications function:", notificationsFunc);
      console.log("2. Type:", typeof notificationsFunc);

      if (typeof notificationsFunc === 'object' && notificationsFunc !== null) {
        console.log("3. Function keys:", Object.keys(notificationsFunc));
        console.log("4. Has subscribe:", 'subscribe' in notificationsFunc);
        console.log("5. Subscribe type:", typeof notificationsFunc.subscribe);

        if (typeof notificationsFunc.subscribe === 'function') {
          console.log("6. Subscribe method found - attempting subscription...");

          const unsubscribe = notificationsFunc.subscribe((data) => {
            console.log("7. Subscription data received:", data);
            setDebugInfo(prev => ({
              ...prev,
              subscriptionStatus: "SUCCESS - Data received",
              subscriptionData: data
            }));
          });

          console.log("8. Unsubscribe function:", unsubscribe);
          console.log("9. Unsubscribe type:", typeof unsubscribe);

          // Test unsubscribe after 3 seconds
          setTimeout(() => {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
              setDebugInfo(prev => ({
                ...prev,
                unsubscribeStatus: "SUCCESS - Unsubscribed"
              }));
            } else {
              setDebugInfo(prev => ({
                ...prev,
                unsubscribeStatus: "FAILED - Unsubscribe is not a function"
              }));
            }
          }, 3000);

        } else {
          setDebugInfo(prev => ({
            ...prev,
            subscriptionStatus: "FAILED - Subscribe is not a function"
          }));
        }
      } else {
        setDebugInfo(prev => ({
          ...prev,
          subscriptionStatus: "FAILED - Function is not an object with subscribe method"
        }));
      }

    } catch (error) {
      console.error("DEBUG ERROR:", error);
      setDebugInfo(prev => ({
        ...prev,
        subscriptionStatus: "ERROR - " + error.message
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">LiveQuery Debug Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <div className="space-y-3">
              <div>
                <strong>Function Type:</strong> {typeof debugInfo.notificationsFunc}
              </div>
              <div>
                <strong>Has Subscribe Method:</strong> {debugInfo.hasSubscribe ? "Yes" : "No"}
              </div>
              <div>
                <strong>Subscription Status:</strong>
                <span className={`px-2 py-1 rounded ${
                  debugInfo.subscriptionStatus?.includes("SUCCESS")
                    ? "bg-success text-success-content"
                    : debugInfo.subscriptionStatus?.includes("FAILED")
                      ? "bg-error text-error-content"
                      : "bg-warning text-warning-content"
                }`}>
                  {debugInfo.subscriptionStatus || "Testing..."}
                </span>
              </div>
              <div>
                <strong>Unsubscribe Status:</strong>
                <span className={`px-2 py-1 rounded ${
                  debugInfo.unsubscribeStatus?.includes("SUCCESS")
                    ? "bg-success text-success-content"
                    : debugInfo.unsubscribeStatus?.includes("FAILED")
                      ? "bg-error text-error-content"
                      : "bg-warning text-warning-content"
                }`}>
                  {debugInfo.unsubscribeStatus || "Waiting..."}
                </span>
              </div>
            </div>

            {debugInfo.subscriptionData && (
              <div className="mt-4 p-3 bg-base-200 rounded">
                <strong>Sample Data:</strong>
                <pre className="text-xs mt-2 overflow-auto max-h-32">
                  {JSON.stringify(debugInfo.subscriptionData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-base-100 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check browser console for detailed debug output</li>
            <li>Wait for subscription status to update</li>
            <li>Verify unsubscribe function works after 3 seconds</li>
            <li>Check if data is received properly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
