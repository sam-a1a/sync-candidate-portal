# Material 3 Expressive design system

Colour, type, shape, elevation and motion as design tokens, wired to Tailwind
v4 and to a theme provider that switches scheme, contrast level and language.

Two languages are supported: **English** (LTR) and **Arabic** (RTL).

## Layout

```
src/styles/
  index.css            entry point - imports everything, defines the variants
  fonts.css            @font-face + the two reference typefaces
  theme.css            exposes the tokens as Tailwind utilities
  base.css             element defaults
  utilities.css        state layers, elevation, spring + type-motion harnesses
  tokens/
    color.css          49 roles x 6 schemes            GENERATED
    typography.css     15 baseline + 15 emphasized type styles
    shape.css          corner scale
    elevation.css      tonal ladder + shadow recipes
    motion.css         easings, durations, springs     springs GENERATED
    state.css          state layer opacities

src/theme/
  theme.ts             types, storage keys, resolution logic (no React)
  ThemeContext.ts      the context object
  ThemeProvider.tsx    the provider
  useTheme.ts          the hook
```

## Using it

Reach for a **role**, never a value.

```tsx
<div className="bg-surface-container text-on-surface rounded-large p-4">
  <h2 className="text-headline-small">Title</h2>
  <p className="text-body-medium text-on-surface-variant">Supporting text</p>
</div>
```

That markup is already correct in all six schemes. There is no `dark:` branch
because there is nothing for one to do — `--md-sys-color-surface-container`
resolves differently per scheme and the utility points straight at it.

The same tokens are available as plain CSS for anything outside Tailwind:

```css
.card {
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-large);
}
```

### Utilities beyond the tokens

| Utility | What it does |
| --- | --- |
| `md-state-layer` | Hover/focus/press wash, from the element's own content colour |
| `md-elevation-0…5` | Shadow recipes — prefer a `surface-container-*` role first |
| `md-spring-spatial{,-fast,-slow}` | Spring easing + its settle duration, for movement |
| `md-spring-effects{,-fast,-slow}` | Same, critically damped — for colour and opacity |
| `md-type-motion` | Transition harness for the variable font axes |
| `md-shape-morph` | Transition harness for `border-radius` |

### Variants

`dark:`, `contrast-medium:`, `contrast-high:`, `rtl:`, `ltr:`, `ar:`.

Prefer logical properties (`ps-4`, `border-s`, `text-start`) over `rtl:` — they
need no variant at all. `dark:` should be rare; if you are reaching for it,
check whether a colour role already says what you mean.

## Theming

`ThemeProvider` writes two attributes on `<html>`, and the stylesheet keys off
the pair:

```
data-theme="light | dark"
data-contrast="standard | medium | high"
```

```tsx
const { mode, setMode, resolvedTheme, language, setLanguage } = useTheme()
```

`mode` and `contrast` may be `system`; `resolvedTheme` and `resolvedContrast`
never are. Setting `language` to `ar` also flips `lang` and `dir`, which
retunes the type scale (see below).

The choice is resolved again in an inline script in `index.html` so the first
paint is already correct. That script duplicates a few lines of `theme.ts` on
purpose — it has to run before any module loads. **If you change
`STORAGE_KEYS`, change it there too.**

One gap worth knowing: the OS only reports "more contrast", not M3's
intermediate level, so `contrast: 'system'` resolves to `standard` or `high`.
`medium` is reachable only as an explicit choice.

## Type

Google Sans Flex for Latin, Noto Sans Arabic for Arabic, split by
`unicode-range`. A single element containing both scripts renders each run in
its own face — no `dir` handling or per-element class required.

Both are self-hosted, because the Google Fonts CSS API does not serve either
Google Sans family (`?family=Google+Sans` answers `400: Font family not
found`). Both are SIL OFL 1.1 and the licences ship alongside the `woff2`s.

### Arabic retuning

Arabic is not Latin type at a different size. Two adjustments, applied on
`:lang(ar)`:

- **Tracking → 0.** The M3 tracking values are calibrated for Latin. Applied to
  Arabic they push apart letters meant to join cursively.
- **Line height → ×1.15.** Noto Sans Arabic has taller ascenders and deeper
  descenders, so Latin-tuned leading crowds consecutive lines.

