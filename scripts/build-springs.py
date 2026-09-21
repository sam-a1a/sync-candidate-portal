#!/usr/bin/env python3
"""
Generates the CSS `linear()` easing approximations in src/styles/tokens/motion.css.

M3 Expressive replaced duration+bezier animation with spring physics. Jetpack
Compose ships those springs as (dampingRatio, stiffness) pairs; Material Web
never implemented them. CSS can't express a spring directly, but `linear()`
takes an arbitrary sampled curve - so we integrate the spring here and emit the
samples.

Spring constants are copied verbatim from androidx:
  compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/
    tokens/{Expressive,Standard}MotionTokens.kt

Compose models a unit mass, so omega = sqrt(stiffness). Displacement starts at
1 with zero velocity and decays to 0; animation progress is 1 - displacement.
Spatial springs are underdamped (zeta < 1) and overshoot, which is why some
emitted values exceed 1 - that overshoot is the point.

Rewrites the region between the SPRINGS:START / SPRINGS:END markers in
src/styles/tokens/motion.css, leaving the rest of the file alone.

Usage: python3 scripts/build-springs.py
"""

import math
import pathlib
import sys

# (damping ratio, stiffness)
SPRINGS = {
    "expressive": {
        "default-spatial": (0.8, 380.0),
        "fast-spatial": (0.6, 800.0),
        "slow-spatial": (0.8, 200.0),
        "default-effects": (1.0, 1600.0),
        "fast-effects": (1.0, 3800.0),
        "slow-effects": (1.0, 800.0),
    },
    "standard": {
        "default-spatial": (0.9, 700.0),
        "fast-spatial": (0.9, 1400.0),
        "slow-spatial": (0.9, 300.0),
        "default-effects": (1.0, 1600.0),
        "fast-effects": (1.0, 3800.0),
        "slow-effects": (1.0, 800.0),
    },
}

# Compose's default visibility threshold for a 0..1 float animation.
REST_DELTA = 0.001
SAMPLES = 40


def displacement(t, zeta, omega):
    """Displacement from target at time t, starting at 1 with zero velocity."""
    if zeta < 1.0:  # underdamped - overshoots
        omega_d = omega * math.sqrt(1.0 - zeta * zeta)
        return math.exp(-zeta * omega * t) * (
            math.cos(omega_d * t) + (zeta * omega / omega_d) * math.sin(omega_d * t)
        )
    if zeta == 1.0:  # critically damped - no overshoot
        return math.exp(-omega * t) * (1.0 + omega * t)
    # overdamped
    r = omega * math.sqrt(zeta * zeta - 1.0)
    a, b = -zeta * omega + r, -zeta * omega - r
    return (a * math.exp(b * t) - b * math.exp(a * t)) / (a - b)


def settling_time(zeta, omega):
    """First time after which the spring stays inside the rest threshold."""
    t, step = 0.0, 0.0005
    last_outside = 0.0
    while t < 10.0:
        if abs(displacement(t, zeta, omega)) > REST_DELTA:
            last_outside = t
        t += step
    return last_outside + step


def linear_easing(zeta, stiffness):
    omega = math.sqrt(stiffness)
    duration = settling_time(zeta, omega)
    points = [
        1.0 - displacement(duration * i / (SAMPLES - 1), zeta, omega)
        for i in range(SAMPLES)
    ]
    points[0], points[-1] = 0.0, 1.0
    body = ", ".join(f"{p:.4f}".rstrip("0").rstrip(".") or "0" for p in points)
    return f"linear({body})", duration


START = "  /* SPRINGS:START */"
END = "  /* SPRINGS:END */"


def render():
    lines = []
    for scheme, springs in SPRINGS.items():
        lines.append(f"  /* {scheme} */")
        for name, (zeta, stiffness) in springs.items():
            easing, duration = linear_easing(zeta, stiffness)
            prefix = f"  --md-sys-motion-spring-{scheme}-{name}"
            lines.append(f"{prefix}-duration: {round(duration * 1000)}ms;")
            lines.append(f"{prefix}: {easing};")
    return lines


def main():
    target = (
        pathlib.Path(__file__).resolve().parent.parent
        / "src/styles/tokens/motion.css"
    )
    lines = target.read_text().splitlines()
    try:
        start, end = lines.index(START), lines.index(END)
    except ValueError:
        sys.exit(f"error: SPRINGS:START / SPRINGS:END markers not found in {target}")

    generated = render()
    target.write_text(
        "\n".join(lines[: start + 1] + generated + lines[end:]) + "\n"
    )
    print(f"wrote {len(generated)} spring declarations into {target.name}")


if __name__ == "__main__":
    main()
