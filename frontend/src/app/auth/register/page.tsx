/**
 * Register Page
 * Route: /auth/register
 */

'use client';

import { AuthLayout } from '../_components';
import { RegisterForm } from './_components';

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
