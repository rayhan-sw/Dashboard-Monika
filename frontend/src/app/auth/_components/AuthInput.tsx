/**
 * AuthInput Component - Reusable Input Field
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
}: AuthInputProps) {
  return (
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
        className="w-full h-[63px] pl-12 pr-4 bg-white border border-[#AEAEB2] rounded-lg text-gray-900 placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
