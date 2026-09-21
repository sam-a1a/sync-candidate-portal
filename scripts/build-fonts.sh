#!/usr/bin/env bash
#
# Rebuilds the self-hosted variable webfonts in src/fonts.
#
# In src rather than public so the bundler fingerprints them and rewrites the
# URL for whatever base the site is served from — a project page on GitHub
# Pages is not at the domain root.
#
# We self-host because Google Sans / Google Sans Flex are NOT served by the
# Google Fonts CSS API (`?family=Google+Sans` returns "400: Font family not
# found"). Both families here are SIL Open Font License 1.1, so self-hosting is
# permitted; the licences ship alongside the woff2 files.
#
# Both fonts stay VARIABLE after subsetting: M3 Expressive animates the axes
# (wght / wdth / ROND / GRAD / opsz), so instancing them to static weights
# would defeat the point. See src/styles/tokens/motion.css.
#
# Requires: python3. Creates a throwaway venv under .cache/ for fonttools.
#
# Usage:  ./scripts/build-fonts.sh [path/to/font/source/dir]
# Default source dir: ~/Desktop/Fonts

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${1:-$HOME/Desktop/Fonts}"
OUT="$ROOT/src/fonts"
VENV="$ROOT/.cache/fonttools-venv"

GSF_SRC="$SRC_DIR/Google_Sans_Flex/gsf.ttf"
GSF_LICENSE="$SRC_DIR/Google_Sans_Flex/OFL.txt"
NSA_URL="https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth,wght%5D.ttf"
NSA_LICENSE_URL="https://raw.githubusercontent.com/google/fonts/main/ofl/notosansarabic/OFL.txt"

MS_BASE="https://github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsRounded%5BFILL%2CGRAD%2Copsz%2Cwght%5D"
MS_URL="$MS_BASE.ttf"
MS_CODEPOINTS_URL="$MS_BASE.codepoints"
MS_LICENSE_URL="https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE"

# Google Fonts' own "latin" subset range. We ship English only, so latin-ext,
# Greek and Cyrillic are dropped.
LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"

# Google Fonts' "arabic" subset range, minus the Arabic mathematical alphabet.
ARABIC="U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"

if [[ ! -f "$GSF_SRC" ]]; then
  echo "error: Google Sans Flex not found at $GSF_SRC" >&2
  echo "Download it from https://fonts.google.com/specimen/Google+Sans+Flex" >&2
  exit 1
fi

if [[ ! -x "$VENV/bin/pyftsubset" ]]; then
  echo "==> creating fonttools venv"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet fonttools brotli
fi

mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

subset() {
  # subset <input.ttf> <output.woff2> <unicodes>
  # --layout-features='*' keeps every OpenType feature. This is mandatory for
  # Arabic: dropping init/medi/fina/rlig would break cursive joining.
  "$VENV/bin/pyftsubset" "$1" \
    --output-file="$2" \
    --flavor=woff2 \
    --unicodes="$3" \
    --layout-features='*' \
    --name-IDs='*' \
    --no-hinting \
    --desubroutinize
}

# Partial instancing: pin the axes we never animate, keep the ones M3
# Expressive does. gvar deltas are multiplicative across axes, so each axis we
# keep roughly doubles the file. Measured on the latin subset:
#
#   all 6 axes ................................. 1.3 MB
#   - slnt ..................................... 752 KB
#   - slnt, opsz ............................... 268 KB
#   - slnt, opsz, wdth (what we ship) .......... 104 KB
#
# Kept: wght (1..1000), ROND (0..100), GRAD (0..100).
#   wght + ROND are the expressive type-motion axes.
#   GRAD adjusts stroke weight without reflowing text - used to compensate
#   for the optical bolding of light-on-dark text in the dark scheme.
# Pinned: opsz=18 (the font's own default), wdth=100, slnt=0.
#
# If you want true optical sizing back, drop `opsz=18` below and accept
# ~250 KB. Everything else keeps working; font-optical-sizing is already
# set to auto in src/styles/fonts.css.
echo "==> Google Sans Flex (latin, wght + ROND + GRAD)"
"$VENV/bin/fonttools" varLib.instancer --quiet --update-name-table \
  -o "$TMP/gsf-partial.ttf" "$GSF_SRC" slnt=0 opsz=18 wdth=100
