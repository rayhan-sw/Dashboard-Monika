/**
 * AuthLayout Component - Shared Layout for Auth Pages
 * Provides consistent layout structure across all auth pages
 */

import React from 'react';
import { AuthBackground } from './AuthBackground';
import { AuthFooter } from './AuthFooter';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AuthLayout({ children, title = 'Selamat Datang!' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <AuthBackground />

      {/* Main Container - Centered with flex-1 */}
      <div className="relative z-10 w-full max-w-[885px] mx-auto flex-1 flex flex-col justify-center">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#FEB800] to-[#E27200] bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        {/* Glassmorphism Container */}
        <div className="bg-[#D1D1D6]/35 backdrop-blur-sm rounded-[48px] shadow-md p-8 md:p-12">
          {children}
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
