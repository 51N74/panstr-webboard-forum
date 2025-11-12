"use client";

import React, { useState, useEffect } from "react";
import db, { liveNotifications } from "../lib/storage/indexedDB";

// Test component to verify liveQuery fix
export default function LiveQueryTest() {
  const [testResult, setTestResult] = useState("Testing...");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    console.log("Testing liveQuery function...");

    try {
      const liveNotificationsFunc = liveNotifications("test-user-id");
      console.log("liveNotifications function:", liveNotificationsFunc);
      console.log("typeof liveNotifications:", typeof liveNotificationsFunc);

      if (typeof liveNotificationsFunc === 'function') {
        setTestResult("Function type: OK");
      } else if (liveNotificationsFunc && typeof liveNotificationsFunc.subscribe === 'function') {
        setTestResult("subscribe method exists: OK");

        // Test subscription
        const unsubscribe = liveNotificationsFunc.subscribe((data) => {
          console.log("Received notification data:", data);
          setNotifications(data || []);
        });

        setTestResult("Subscription successful: OK");

        // Test cleanup
        setTimeout(() => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
            setTestResult("Unsubscribe successful: OK");
          } else {
            setTestResult("Unsubscribe failed: " + typeof unsubscribe);
          }
        }, 3000);

      } else {
        setTestResult("ERROR: No subscribe method found");
        console.error("liveNotifications structure:", liveNotificationsFunc);
      }

    } catch (error) {
      console.error("Test error:", error);
      setTestResult("ERROR: " + error.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">LiveQuery Fix Verification</h1>

        <div className="space-y-4">
          <div className="bg-base-100 rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-2">Test Result</h2>
            <p className={`text-lg ${testResult.includes("OK") ? "text-success" : testResult.includes("ERROR") ? "text-error" : "text-warning"}`}>
              {testResult}
            </p>
          </div>

          <div className="bg-base-100 rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-2">Notifications Data</h2>
            <div className="text-sm text-base-content/70">
              {JSON.stringify(notifications, null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
