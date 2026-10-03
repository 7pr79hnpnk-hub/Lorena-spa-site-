# Design System: LORENSA — בוטיק ספא ראש והילינג

## 1. Visual Theme & Atmosphere

A cinematic, after-dark boutique: obsidian-espresso canvas, warm gold light, and photography that feels
like it was shot by candlelight. The page behaves like a quiet product launch where **the brand mark
is the product**. The hero shows a real-time 3D gold wordmark beneath a golden head-spa halo, with
water threads falling through the letters, beside a full-bleed treatment photograph.

- **Density:** 3 / 10 — art-gallery airy. Sections breathe at `clamp(104px, 13vw, 208px)`.
- **Variance:** 7 / 10 — offset editorial compositions; RTL start-aligned, never a centered hero.
- **Motion:** 6 / 10 — fluid and weighty. One ambient 3D moment, scroll-scrubbed type, spring buttons.
  No element animates "just because".

Archetypes: **Editorial Luxury** vibe × **Editorial Split** layout, with one **light paper tile**
(the Academy) breaking the dark rhythm, the same way the brand alternates its black-gold and
ivory logo variants.

## 2. Color Palette & Roles

| Token | Hex | Role |
|---|---|---|
| **Obsidian Espresso** `--bg` | `#0b0907` | Page canvas (never pure black) |
| **Espresso Tile** `--bg-2` | `#100d0a` | Alternating dark tiles (Ritual, FAQ, footer) |
| **Ember Surface** `--surface` | `#1b1612` | Inline media wells, raised surfaces |
| **Warm Ivory Ink** `--text` | `#f4ede1` | Primary text on dark |
| **Sand** `--text-2` | `#c9bda9` | Body and lead copy |
| **Dune** `--text-3` | `#8f8473` | Meta, captions, legal |
| **Lorensa Gold** `--gold` | `#e6bd6a` | The single accent: eyebrows, numerals, CTAs, focus ring, LED rails |
| **Gold Highlight** `--gold-hi` | `#f7dda2` | Specular highlights, hover text |
| **Antique Gold** `--gold-lo` | `#b88c45` | Gold on the light Academy tile |
| **Champagne** `--champagne` | `#d9c39b` | Lower half of the logo gradient |
| **Gold Hairline** `--line` | `rgba(232,200,140,.13)` | Dividers and bezel borders |
| **Academy Paper** `--ivory` | `#eeeae2` | The one light tile (brand light variant) |
| **Paper Ink** `--ink` | `#241f19` | Text on Academy Paper |

**Logo gradient** (text and 3D vertex tint): `#f5cb63 → #ecc570 → #dcc497`, rich gold on top,
champagne below, the same as the printed LORENSA logo.

Rules: one accent only. No neon, no purple/blue glows, no rainbow gradients. Gold glows are soft and
low-alpha, used only on light sources (LED beads, active nodes, primary CTA).

## 3. Typography Rules

- **Hebrew display:** *Frank Ruhl Libre* (variable, 300–400). Light weights at large sizes, tracking
  `-0.012em`, line-height `1.02–1.1`. Hierarchy comes from size and weight, never from shouting.
- **Hebrew body / UI:** *Assistant* (variable). 17px body, line-height `1.65`, max ~36em.
- **Latin wordmark & numerals:** *Cormorant Garamond* 500/600, uppercase, tracking `0.32em` for
  the wordmark. Numerals always use `lining-nums`.
- **Scale:** display `clamp(2.7rem → 5.8rem)`, statement `clamp(1.9rem → 3.3rem)`,
  manifesto `clamp(1.75rem → 3.25rem)`, title `clamp(1.45rem → 2.25rem)`, lead `clamp(1.08rem → 1.3rem)`.
- **Eyebrows:** Assistant 600, `0.8rem`, tracking `0.14em`, gold, preceded by a 28px gold hairline.
- **Banned:** Inter, Roboto, Arial, Open Sans, Helvetica, Times/Georgia-style generic serifs.

