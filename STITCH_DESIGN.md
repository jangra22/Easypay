---
name: HealthScan EasyPay
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5a4138'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8f7066'
  outline-variant: '#e3bfb3'
  surface-tint: '#ab3600'
  primary: '#a63500'
  on-primary: '#ffffff'
  primary-container: '#d04400'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59c'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#822700'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
  numeral-currency:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 26px
  numeral-score:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 32px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system drives a hybrid retail companion combining instantaneous barcode checkout with AI-driven nutritional guidance. The experience operates in high-speed, dynamic physical spaces (supermarket aisles, checkout-free gates) where cognitive load must remain near zero while empowering shoppers to make informed wellness choices.

### Brand Personality & Mood
- **Vital & Kinetic:** Swift interactions, immediate feedback loops, and purposeful motion.
- **Authoritative yet Human:** Rigorous nutritional transparency delivered without didactic lecturing; clear health signals paired with calm fintech precision.
- **Physical-Digital Tactility:** Elements emulate the crispness of Apple Health data cards fused with the high-efficiency utility of top-tier on-demand shopping platforms.

### Design Aesthetic: Precision Health-Retail
The aesthetic merges **Modern Functional Minimalism** with **Tactile Glassmorphism**. Surfaces utilize clean paper-like base planes layered with frosted floating panels, crisp micrometric borders, and focused chromatic bursts for health metrics and actionable retail triggers.

## Colors

The palette establishes an immediate distinction between transactional momentum (Sunset Coral) and bio-nutritional state awareness (Tri-color Health Spectrum).

### Color Philosophy
- **Primary (Sunset Coral - `#F35919`):** Represents speed, cart updates, primary checkouts, and barcode capture confirmation. Active state deepens to `#BA3006`, with a soft warm container tint of `#FFF6F3`.
- **Health System (Ternary Semantic Array):**
  - **Optimal / Clean (`#10B981` | Container `#E6F8F0`):** Used for low glycemic index, organic certifications, allergen-free matches, and high nutritional density badges.
  - **Cautionary / Moderate (`#F59E0B` | Container `#FEF3C7`):** Flagging elevated sodium, saturated fats, or moderate additive processing.
  - **Restricted / Alert (`#EF4444` | Container `#FEE2E2`):** Direct trigger for user-configured allergen conflicts, high processing, or dietary violations.
- **Canvas & Neutrals:**
  - Base canvas sits on `#F8FAFC`.
  - Primary text and deep structural boundaries rely on `#0F172A` to maintain deep contrast under overhead supermarket lighting.
  - Secondary typography and inactive vectors map to `#64748B` and `#334155`.
  - Structural separators and glass borders reference `#E2E8F0` at 80% opacity.

## Typography

The type system balances quick glanceability with precise data density.

### Font Pairings & Roles
- **Headings & Quantitative Numerals (Plus Jakarta Sans):** Geometric roundness ensures high legibility on high-DPI smartphone screens while in motion. Used across item titles, prices, health scores, and large shelf-scanning summaries.
- **Body & Micro-Metrics (Inter):** Clean, neutral grotesk rhythm tuned for scanning nutritional breakdowns, ingredients, allergenic subtexts, and receipt breakdowns.

### Hierarchy & Legibility Rules
- **Tabular Figures:** Numbers in cart totals, price per unit, and macro breakdown percentages must render with monospaced digit features enabled to avoid layout shifting during real-time scan recalculations.
- **Scan-Weighting:** Key nutritional warnings and price totals strictly utilize `fontWeight: 700` or `800` to be readable at arm’s length.

## Layout & Spacing

The layout is constructed around single-handed mobile usage paradigms within a standard physical device viewport, maximizing the thumb-reach zone at the bottom two-thirds of the screen.

### Grid & Canvas Structure
- **Columns:** 4-column layout on mobile, transitioning to an 8-column layout for foldables and mini-tablets.
- **Base Grid:** Strictly rooted in an 8pt layout rhythm, with a 4pt sub-grid for fine internal label alignment and micro badges.
- **Safe Zones:** Top header reserves space for flashlight toggle, store location indicator, and scanner reticle anchors. The bottom area allocates 88px of persistent clearance for the frosted bottom navigation bar and Quick-Pay dock.

