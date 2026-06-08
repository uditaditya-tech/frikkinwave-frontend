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
  on hover (`.card-interactive`): lift, border lights teal, `shadow-glow-teal`. A
  left **accent rail** carries the entity's color (see below).
- **Feed cards** — `ProfileCard` (genre-hued rail), `ListingCard` (rail + chip by
  listing type — gig=teal, audition=violet, venue=amber), `BandCard` (violet rail),
  `VenueCard` (amber rail). All link to a slug/username detail page.
- **Glow-accent panel** — `card` + `border-glow-500/30 bg-glow-500/5`: the violet-
  tinted call-out used for the AI panels (compatibility, profile coach), the band
  **invite** panel, and the **Hire for a session** form. The one glow per surface.
- **Status chips + reveal** — pending=amber, accepted=teal, completed=violet,
  declined=muted; on accept the masked contact email "unlocks" into a teal box.
  Shared across Requests, Applications, Band invites, and Engagements.
- **Buttons** — `.btn-primary` is the teal→violet gradient with a hover glow;
  `.btn-ghost` is a hairline border that lights teal; `.btn-danger` is a rose
  hairline (take-down / disband / decline).

## Motion

EQ/waveform tint on hover, card lift+glow, on-air pulse, route fades. **All motion is
gated** behind `prefers-reduced-motion` (`motion-safe:` variants / media query).

## Per-page application

- **Discover** — spotlight hero (gradient blobs + `font-display` headline, gradient
  word "jam partner"); a natural-language **semantic search** bar that flips the feed
  into a results mode (cards carry a violet **% match** badge); filters as a compact
  strip (incl. availability + session-work toggles); card grid with hover waveform.
- **Public profile** — handle in `font-display`, `OnAir`, `EqMeter` instrument rows,
  color-coded genre chips, embedded `SoundEmbed` track player, waveform footer. A
  **rating badge** (★ average · count) and **follower / following counts** sit in the
  header; signed-in non-self viewers get a **follow toggle**. Below: the
  **compatibility** glow-panel, a **Hire for a session** glow-panel (when the musician
  is open to session work, with a session-rate chip), the contact-request form, and a
  **reviews** list (star rows + comments).
- **Feed** — a single-column river of follow-graph activity (who posted a listing /
  created a band), newest first, each line linking through to the entity.
- **Profile editor** — the **profile coach** glow-panel up top (completeness meter +
  per-field nudges + LLM tip); instrument rows with `EqMeter` selectors; genre chips;
  the session-work toggle + rate.
- **Board / Bands / Venues** — each a browse header (title + "post/start/list" primary
  action) over a filter card and a feed grid; detail pages lead with the entity, then
  show owner/author controls (edit + take-down/disband) and the apply/invite affordance.
  Bands show a **lineup** (owner chip + accepted-member roster).
- **Inboxes** (Requests, Applications, Band invites, Engagements) — shared incoming/
  outgoing toggle, status-chip rows, accept/decline (and "mark complete" for
  engagements), and the unlock-on-accept email reveal.

## Planned (not yet built)

- **Phase 5 — social layer**: follow graph, activity feed, and ratings & reviews are
  **shipped** (reusing existing chips/cards + a simple star row — no new primitives).
  Only **Block D, real-time messaging** (Django Channels) remains — the inbox/reveal
  pattern likely graduates into real threads.
- Light-mode variant; auto-generated OG share images for `/u/:username`; map toggle
  on Discover (geo discovery).
