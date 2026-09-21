import type { ReactNode } from 'react'

/**
 * A determinate circular progress indicator, wavy variant.
 *
 * Ported from m3e's CircularProgressIndicatorElement, which is the only
 * implementation of the M3 Expressive wavy indicator I could find — Material
 * Web has no equivalent.
 *
 * The part worth knowing: the active track is NOT a wavy arc drawn up to the
 * value. It is a full 360° wavy ring, masked by a round-capped plain arc from
 * 0 to the value. Drawing the wave only as far as the value would end it
 * wherever the sinusoid happened to be — mid-crest, usually — and the cap
 * would look bitten off. Masking a whole ring gives a clean round end at any
 * value.
 *
 * Defaults match m3e's at a 48px diameter, scaled here to whatever `size` is.
 */

interface WavyProgressProps {
  value: number
  max: number
  /** Diameter in px. Amplitude, wavelength and stroke scale with it. */
  size?: number
  /** Rendered in the middle — m3e's default slot. */
  children?: ReactNode
  label?: string
}

const BASE = 48
const BASE_STROKE = 4
const BASE_AMPLITUDE = 1.6
const BASE_WAVELENGTH = 15
const STEPS = 96

interface Geometry {
  cx: number
  cy: number
  r: number
  padding: number
}

function circleOf(diameter: number, stroke: number, padding: number): Geometry {
  const pad = padding + stroke / 2
  const r = diameter / 2
  return { cx: r + pad, cy: r + pad, r, padding: pad }
}

/** How many degrees a given length subtends on the track. */
function sizeToDegrees(size: number, r: number): number {
  return size * (360 / (2 * Math.PI * r))
}

function degToRad(degrees: number): number {
  return ((degrees - 90) * Math.PI) / 180
}

function arcPath(
  geo: Geometry,
  startAngle: number,
  endAngle: number,
  gap: number,
): string {
  let start = startAngle
  let end = endAngle
  if (gap > 0) {
    const g = sizeToDegrees(gap, geo.r)
    start += g
    end -= g
  }
  if (end - start >= 360) end = start + 359.999

  const at = (deg: number) => {
    const rad = degToRad(deg)
    return [geo.cx + geo.r * Math.cos(rad), geo.cy + geo.r * Math.sin(rad)]
  }
  const [sx, sy] = at(end)
  const [ex, ey] = at(start)
  const large = end - start <= 180 ? 0 : 1
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${geo.r.toFixed(2)} ${geo.r.toFixed(2)} 0 ${large} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

/** A sinusoid wrapped around the circle: r − amplitude · sin(θ·waves + phase). */
function wavyPath(geo: Geometry, amplitude: number, wavelength: number): string {
  const start = degToRad(0)
  const end = degToRad(360)
  const total = end - start
  const waves = (2 * Math.PI * geo.r) / wavelength
  // Aligns a crest with the start of the ring, so the seam is invisible.
  const phase = (Math.PI / 2) * (waves - 1)

  const points: string[] = []
  for (let i = 0; i <= STEPS; i++) {
    const angle = start + (i / STEPS) * total
    const radius = geo.r - amplitude * Math.sin(angle * waves + phase)
    const x = radius * Math.cos(angle) + geo.cx
    const y = radius * Math.sin(angle) + geo.cy
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M ${points.join(' L ')}`
}

export function WavyProgress({
  value,
  max,
  size = 64,
  children,
  label,
}: WavyProgressProps) {
  const scale = size / BASE
  const stroke = BASE_STROKE * scale
  const wavelength = BASE_WAVELENGTH * scale
  const amplitude = BASE_AMPLITUDE * scale

  const minDegrees = sizeToDegrees(stroke * 2, size / 2)
  const degrees =
    value > 0 ? Math.max(minDegrees, (value / max) * 360) : 0

  /*
   * Below ~1.5× the minimum sweep there is not enough arc to show a whole
   * wave, so m3e flattens it. Without this a 1-of-9 ring reads as a glitch
   * rather than a small value.
   */
  const waveAmplitude =
    degrees <= minDegrees * 1.5 || degrees === 360 ? 0 : amplitude

  const geo = circleOf(size, stroke, amplitude)
  const viewBox = size + geo.padding * 2
  const maskId = `wavy-${value}-${max}-${size}`

  return (
    <div
      className="md-wavy-progress"
      style={{ width: viewBox, height: viewBox }}
    >
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        role="img"
        aria-label={label ?? `${value} of ${max} complete`}
      >
        <defs>
          <mask id={maskId}>
            <path
              d={arcPath(geo, 0, degrees, stroke)}
              stroke="white"
              strokeWidth={stroke + amplitude + stroke / 2}
              strokeLinecap="round"
              fill="none"
            />
          </mask>
        </defs>

        <path
          className="md-wavy-progress__track"
          d={arcPath(geo, degrees, 360, stroke)}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />

        <g mask={`url(#${maskId})`}>
          <path
            className="md-wavy-progress__active"
            d={wavyPath(geo, waveAmplitude, wavelength)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      {children ? (
        <span className="md-wavy-progress__label">{children}</span>
      ) : null}
    </div>
  )
}
