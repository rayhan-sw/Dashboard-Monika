/**
 * AuthInput Component - Reusable Input Field
 * Mendukung toggle show/hide password dan pesan error inline.
 */

import { LucideIcon } from 'lucide-react';

interface AuthInputProps {
  id: string;
  name: string;
  type: 'text' | 'password' | 'email';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
}

export function AuthInput({
  id,
  name,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = true,
  disabled = false,
  error,
  rightElement,
}: AuthInputProps) {
  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]">
          <Icon size={20} />
        </div>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full h-[63px] pl-12 bg-white border rounded-lg text-gray-900 placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed ${
            rightElement ? 'pr-12' : 'pr-4'
          } ${error ? 'border-red-500' : 'border-[#AEAEB2]'}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
