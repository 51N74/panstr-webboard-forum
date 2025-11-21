/**
 * Admin Page - Enterprise Dashboard
 * Entry point for NIP-86 Relay Management API and Advanced Security Features
 * Phase 4 Week 13-14 Implementation
 */

'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '../components/admin/AdminDashboard';
import { useNostrAuth } from '../context/NostrAuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { userPubkey, privateKey, isAuthenticated } = useNostrAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and authorized for admin access
    const checkAuthorization = async () => {
      try {
        if (!isAuthenticated || !userPubkey) {
          router.push('/login');
          return;
        }

        // In a real implementation, check if user has admin privileges
        // This could be done by checking against an admin list, specific NIP-05 domains, or role-based permissions
        const adminPubkeys = [
          // Add admin public keys here
          // 'your-admin-pubkey-here'
        ];

        // For demo purposes, allow access to authenticated users
        // In production, implement proper authorization checks
        const isAuthorized = adminPubkeys.includes(userPubkey) || process.env.NODE_ENV === 'development';

        if (!isAuthorized) {
          // Show unauthorized message or redirect
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, userPubkey, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin dashboard. This area is restricted to authorized administrators.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminDashboard
        currentPubkey={userPubkey}
        privateKey={privateKey}
      />
    </div>
  );
}
