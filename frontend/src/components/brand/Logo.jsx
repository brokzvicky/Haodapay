/**
 * HaodaOne brand mark.
 * -----------------------------------------------------------------
 * A single source of truth for the logo so every surface (landing page,
 * login screen, app sidebar, careers pages) renders the exact same mark
 * instead of ad-hoc "H1" badges. The mark is a monogram: two pillars and
 * a crossbar read as an "H", and the small accent node standing on the
 * right pillar stands for the "One" - a single person represented within
 * the platform.
 *
 * Usage:
 *   <Logo />                                  // color mark + wordmark
 *   <Logo tone="onDark" />                    // for dark/gradient backgrounds
 *   <Logo variant="mark" size={32} />         // icon only, e.g. sidebar
 *   <Logo tagline="Careers" />                // wordmark + small suffix
 */
export default function Logo({
  variant = 'full', // 'full' | 'mark'
  tone = 'onLight', // 'onLight' | 'onDark'
  size = 36,
  tagline,
  className = '',
  wordmarkSize,
}) {
  const gradientId = `hz-logo-grad-${tone}`;
  const isOnDark = tone === 'onDark';

  return (
    <span className={`d-inline-flex align-items-center gap-2 ${className}`} style={{ lineHeight: 1 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
        </defs>

        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill={isOnDark ? 'rgba(255,255,255,0.14)' : `url(#${gradientId})`}
          stroke={isOnDark ? 'rgba(255,255,255,0.28)' : 'none'}
          strokeWidth={isOnDark ? 1 : 0}
        />

        {/* "H" monogram - left pillar, right pillar, crossbar */}
        <rect x="10.5" y="10" width="5" height="20" rx="2.5" fill="#ffffff" fillOpacity={isOnDark ? 0.95 : 1} />
        <rect x="24.5" y="10" width="5" height="20" rx="2.5" fill="#ffffff" fillOpacity={isOnDark ? 0.95 : 1} />
        <rect x="10.5" y="17.5" width="19" height="5" rx="2.5" fill="#ffffff" fillOpacity={isOnDark ? 0.95 : 1} />

        {/* Accent node - "One" */}
        <circle cx="27" cy="10.5" r="4.25" fill="#0d9488" stroke={isOnDark ? '#1e1b4b' : '#3730a3'} strokeOpacity={0.25} strokeWidth="1" />
      </svg>

      {variant === 'full' && (
        <span className="d-inline-flex align-items-baseline gap-2">
          <span
            style={{
              fontFamily: 'var(--hz-font-display, var(--hz-font-sans))',
              fontWeight: 700,
              fontSize: wordmarkSize || 'var(--hz-text-lg)',
              letterSpacing: '-0.01em',
              color: isOnDark ? '#ffffff' : 'var(--hz-text-primary)',
            }}
          >
            HaodaOne
          </span>
          {tagline && (
            <span
              style={{
                fontSize: 'var(--hz-text-sm)',
                fontWeight: 500,
                color: isOnDark ? 'rgba(255,255,255,0.7)' : 'var(--hz-text-muted)',
                paddingLeft: 8,
                borderLeft: `1px solid ${isOnDark ? 'rgba(255,255,255,0.25)' : 'var(--hz-border)'}`,
              }}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
