/**
 * AuthBackground Component - Geometric Pattern Background
 */

export function AuthBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern 
          id="geometric-pattern" 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          patternUnits="userSpaceOnUse"
        >
          <path 
            d="M 0 50 L 25 0 L 75 0 L 100 50 L 75 100 L 25 100 Z" 
            fill="black" 
            opacity="0.04" 
          />
          <path 
            d="M 25 0 L 50 50 L 25 100" 
            stroke="black" 
            strokeWidth="1" 
            opacity="0.04" 
            fill="none" 
          />
          <path 
            d="M 75 0 L 50 50 L 75 100" 
            stroke="black" 
            strokeWidth="1" 
            opacity="0.04" 
            fill="none" 
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
    </svg>
  );
}