## 4. Component Stylings

- **Buttons:** fully rounded pills (`999px`). The trailing icon always sits in its own nested circle
  ("button-in-button"). Gold primary uses a metallic vertical fill with an inner top highlight.
  Active state `scale(.97)`, hover nudges the icon diagonally. On fine pointers, buttons are
  magnetic (max 10px pull).
- **Navigation:** a floating glass island detached from the top (`16px`), blur 18px, gold hairline
  ring. On mobile it becomes brand + CTA + a two-line toggle that morphs into an X, opening a
  full-screen blurred menu with a staggered mask-up reveal.
- **Media frames ("double bezel"):** outer tray (`34px` radius, `7px` padding, gold hairline) and
  an inner core with a concentric `27px` radius and an inset top highlight.
- **Service picker:** hairline-separated rows (number · title · duration). The active row grows a
  gold rule from the start edge and expands via `grid-template-rows: 0fr → 1fr`.
- **Golden halo stage (Ritual):** an SVG ring whose arc fills with scroll; five nodes light up
  one per step, with falling-water threads inside.
- **Gift card:** a 3D tilting foil card (`preserve-3d`), with layered `translateZ` typography and a
  pointer-tracked glare.
- **Accordion:** hairline rows, a plus icon that rotates 45° into an ×, height animated with grid rows.
- **Loaders:** none. The gold DOM wordmark is the instant first paint and cross-fades into the 3D one.

## 5. Layout Principles

- 12-column grid inside a `1400px` container with fluid gutters `clamp(20px, 4.4vw, 72px)`.
- RTL-native: logical properties only (`inline-start/end`, `block-start/end`). Copy anchors to the
  start (right), and media sits at the end (left).
- Rhythm: dark hero → dark manifesto → treatments → espresso ritual tile → full-bleed space photo →
  **ivory academy** → dark gift → espresso FAQ → glowing contact → footer.
- Full-height sections use `svh` / `dvh`, never `100vh` for content height.
- Below 768px, everything collapses to a single column. The ritual's sticky halo is replaced by a
  vertical rail with glowing step dots.

## 6. Motion & Interaction

- **Easing:** `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-spring: cubic-bezier(.32,.72,0,1)`,
  `--ease-silk: cubic-bezier(.65,.05,.36,1)`. No `linear` and no default `ease-in-out`
  (continuous rotations excepted).
- **Smooth scroll:** Lenis (lerp .09), driven by the GSAP ticker so ScrollTrigger reads the same frame.
- **Entry:** `[data-reveal]` fade-up 40px + 6px blur over 1.2s, staggered 90ms (IntersectionObserver).
- **Scrub:** the manifesto lights up word by word; the halo ring fills with Ritual progress; the space
  photo settles from 1.18× to 1×.
- **Side LEDs:** fixed 1px rails at both edges; a glowing bead travels with page progress and dims to
  bronze over the light tile.
- **3D hero:** letters rise through a clipping plane (staggered), the halo eases in, and water
  threads grow downward. The pointer leans the mark, slides the reflections, and lifts the nearest
  letters. On scroll the mark tilts back and lingers.
- **Performance:** transform/opacity only; blur only on fixed layers; the WebGL loop runs only while
  the hero is visible. A quality governor lowers the pixel ratio, then freezes ambient motion, on
  slow GPUs. `prefers-reduced-motion` disables smooth scroll, scrubs and the 3D intro.

## 7. Anti-Patterns (Banned)

- No emojis, no Inter, no generic serifs, no pure black `#000`.
- No neon glows, no purple/blue AI gradients, no second accent color.
- No centered hero, no three-equal-cards rows, no cards-inside-cards.
- No "scroll to explore" text, bouncing chevrons or custom cursors.
- No fake statistics, no fabricated testimonials, no invented prices.
- No AI copy clichés ("elevate", "seamless", "unleash", "next-gen").
- No `100vh` content blocks, no layout-property animation, no scroll-event listeners for reveals.
