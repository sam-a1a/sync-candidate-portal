#!/usr/bin/env python3
"""
Turns a Material Theme Builder CSS export into src/styles/tokens/color.css.

Material Theme Builder (https://material-foundation.github.io/material-theme-builder/)
exports one file per scheme - light.css, light-mc.css, light-hc.css, dark.css,
dark-mc.css, dark-hc.css - each wrapping the same 49 `--md-sys-color-*` tokens
in a class selector. This rewrites them onto the [data-theme]/[data-contrast]
attribute pair that ThemeProvider drives, and adds a prefers-color-scheme
fallback so the page is still correct with JavaScript disabled.

Re-run this whenever the theme is re-seeded; do not hand-edit color.css.

Usage: python3 scripts/import-material-theme.py [path/to/export/dir]
Default export dir: ~/Desktop/css
"""

import pathlib
import re
import sys

SCHEMES = [
    # (source file, theme, contrast)
    ("light.css", "light", "standard"),
    ("light-mc.css", "light", "medium"),
    ("light-hc.css", "light", "high"),
    ("dark.css", "dark", "standard"),
    ("dark-mc.css", "dark", "medium"),
    ("dark-hc.css", "dark", "high"),
]

HEADER = """/*
 * Material 3 color scheme - GENERATED, do not edit by hand.
 *
 * Source: Material Theme Builder export, imported with
 *   python3 scripts/import-material-theme.py
 *
 * M3 defines colour as a set of semantic *roles*, not a palette: you pick a
 * role by the job it does, and the scheme supplies a value that is guaranteed
 * to pair correctly with its matching `on-` role in every theme and contrast
 * level. Never reach past a role to a literal colour - that is what breaks
 * dark mode and the accessibility contrast levels.
 * https://m3.material.io/styles/color/system/overview
 *
 * Every role below exists in all six schemes: {light, dark} x {standard,
 * medium, high} contrast. ThemeProvider writes the resolved pair onto <html>
 * as data-theme + data-contrast.
 */
"""


def parse(path):
    """Extract the ordered --md-sys-color-* declarations from an export file."""
    text = path.read_text()
    return re.findall(r"(--md-sys-color-[\w-]+):\s*([^;]+);", text)


def block(selector, tokens, color_scheme, indent="  "):
    lines = [f"{selector} {{"]
    lines.append(f"{indent}color-scheme: {color_scheme};")
    lines.extend(f"{indent}{name}: {value.strip()};" for name, value in tokens)
    lines.append("}")
    return "\n".join(lines)


def main():
    src_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "~/Desktop/css")
    src_dir = src_dir.expanduser()
    out = pathlib.Path(__file__).resolve().parent.parent / "src/styles/tokens/color.css"

    schemes = {}
    for filename, theme, contrast in SCHEMES:
        path = src_dir / filename
        if not path.exists():
            sys.exit(f"error: missing {path}")
        tokens = parse(path)
        if not tokens:
            sys.exit(f"error: no --md-sys-color-* tokens found in {path}")
        schemes[(theme, contrast)] = tokens

    counts = {len(t) for t in schemes.values()}
    if len(counts) != 1:
        sys.exit(f"error: schemes disagree on token count: {counts}")

    parts = [HEADER]

    # Light/standard doubles as the root default, so a page that never sets the
    # attributes still renders a complete, valid scheme.
    parts.append(
        block(
            ":root,\n:root[data-theme='light'][data-contrast='standard']",
            schemes[("light", "standard")],
            "light",
        )
    )

    # No-JS fallback. ThemeProvider normally writes both attributes before first
    # paint, so this only applies when scripting is off. Contrast is not covered
    # here: prefers-contrast is resolved in JS.
    parts.append(
        "/* Follow the OS when no explicit choice has been applied (e.g. no JS). */\n"
        "@media (prefers-color-scheme: dark) {\n"
        + "\n".join(
            "  " + line
            for line in block(
                ":root:not([data-theme])",
                schemes[("dark", "standard")],
                "dark",
            ).splitlines()
        )
        + "\n}"
    )

    for (theme, contrast), tokens in schemes.items():
        if (theme, contrast) == ("light", "standard"):
            continue
        parts.append(
            block(
                f":root[data-theme='{theme}'][data-contrast='{contrast}']",
                tokens,
                theme,
            )
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n\n".join(parts) + "\n")
    print(f"wrote {out.relative_to(out.parent.parent.parent.parent)}")
    print(f"  {len(schemes)} schemes x {counts.pop()} color roles")


if __name__ == "__main__":
    main()
