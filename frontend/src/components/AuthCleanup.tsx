'use client';

import { useEffect } from 'react';

/**
 * AuthCleanup Component
 * Auto-cleanup old token from localStorage (from old implementation)
 * This component runs once on app initialization
 */
export default function AuthCleanup() {
  useEffect(() => {
    // Remove old token from localStorage if exists
    if (typeof window !== 'undefined') {
      const oldToken = localStorage.getItem('token');
      if (oldToken) {
        console.log('[Auth] Cleaning up old token from localStorage');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // This component renders nothing
  return null;
}