### Adaptive Device Behavior
- Mobile screens (< 480px) enforce full-width card stacks and sticky primary action trays.
- Expanded screens or landscape orientations split the screen into dual interactive panes: persistent camera viewfinder / barcode engine on the left, running live nutritional ledger and shopping cart on the right.

## Elevation & Depth

Visual hierarchy leverages crisp surfaces, glassmorphic floating overlays, and layered depth rather than dense heavy drop shadows.

### Depth Layers
- **Surface Level 0 (Canvas):** Flat `#F8FAFC`, non-elevated.
- **Surface Level 1 (Card Elements):** Pure `#FFFFFF` surfaces bounded by an ultra-subtle border: `1px solid rgba(226, 232, 240, 0.8)`. Soft diffuse shadow: `0px 2px 8px -2px rgba(15, 23, 42, 0.04), 0px 1px 4px -1px rgba(15, 23, 42, 0.02)`.
- **Surface Level 2 (Floating Action Docks & Sheets):** Backdrop-filter blur `16px` with white fill at 85% opacity (`rgba(255, 255, 255, 0.85)`). Border: `1px solid rgba(255, 255, 255, 0.6)`. Shadow: `0px 12px 24px -6px rgba(15, 23, 42, 0.08)`.
- **Surface Level 3 (Scanner Reticle & Modal Overlays):** Deep focus overlays using backdrop blur `8px` with dark ambient attenuation (`rgba(15, 23, 42, 0.4)`).

## Shapes

The design system uses a pill-shaped curvature hierarchy (`roundedness: 3`) to match modern hardware device corner radii and convey an inviting, tactile healthtech experience.

### Radius System
- **Chips, Category Tags & Primary Floating Buttons:** Full pill geometry (`border-radius: 9999px` or 1rem tokens) for quick touch targets.
- **Item Cards & Nutritional Data Surfaces:** Rounded at 1rem (`rounded-lg: 2rem` for expanded detail sheets).
- **Scanner Viewfinder:** 1.5rem rounded frame with open corners to focus camera targeting on barcodes and label matrices.

## Components

### Buttons & Quick-Pay Triggers
- **Primary Checkout Button:** High-saturation `#F35919` surface, bold white Plus Jakarta Sans text, full pill curvature, haptic-ready press state scaling down to `0.98`.
- **Secondary Actions:** White background, `#0F172A` text, enclosed in `#E2E8F0` border.
- **Tertiary / Utility Controls:** Transparent background with subtle grey hover/press highlight for flashlight, lens switch, and nutrition toggles.

### Filter & Diet Preference Chips
- **States:** Inactive chips feature `#FFFFFF` fill with `#64748B` label text and thin slate border. Active filter chips shift to `#0F172A` surface with crisp white typography.
- **Allergen Alert Chips:** Redesigned in `#FEE2E2` container with `#EF4444` bold text and micro warning icon.

### Scan Reticle Guide
- Centered camera overlay framing barcodes and nutrition panels.
- Bounded by four curved corner anchors using brand coral (`#F35919`).
- Features a dynamic animated target line transitioning from gentle coral breathing pulse to instant `#10B981` flash upon successful barcode read.

### Circular Radial Health Gauges
- Compact 48px to 64px circular SVG tracks displaying the composite health score (0–100).
- Unfilled track: `#E2E8F0` at 4px stroke width.
- Filled track: Chromatically mapped to score tiers (`#10B981` for 80+, `#F59E0B` for 50-79, `#EF4444` for <50).
- Centered typography displays the score integer in `numeral-score` styling.

### Interactive Stepper Badges
- Pill-shaped quantity modifiers nested inside cart items.
- Dual-node `+` and `−` controls with a central count in tabular numbers.
- Integrated swipe-to-delete velocity threshold on swipe left.

### Frosted Bottom Navigation Bar
- Floats 16px above the home indicator safe area with 16px lateral padding.
- Triple segmented routing: **Scan (Center/Raised Anchor)**, **Cart (with live price badge)**, and **Health Profile (macro intake summary)**.
- Translucent backdrop blur with high-fidelity micro-icons and active state dots.