import orvexaIcon from '../../assets/brand/orvexa-icon.png';
import orvexaLockup from '../../assets/brand/orvexa-lockup.png';

/**
 * ORVEXA brand mark.
 * -----------------------------------------------------------------
 * Single source of truth for the logo so every surface (landing page,
 * login screen, sidebar, careers pages) renders the exact same asset
 * instead of ad-hoc text/badges. Backed by the real brand artwork in
 * src/assets/brand/ - never re-draw the mark in SVG/CSS.
 *
 * Usage:
 *   <Logo />                                  // icon + wordmark lockup
 *   <Logo tone="onDark" />                    // same lockup, on a white
 *                                              // chip so it reads cleanly
 *                                              // on the indigo gradient
 *   <Logo variant="mark" size={32} />         // icon only, e.g. sidebar
 *   <Logo tagline="Careers" />                 // lockup + small suffix label
 *
 * Note: source art currently ships on a white/transparent field with no
 * dedicated all-white "onDark" cut. Until design provides one, onDark
 * wraps the color lockup in a soft white chip rather than losing contrast
 * against the gradient panels.
 */
export default function Logo({
  variant = 'full', // 'full' | 'mark'
  tone = 'onLight', // 'onLight' | 'onDark'
  size = 36,
  tagline,
  className = '',
  wordmarkSize,
}) {
  const isOnDark = tone === 'onDark';
  const src = variant === 'mark' ? orvexaIcon : orvexaLockup;
  // Lockup art is wider than tall (~1.6:1); icon art is square.
  const aspect = variant === 'mark' ? 1 : 779 / 486;
  const height = variant === 'mark' ? size : Math.round(size * 1.15);
  const width = Math.round(height * aspect);

  const mark = (
    <img
      src={src}
      alt="ORVEXA"
      width={width}
      height={height}
      style={{ display: 'block', width, height, objectFit: 'contain' }}
    />
  );

  return (
    <span className={`d-inline-flex align-items-center gap-2 ${className}`} style={{ lineHeight: 1 }}>
      {isOnDark ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: variant === 'mark' ? '999px' : 12,
            padding: variant === 'mark' ? 4 : '6px 12px',
            boxShadow: '0 1px 2px rgba(15,23,42,0.12)',
          }}
        >
          {mark}
        </span>
      ) : (
        mark
      )}

      {tagline && (
        <span
          style={{
            fontFamily: 'var(--hz-font-display, var(--hz-font-sans))',
            fontSize: wordmarkSize || 'var(--hz-text-sm)',
            fontWeight: 500,
            color: isOnDark ? 'rgba(255,255,255,0.85)' : 'var(--hz-text-muted)',
            paddingLeft: 10,
            borderLeft: `1px solid ${isOnDark ? 'rgba(255,255,255,0.35)' : 'var(--hz-border)'}`,
          }}
        >
          {tagline}
        </span>
      )}
    </span>
  );
}
