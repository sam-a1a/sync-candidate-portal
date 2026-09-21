import type { CSSProperties } from 'react'
import { SKILL_ICONS } from '../features/profile/skill-icons.generated'

/**
 * A brand mark for a skill, where one exists.
 *
 * Returns null otherwise — deliberately, and with no placeholder and no
 * reserved space. Most skills in this app ("Humanitarian logistics",
 * "Monitoring & evaluation", "Sphere Standards") have no logo and never will,
 * and a chip row where one in eight carries a mark and the rest carry a grey
 * square looks broken in a way that no icons at all does not.
 *
 * Drawn as a CSS mask, not an <img>. Simple Icons ship a single path with no
 * fill, so an <img> renders them black — invisible on a dark chip. A mask lets
 * the glyph be filled with the brand's own colour instead.
 */
export function SkillIcon({ skill, size = 16 }: { skill: string; size?: number }) {
  const entry = SKILL_ICONS[skill.toLowerCase()]
  if (!entry) return null

  return (
    <span
      className="md-skill-icon"
      aria-hidden="true"
      style={
        {
          '--md-skill-icon': `url(${import.meta.env.BASE_URL}skill-icons/${entry.slug}.svg)`,
          /*
           * The real brand colour, except where that colour is near-black by
           * design — Slack's #4A154B is meant for a white page and disappears
           * on a dark chip. Those fall back to the chip's own text colour,
           * which is legible in every scheme.
           */
          '--md-skill-icon-color': entry.dark ? 'currentColor' : entry.hex,
          inlineSize: size,
          blockSize: size,
        } as CSSProperties
      }
    />
  )
}
