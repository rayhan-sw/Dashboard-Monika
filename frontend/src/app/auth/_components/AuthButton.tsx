/**
 * AuthButton Component - Submit Button
 */

interface AuthButtonProps {
  type?: 'submit' | 'button';
  isLoading: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function AuthButton({
  type = 'submit',
  isLoading,
  disabled = false,
  loadingText = 'Memproses...',
  children,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className="w-full h-[54px] bg-gradient-to-r from-[#FEB800] to-[#E27200] text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
