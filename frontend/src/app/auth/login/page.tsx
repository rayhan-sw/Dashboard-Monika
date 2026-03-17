/**
 * Login Page
 * Route: /auth/login
 */

'use client';

import { Suspense } from 'react';
import { AuthLayout } from '../_components';
import { LoginForm } from './_components';

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
