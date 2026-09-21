/**
 * A Circle Flag, served from public/flags (see scripts/build-flags.py).
 *
 * Two kinds, and the distinction is the whole point of the component:
 *
 *   <Flag language="ar" />   a flag for a LANGUAGE
 *   <Flag country="lb" />    a flag for a COUNTRY
 *
 * A language is not a country. Arabic is spoken across two dozen states, so
 * putting Saudi Arabia's flag beside "Arabic" tells a Lebanese or Egyptian
 * speaker their language belongs somewhere else. Circle Flags ships
 * purpose-made language flags for exactly this case, and the language path is
 * what we use for languages — always.
 *
 * Decorative by default: a flag next to the word "Arabic" adds nothing for a
 * screen reader, so it gets alt="". Pass `label` only where the flag is the
 * sole carrier of meaning.
 */

interface FlagProps {
  language?: string
  country?: string
  /** px. 20 for inline use, 24 in a list row. */
  size?: number
  label?: string
  className?: string
}

export function Flag({ language, country, size = 20, label, className }: FlagProps) {
  /* BASE_URL, not a leading slash: the site may be served from a subpath. */
  const base = import.meta.env.BASE_URL
  const src = language
    ? `${base}flags/language/${language}.svg`
    : `${base}flags/${country}.svg`

  return (
    <img
      className={['md-flag', className].filter(Boolean).join(' ')}
      src={src}
      alt={label ?? ''}
      role={label ? undefined : 'presentation'}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ inlineSize: size, blockSize: size }}
    />
  )
}
