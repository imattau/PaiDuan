export default function HeroArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hero illustration">
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a11cb" />
          <stop offset="100%" stopColor="#2575fc" />
        </linearGradient>
      </defs>
      <rect width="1440" height="400" fill="currentColor" opacity="0.04" />
      <g transform="skewX(-10) translate(-100,0)">
        <rect x="100" y="50"  width="220" height="140" rx="8" fill="url(#heroGrad)" opacity="0.9"/>
        <rect x="360" y="50"  width="220" height="140" rx="8" fill="currentColor" opacity="0.08"/>
        <rect x="620" y="50"  width="220" height="140" rx="8" fill="currentColor" opacity="0.08"/>
        <rect x="100" y="220" width="220" height="140" rx="8" fill="currentColor" opacity="0.08"/>
        <rect x="360" y="220" width="220" height="140" rx="8" fill="url(#heroGrad)" opacity="0.9"/>
        <rect x="620" y="220" width="220" height="140" rx="8" fill="currentColor" opacity="0.08"/>
      </g>
      <ellipse cx="720" cy="200" rx="600" ry="200" fill="url(#heroGrad)" opacity="0.15"/>
    </svg>
  );
}
