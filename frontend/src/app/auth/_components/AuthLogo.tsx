/**
 * AuthLogo Component - MONIKA Logo with Tagline
 */

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <img
        src="/images/logo-monika.svg"
        alt="Logo MONIKA"
        className="w-auto h-20 md:h-24 object-contain"
      />
    </div>
  );
}