Both run through multipliers (`--md-sys-typescale-tracking-scale`,
`--md-sys-typescale-line-height-scale`), so retuning the whole 30-style scale
is two declarations rather than sixty.

### Emphasized styles

M3 Expressive added a parallel emphasized scale: same size and line height,
heavier weight. `text-title-medium` → `text-title-medium-emphasized`. Use it
for selected states, primary actions and unread content — emphasis that never
reflows a layout.

## Motion

Three layers:

1. **Springs** — what Expressive actually specifies. Material Web never
   implemented them, so `scripts/build-springs.py` integrates each Compose
   spring and emits it as a CSS `linear()` curve, overshoot included.
   `spatial` springs move things and overshoot; `effects` springs are
   critically damped and are the correct choice for colour and opacity.
2. **Easings and durations** — the bezier system, still correct for
   enter/exit/shared-axis transitions.
3. **Type motion** — animating the variable font axes themselves.

A spring's curve and its settle duration are one fact, so they are always set
together. The `md-spring-*` utilities do both.

`prefers-reduced-motion: reduce` collapses durations to 1ms and flattens the
springs to a linear ramp — transitions still fire, so anything listening for
`transitionend` keeps working.

### Type motion

The shipped fonts stay **variable**, with the axes M3 Expressive animates:

| Font | Axes | Range |
| --- | --- | --- |
| Google Sans Flex | `wght` | 1–1000 |
| | `ROND` | 0–100 (roundness) |
| | `GRAD` | 0–100 (grade) |
| Noto Sans Arabic | `wght` | 100–900 |

```tsx
<h2 className="md-type-motion hover:font-bold hover:[--md-sys-typeface-rond:100]">
```

`wght` is animated through `font-weight`, which is already an animatable CSS
property. `ROND` and `GRAD` go through `@property`-registered custom
properties, because transitioning `font-variation-settings` directly is
fragile — the axis lists on both sides must match exactly or the browser snaps.

**`GRAD` is the one worth knowing about.** It changes stroke weight without
changing advance widths, so emphasising text with it never reflows the line.
`wght` does change metrics — fine on a heading, think twice in a paragraph.

Arabic moves on `wght` alone; Noto Sans Arabic has no `ROND` or `GRAD` axis
yet ([google/fonts#10442]). The same markup stays valid, it is just quieter.

[google/fonts#10442]: https://github.com/google/fonts/issues/10442

## Regenerating

Two files are generated. Do not hand-edit them.

```bash
# tokens/color.css, from a Material Theme Builder export
python3 scripts/import-material-theme.py [~/Desktop/css]

# the spring block in tokens/motion.css
python3 scripts/build-springs.py

# public/fonts/*.woff2
./scripts/build-fonts.sh [~/Desktop/Fonts]
```

`build-fonts.sh` subsets to Latin and Arabic and partially instances the
variable fonts, pinning the axes we never animate. `gvar` deltas multiply
across axes, so each axis kept roughly doubles the file:

| Latin subset | Size |
| --- | --- |
| all 6 axes | 1.3 MB |
| − `slnt` | 752 KB |
| − `slnt`, `opsz` | 268 KB |
| − `slnt`, `opsz`, `wdth` (shipped) | 104 KB |

The trade is optical sizing: `opsz` is pinned at 18, so display-size text does
not get its own optical cut. Drop `opsz=18` from the instancer call to get it
back for ~250 KB; nothing else needs to change, `font-optical-sizing: auto` is
already set.

## Rules

- Never write a literal colour. Tailwind's stock palette is deliberately
  cleared in `theme.css` so `bg-teal-600` does not exist — it would survive
  light mode and break in dark and high contrast.
- Only pair a role with its partner: `bg-primary` with `text-on-primary`,
  `bg-surface-container` with `text-on-surface`. That pairing is what the
  scheme guarantees.
- `outline-variant` for dividers, `outline` for real boundaries like input
  borders.
- Prefer tonal elevation (`bg-surface-container-high`) over shadows. Shadows
  are for things that genuinely float over busy content.
- Use the shape scale, not literal radii — shape morphing interpolates between
  two steps of it.
