/**
 * Forgot Password Page
 * Route: /auth/forgot-password
 */

'use client';

import { AuthLayout } from '../_components';
import { ForgotPasswordForm } from './_components';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
