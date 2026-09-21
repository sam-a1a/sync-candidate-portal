#!/usr/bin/env python3
"""
Fetches the brand marks listed in scripts/skill-icons.txt into
public/skill-icons/, and writes the name -> slug lookup used by <SkillIcon>.

Simple Icons is CC0, so vendoring needs no attribution and raises no licence
question — which is the reason for preferring it to thesvg.org, whose terms are
not stated anywhere. Brand marks are still trademarks; using one to identify
the thing it names is fine, and that is all this does.

Each icon is a single path on a 24x24 viewBox with NO fill attribute, so an
<img> renders it black - invisible on a dark chip. <SkillIcon> draws it as a
CSS mask instead and fills that mask with the brand's own colour, which Simple
Icons publishes per icon. The hex is read from the package's icons.json here
and written into the generated map, so the marks arrive in their real colours
rather than as white silhouettes.

Usage: python3 scripts/build-skill-icons.py
"""

import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "skill-icons"
GENERATED = ROOT / "src" / "features" / "profile" / "skill-icons.generated.ts"
# PINNED, not @latest. Under @latest the `icons/` folder and `_data/` resolve
# to different releases, so an icon can download fine while its brand colour is
# absent from the data - which silently greys the mark. v12 is the last release
# carrying the Microsoft and Tableau marks; both brands later asked to be
# removed, so newer versions drop them.
VERSION = "12"
CDN = f"https://cdn.jsdelivr.net/npm/simple-icons@{VERSION}/icons"
DATA = f"https://cdn.jsdelivr.net/npm/simple-icons@{VERSION}/_data/simple-icons.json"

# Brand colours that vanish on a dark surface. Simple Icons publishes the
# official hex, and for these that hex is near-black by design (the mark is
# meant to sit on white). Substituting a lighter tint is the lesser evil
# against an invisible chip.
TOO_DARK = 0.28


def parse() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for line in (ROOT / "scripts" / "skill-icons.txt").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            sys.exit(f"error: expected 'Name = slug', got: {line}")
        name, slug = (part.strip() for part in line.split("=", 1))
        if not re.fullmatch(r"[a-z0-9._-]+", slug):
            sys.exit(f"error: not a Simple Icons slug: {slug}")
        pairs.append((name, slug))
    return pairs


def luminance(hex_colour: str) -> float:
    r, g, b = (int(hex_colour[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def brand_colours() -> dict[str, str]:
    """slug -> hex, from the package's own data file."""
    import json

    with urllib.request.urlopen(DATA, timeout=60) as response:
        data = json.loads(response.read())

    icons = data["icons"] if isinstance(data, dict) else data
    out: dict[str, str] = {}
    for icon in icons:
        title = icon.get("title", "")
        slug = icon.get("slug") or re.sub(r"[^a-z0-9]", "", title.lower())
        if icon.get("hex"):
            out[slug] = icon["hex"]
    return out


def main() -> None:
    pairs = parse()
    OUT.mkdir(parents=True, exist_ok=True)
    colours = brand_colours()

    missing: list[str] = []
    fetched: set[str] = set()
    total = 0

    for name, slug in pairs:
        if slug in fetched:
            continue
        try:
            with urllib.request.urlopen(f"{CDN}/{slug}.svg", timeout=30) as response:
                body = response.read()
        except Exception:
            missing.append(f"{name} ({slug})")
            continue
        if body.lstrip()[:4] != b"<svg":
            missing.append(f"{name} ({slug})")
            continue
        (OUT / f"{slug}.svg").write_bytes(body)
        fetched.add(slug)
        total += len(body)

    if missing:
        print("error: no such Simple Icon: " + ", ".join(missing), file=sys.stderr)
        print("Search the slug at https://simpleicons.org", file=sys.stderr)
        raise SystemExit(1)

    # A slug with no colour means the icons folder and the data file disagree,
    # which is the failure that used to pass silently. Stop instead.
    uncoloured = sorted({slug for _, slug in pairs if slug not in colours})
    if uncoloured:
        print(
            f"error: simple-icons@{VERSION} has no brand colour for: "
            + ", ".join(uncoloured),
            file=sys.stderr,
        )
        raise SystemExit(1)

    lines = []
    for name, slug in pairs:
        hex_colour = colours[slug]
        if luminance(hex_colour) < TOO_DARK:
            lines.append(
                f"  {name.lower()!r}: {{ slug: {slug!r}, hex: {'#' + hex_colour!r}, dark: true }},"
            )
        else:
            lines.append(
                f"  {name.lower()!r}: {{ slug: {slug!r}, hex: {'#' + hex_colour!r} }},"
            )
    entries = "\n".join(lines)

    GENERATED.write_text(
        "// GENERATED by ./scripts/build-skill-icons.py from scripts/skill-icons.txt.\n"
        "// Add a skill there and re-run the script; do not edit this file.\n"
        "//\n"
        "// Keyed by the lowercased skill name. A skill with no entry gets no icon\n"
        "// and no reserved space - see the note in skill-icons.txt.\n"
        "//\n"
        "// `hex` is the brand's official colour, published by Simple Icons.\n"
        "// `dark: true` marks one too dark to read on a dark surface; SkillIcon\n"
        "// falls back to the chip's own text colour for those.\n"
        "\n"
        "export interface SkillIconEntry {\n"
        "  slug: string\n"
        "  hex: string\n"
        "  dark?: boolean\n"
        "}\n"
        "\n"
        "export const SKILL_ICONS: Record<string, SkillIconEntry> = {\n"
        f"{entries}\n"
        "}\n"
    )

    print(f"==> {len(fetched)} skill icons in public/skill-icons ({total / 1024:.0f} KB)")
    print(f"    {len(pairs)} names mapped in {GENERATED.name}")


if __name__ == "__main__":
    main()
