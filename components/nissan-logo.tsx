export function NissanLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nissan Circle Badge */}
      <circle cx="25" cy="25" r="23" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="5" y="21" width="40" height="8" fill="currentColor" />
      <text
        x="25"
        y="28"
        textAnchor="middle"
        fill="white"
        fontSize="7"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        NISSAN
      </text>
      
      {/* Nissan Text */}
      <text
        x="60"
        y="32"
        fill="currentColor"
        fontSize="24"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
      >
        NISSAN
      </text>
    </svg>
  )
}
