/**
 * AuthAlert Component - Error and Success Messages
 */

interface AuthAlertProps {
  type: 'error' | 'success';
  message: string;
}

export function AuthAlert({ type, message }: AuthAlertProps) {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-600',
    success: 'bg-green-50 border-green-200 text-green-600',
  };

  return (
    <div className={`border px-4 py-3 rounded-lg text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}
