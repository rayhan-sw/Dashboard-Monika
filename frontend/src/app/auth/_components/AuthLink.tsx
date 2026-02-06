/**
 * AuthLink Component - Navigation Links
 */

import Link from 'next/link';

interface AuthLinkProps {
  href: string;
  text: string;
  prefix?: string;
}

export function AuthLink({ href, text, prefix }: AuthLinkProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-black">
        {prefix && <>{prefix} </>}
        <Link
          href={href}
          className="text-[#FE9A00] hover:text-[#E27200] font-semibold underline transition-colors"
        >
          {text}
        </Link>
      </p>
    </div>
  );
}