subset "$TMP/gsf-partial.ttf" "$OUT/google-sans-flex-latin.woff2" "$LATIN"
cp "$GSF_LICENSE" "$OUT/google-sans-flex-OFL.txt"

# Noto Sans Arabic only has wght and wdth. The M3 Expressive axes (ROND/GRAD)
# do not exist for Arabic yet - see google/fonts#10442 - so wght is the only
# type-motion axis available on the RTL side. Pinning wdth: 269 KB -> 156 KB.
echo "==> Noto Sans Arabic (arabic, wght)"
curl -sL "$NSA_URL" -o "$TMP/nsa.ttf"
"$VENV/bin/fonttools" varLib.instancer --quiet --update-name-table \
  -o "$TMP/nsa-partial.ttf" "$TMP/nsa.ttf" wdth=100
subset "$TMP/nsa-partial.ttf" "$OUT/noto-sans-arabic.woff2" "$ARABIC"
curl -sL "$NSA_LICENSE_URL" -o "$OUT/noto-sans-arabic-OFL.txt"

# Material Symbols. Subsetted by CODEPOINT, not by ligature name: pyftsubset
# closes over GSUB, so `--text="menu search person ..."` drags in every ligature
# those letters can form - 2337 glyphs, 2.5 MB. The PUA codepoints give exactly
# the icons asked for, at ~1 KB each.
#
# All four axes are kept. FILL is the important one: M3 draws an unselected nav
# item outlined and a selected one filled, and on a variable font that is an
# axis to animate rather than two icons to cross-fade.
echo "==> Material Symbols Rounded (FILL + wght + GRAD + opsz)"
curl -sL "$MS_URL" -o "$TMP/ms.ttf"
curl -sL "$MS_CODEPOINTS_URL" -o "$TMP/ms.codepoints"

ICON_NAMES=$(grep -vE '^\s*(#|$)' "$ROOT/scripts/icons.txt")
MISSING=""
CODEPOINTS=""
for name in $ICON_NAMES; do
  cp=$(awk -v n="$name" '$1 == n { print $2; exit }' "$TMP/ms.codepoints")
  if [[ -z "$cp" ]]; then
    MISSING="$MISSING $name"
  else
    CODEPOINTS="${CODEPOINTS:+$CODEPOINTS,}U+$cp"
  fi
done

if [[ -n "$MISSING" ]]; then
  echo "error: no such Material Symbol:$MISSING" >&2
  echo "Check the name at https://fonts.google.com/icons" >&2
  exit 1
fi

# --layout-features='' drops GSUB entirely; we address icons by codepoint, so
# the ligature table is dead weight.
"$VENV/bin/pyftsubset" "$TMP/ms.ttf" \
  --output-file="$OUT/material-symbols-rounded.woff2" \
  --flavor=woff2 \
  --unicodes="$CODEPOINTS" \
  --layout-features='' \
  --no-hinting
curl -sL "$MS_LICENSE_URL" -o "$OUT/material-symbols-LICENSE.txt"

# Emit the name -> codepoint map so <Icon name="..."> is typed against the set
# of icons actually in the font.
{
  echo "// GENERATED by ./scripts/build-fonts.sh from scripts/icons.txt."
  echo "// Add an icon there and re-run the script; do not edit this file."
  echo
  echo "export const ICONS = {"
  for name in $ICON_NAMES; do
    cp=$(awk -v n="$name" '$1 == n { print $2; exit }' "$TMP/ms.codepoints")
    echo "  $name: '\\u$cp',"
  done
  echo "} as const"
  echo
  echo "export type IconName = keyof typeof ICONS"
} > "$ROOT/src/components/icons.generated.ts"

echo
echo "==> done"
ls -lh "$OUT" | awk 'NR>1 {printf "    %-34s %s\n", $9, $5}'

echo
echo "==> variable axes retained"
"$VENV/bin/python" - "$OUT" <<'PY'
import sys, pathlib
from fontTools.ttLib import TTFont
for p in sorted(pathlib.Path(sys.argv[1]).glob("*.woff2")):
    f = TTFont(p)
    axes = ", ".join(
        f"{a.axisTag} {a.minValue:g}..{a.maxValue:g} (default {a.defaultValue:g})"
        for a in f["fvar"].axes
    )
    print(f"    {p.name}\n      {axes}")
PY
