# ORVEXA Brand Identity

Quick reference for the public-facing brand. The in-app product design system
lives in `tokens.css`; this file documents how those same tokens extend into
marketing surfaces (landing page, careers pages, favicon).

## Logo

`src/components/brand/Logo.jsx` is the single source of truth - never hardcode
a text badge or re-draw the mark in SVG/CSS. It renders the real brand
artwork, which lives in two places by convention:

- **`src/assets/brand/`** - master files that get *imported into components*
  (`orvexa-icon.png`, `orvexa-lockup.png`, `orvexa-full-tagline.png`).
  Vite bundles, hashes, and optimizes anything imported this way, so this is
  where the source-of-truth art belongs.
- **`public/`** - static files referenced *by URL*, not imported: favicons
  (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `android-chrome-192/512.png`) plus
  `orvexa-logo-full.png` for things like `index.html` meta tags, the
  manifest, and OG/share images. Files here are copied as-is at build time
  and keep a stable, predictable path.

Component API:

- `<Logo />` - icon + wordmark lockup, color, for light backgrounds.
- `<Logo tone="onDark" />` - same lockup on a soft white chip, for the
  indigo gradient hero / login panel (source art has no dedicated
  all-white cut yet - see note below).
- `<Logo variant="mark" size={32} />` - icon-only, e.g. sidebar, favicon.
- `<Logo tagline="Careers" />` - lockup with a small suffix label.

**Open item:** the current PNGs come from the design mockups and sit on a
white/transparent field. For a fully premium finish, ask the designer for:
1. A true transparent-background SVG (crisp at any size, no PNG halo).
2. A dedicated all-white / reversed mark for dark and colored surfaces.
Once those exist, drop them into `src/assets/brand/` alongside the current
files and swap the imports in `Logo.jsx` - no call sites need to change.

## Color

Brand colors are defined once in `tokens.css` and reused everywhere:

| Role | Token | Hex |
|---|---|---|
| Primary (indigo) | `--hz-primary-600` | `#4f46e5` |
| Primary deep | `--hz-primary-800` | `#3730a3` |
| Accent (teal) | `--hz-accent-500` | `#0ea5a4` |
| Ink | `--hz-gray-900` | `#0f172a` |
| Canvas | `--hz-gray-50` | `#f8fafc` |

The signature gradient (`--hz-primary-800` → `--hz-primary-600` →
`--hz-accent-600`) is used sparingly, for high-impact surfaces only: the hero
section, the login brand panel, and the logo mark itself. Everywhere else
stays on the quiet neutral palette so the gradient keeps its impact.

## Typography

- **Display** (`--hz-font-display`, defined in `landing.css`): *Space
  Grotesk* - used only for large marketing headlines (hero, section titles).
  Chosen for a technical, structured character that fits a workforce
  platform without tipping into a generic "startup" look.
- **Body / UI** (`--hz-font-sans`): *Inter* - every paragraph, label, nav
  item, and the entire authenticated product.

Both are loaded via the `@import` at the top of `landing.css`. If the app
later adds a build-time font pipeline, swap that `@import` for self-hosted
files - nothing else needs to change.

## Iconography

Lucide icons only (`lucide-react`), 1.5-2px stroke, no filled icons. This
keeps the marketing site visually identical to the authenticated product
instead of importing a second icon set just for marketing pages.

## Voice

Direct, specific, no hype adjectives ("revolutionary", "game-changing").
Describe what the product does for the person using it, the same register
already established on the login screen's brand panel.
