#!/usr/bin/env python3
"""
Fetches the flags listed in scripts/flags.txt into public/flags/.

Circle Flags (https://github.com/HatScripts/circle-flags) is MIT licensed, so
vendoring is fine; the licence is copied in alongside the SVGs. Vendored rather
than hotlinked for the same reasons as the fonts: no third-party request on
every page load, no dependency on someone else's uptime, and a pinned set that
an upstream redesign cannot change under us.

The wrinkle: many files in flags/language/ are git SYMLINKS to a country flag
(language/fr.svg -> ../fr.svg). raw.githubusercontent serves a symlink as a
9-byte text file containing its target, not as the SVG - so fetching naively
gives you a handful of files reading "../gb.svg". Those are resolved here.

Usage: python3 scripts/build-flags.py
"""

import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "flags"
BASE = "https://raw.githubusercontent.com/HatScripts/circle-flags/refs/heads/gh-pages/flags"
LICENSE_URL = (
    "https://raw.githubusercontent.com/HatScripts/circle-flags/refs/heads/gh-pages/LICENSE.md"
)
MAX_HOPS = 4


def get(path: str) -> bytes:
    with urllib.request.urlopen(f"{BASE}/{path}", timeout=30) as response:
        return response.read()


def fetch_svg(name: str) -> bytes | None:
    """Fetch flags/<name>.svg, following symlink indirections."""
    path = f"{name}.svg"
    for _ in range(MAX_HOPS):
        try:
            body = get(path)
        except Exception:
            return None

        if body.lstrip()[:4] == b"<svg":
            return body

        # A symlink: the body is its target, relative to the current directory.
        target = body.decode("utf-8", "replace").strip()
        if "\n" in target or not target.endswith(".svg") or len(target) > 120:
            return None
        path = str((pathlib.PurePosixPath(path).parent / target))
        # PurePosixPath keeps "..", which the server will not resolve for us.
        path = str(pathlib.PurePosixPath(path))
        parts: list[str] = []
        for part in path.split("/"):
            if part == "..":
                if parts:
                    parts.pop()
            elif part not in ("", "."):
                parts.append(part)
        path = "/".join(parts)

    return None


def main() -> None:
    names = [
        line.strip()
        for line in (ROOT / "scripts" / "flags.txt").read_text().splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "language").mkdir(exist_ok=True)

    missing: list[str] = []
    written = 0
    total = 0

    for name in names:
        svg = fetch_svg(name)
        if svg is None:
            missing.append(name)
            continue
        destination = OUT / f"{name}.svg"
        destination.write_bytes(svg)
        written += 1
        total += len(svg)

    if missing:
        print("error: no such flag upstream: " + ", ".join(missing), file=sys.stderr)
        print(
            "Check the name at https://hatscripts.github.io/circle-flags/gallery.html",
            file=sys.stderr,
        )
        raise SystemExit(1)

    with urllib.request.urlopen(LICENSE_URL, timeout=30) as response:
        (OUT / "circle-flags-LICENSE.txt").write_bytes(response.read())

    print(f"==> {written} flags in public/flags ({total / 1024:.0f} KB total)")


if __name__ == "__main__":
    main()
