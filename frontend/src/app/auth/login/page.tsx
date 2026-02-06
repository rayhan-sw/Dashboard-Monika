/**
 * Login Page
 * Route: /auth/login
 */

'use client';

import { AuthLayout } from '../_components';
import { LoginForm } from './_components';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
