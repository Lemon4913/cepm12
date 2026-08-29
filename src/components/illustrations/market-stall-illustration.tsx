export function MarketStallIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* awning frame */}
      <path
        d="M40 70 L100 30 L160 70"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* scalloped valance */}
      <path
        d="M40 70 Q52 90 64 70 Q76 90 88 70 Q100 90 112 70 Q124 90 136 70 Q148 90 160 70"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* posts */}
      <line x1="56" y1="80" x2="56" y2="150" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="144" y1="80" x2="144" y2="150" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* counter */}
      <rect x="52" y="120" width="96" height="32" rx="6" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}
