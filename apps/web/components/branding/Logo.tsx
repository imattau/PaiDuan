export default function Logo({ width = 280, height = 60 }: { width?: number; height?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 280 60" aria-label="PaiDuan logo" role="img">
      <defs>
        <linearGradient id="pd-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a11cb" />
          <stop offset="100%" stopColor="#2575fc" />
        </linearGradient>
      </defs>

      {/* Icon: relay nodes */}
      <circle cx="30" cy="30" r="12" fill="url(#pd-grad)" />
      <circle cx="15" cy="15" r="4" fill="#fff"/>
      <circle cx="45" cy="15" r="4" fill="#fff"/>
      <circle cx="15" cy="45" r="4" fill="#fff"/>
      <circle cx="45" cy="45" r="4" fill="#fff"/>
      <line x1="15" y1="15" x2="45" y2="15" stroke="#fff" strokeWidth="2"/>
      <line x1="15" y1="45" x2="45" y2="45" stroke="#fff" strokeWidth="2"/>
      <line x1="15" y1="15" x2="15" y2="45" stroke="#fff" strokeWidth="2"/>
      <line x1="45" y1="15" x2="45" y2="45" stroke="#fff" strokeWidth="2"/>

      {/* Wordmark */}
      <text x="70" y="40" fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize="32" fontWeight={700} fill="url(#pd-grad)">
        PaiDuan
      </text>
    </svg>
  );
}
