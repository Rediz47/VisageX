# Motion System

VisageX uses a **device-tiered motion system** so the site feels premium on high-end hardware and stays smooth on low-end Android phones. This document is the contract for new code.

## TL;DR rules

1. **No hardcoded durations in new code.** Use `var(--dur-fast | --dur-med | --dur-slow)` in CSS, or `preset.durations.*` from `useMotionTier()` in TS/TSX.
2. **Every animation declares a priority**: `critical`, `secondary`, or `decorative`.
3. **Animate attention, not decoration.** Prefer one well-placed entry reveal over five card-by-card reveals.

## Tiers

Detected in `src/lib/motion.ts::detectDeviceTier()`.

| Tier | Triggered when… | Stagger | `fast/med/slow` (s) |
|------|-----------------|---------|---------------------|
| `low`  | `prefers-reduced-motion`, `deviceMemory ≤ 3`, `cores ≤ 4`, 2G/3G, or `Save-Data` | 0 | 0 / 0 / 0 |
| `mid`  | `deviceMemory ≤ 6`, `cores ≤ 6`, or mobile width | 0.04 | 0.18 / 0.32 / 0.50 |
| `high` | everything else | 0.07 | 0.25 / 0.45 / 0.70 |

Low tier additionally:
- Skips Lenis (native scroll only).
- Disables `useScroll`, parallax, ambient glow, blur animations, hover micro-interactions, counter tweens.
- Zeroes out all CSS transition/animation durations via `html[data-motion-tier="low"]`.

## Priorities

| Priority | Budget | Concurrency | Blocked by reduced-motion? |
|----------|--------|-------------|----------------------------|
| `critical`   | bypassed (always runs) | bypassed | Fade-only (no transform) |
| `secondary`  | counts against screen budget | yes | Yes |
| `decorative` | counts; never queues | yes | Yes |

Budgets per screen (resets on route / tab / modal): `low: 2`, `mid: 5`, `high: ∞`.
Max concurrent animations: `low: 1`, `mid: 2`, `high: 4`.

Use `critical` sparingly — reserved for the hero title, primary CTA, score gauge, and tab-panel transitions.

## Primitives

```tsx
import { Reveal, Stagger, Parallax, HoverLift } from '@/components/motion';

<Reveal priority="critical">
  <h1>Welcome</h1>
</Reveal>

<Stagger priority="decorative" y={12}>
  <Card />
  <Card />
</Stagger>

<Parallax maxPx={32}>
  <BackgroundBlob />
</Parallax>

<HoverLift lift={-2}>
  <Button>Learn more</Button>
</HoverLift>
```

All primitives:
- Call `requestSlot(priority)` on view and skip to static if denied.
- Pair `startAnimation` / `endAnimation` to maintain the concurrency counter.
- Return passthrough DOM when `FORCE_TIER === 'off'` or tier is `low` (for decorative).

## Budget resets

The `MotionProvider` resets the screen budget automatically on route change. Manually call `resetBudget('tab' | 'modal')` when switching dashboard tabs or opening/closing full-screen modals:

```tsx
const { resetBudget } = useMotionTier();
useEffect(() => { resetBudget('tab'); }, [activeTab]);
```

## Duration tokens

CSS:
```css
.btn {
  transition: transform var(--dur-fast) var(--ease-premium);
}
```

TSX (inline):
```tsx
transition={{ duration: preset.durations.med, ease: easings.easeOutExpo }}
```

Forbidden:
```css
/* ❌ */ transition-duration: 300ms;
```
```tsx
{/* ❌ */} transition={{ duration: 0.3 }}
```

## Rollback

Set `FORCE_TIER` in `src/lib/motion.ts`:
- `'high' | 'mid' | 'low'` → force tier.
- `'off'` → primitives become passthrough, budget disabled.

## Debugging

In dev, `window.__motionDebug()` returns the current budget/concurrency state.
