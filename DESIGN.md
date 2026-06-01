# DESIGN.md — frikkinwave visual system

**Direction: "Late-night studio."** Dark, near-black canvas with electric teal +
violet glow, waveform/EQ motifs, glassy neon cards. The product should *feel*
like music software, not a generic SaaS dashboard.

## Palette (Tailwind tokens in `tailwind.config.js`)

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0a0a0f` | page canvas |
| `ink-900` | `#111119` | panels / cards |
| `ink-800` | `#1a1a26` | raised surfaces, inputs-on-card |
| `ink-700` | `#262636` | borders, idle waveform |
| `ink-600` | `#3a3a4f` | hairline borders, idle EQ bars |
| `wave-400/500/600` | teal | primary actions, "on-air"/available |
| `glow-400/500` | violet | instruments, secondary accents |

- **Signature gradient:** teal→violet diagonal — hero accents + primary buttons only.
- **Genre hues** (`src/lib/genreColors.js`): families map to colors (metal=crimson,
  jazz/blues/soul=amber, electronic=violet, folk/world=green, rock/indie/pop=teal,
  classical/fusion=fuchsia); unknowns hash to a stable hue. Used for chip color and
  the card's left accent rail.
- **Glow discipline:** at most one glowing element per card. Neon is seasoning.

## Typography

- **Display** (`font-display` → Space Grotesk): logo, headings, handles, big numbers.
- **Body/UI** (`font-sans` → Inter): everything else.

## Signature components

- **`EqMeter`** — 3-bar mixer meter for instrument proficiency (1=beginner,
  2=intermediate, 3=advanced) in violet. Replaces the text proficiency label.
- **`OnAir`** — availability as a pulsing teal "on-air" dot (`is_available`), not a
  gray chip. `motion-safe` ping animation.
- **`Waveform`** — decorative SVG waveform strip (card footers, dividers). Tints from
  `ink-700` → `wave-500/50` on card hover.
- **Glassy neon card** (`.card`) — `ink-900/60` + `backdrop-blur` + hairline border;
  on hover: lift, border lights teal, `shadow-glow-teal`. Genre color as a left rail.
- **Buttons** — `.btn-primary` is the teal→violet gradient with a hover glow;
  `.btn-ghost` is a hairline border that lights teal.

## Motion

EQ/waveform tint on hover, card lift+glow, on-air pulse, route fades. **All motion is
gated** behind `prefers-reduced-motion` (`motion-safe:` variants / media query).

## Per-page application

- **Discover** — spotlight hero (gradient blobs + `font-display` headline, gradient
  word "jam partner"); filters as a compact strip; card grid with hover waveform.
  Future: map toggle (geo discovery).
- **Public profile** — handle in `font-display`, `OnAir`, `EqMeter` instrument rows,
  color-coded genre chips, waveform footer; sticky Contact on mobile.
- **Requests** — inbox/thread feel; status as stage cues; "unlock" reveal for email.
- **Onboarding (future)** — "tune your profile" stepper with live preview + completeness
  tuner.

## Planned (not yet built)

- **`sound_url` on `MusicianProfile` (Phase 1.5, backend change).** Embed
  SoundCloud/Spotify/YouTube on profiles + hover audio preview on cards. Highest-impact
  musician feature; needs a backend field + migration + redeploy — deferred until approved.
- Light-mode variant; auto-generated OG share images for `/u/:username`.
