#!/usr/bin/env bash
# Regenerate Orca Beta Android icon rasters from SVG sources.
# Requires: ImageMagick (`magick`) with SVG/MSVG. Prefer solid fills in SVG
# (MSVG ignores linearGradient). No network, no SDK, no sharp required.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVG="$ROOT/svg"
PNG="$ROOT/png"
CONTACT="$ROOT/contact"
MAGICK="${MAGICK:-magick}"

mkdir -p "$PNG" "$CONTACT"

render() {
  local src="$1" dest="$2" size="$3"
  "$MAGICK" -background none -density 384 "$src" -resize "${size}x${size}" -strip "PNG32:$dest"
  echo "wrote $dest ($size)"
}

render "$SVG/orca-beta-launcher.svg" "$PNG/icon-1024.png" 1024
render "$SVG/orca-beta-adaptive-foreground.svg" "$PNG/adaptive-foreground-1024.png" 1024
render "$SVG/orca-beta-notification.svg" "$PNG/notification-icon-96.png" 96
render "$SVG/orca-beta-notification.svg" "$PNG/notification-icon-56.png" 56

cp "$PNG/icon-1024.png" "$PNG/icon.png"
cp "$PNG/adaptive-foreground-1024.png" "$PNG/adaptive-icon.png"
cp "$PNG/notification-icon-96.png" "$PNG/notification-icon.png"

"$MAGICK" "$PNG/icon-1024.png" -resize 128x128 "$PNG/after-icon-128.png"
"$MAGICK" "$PNG/adaptive-foreground-1024.png" -resize 128x128 "$PNG/after-adaptive-128.png"

viz() {
  "$MAGICK" -size "$3x$3" "xc:$2" \( "$1" -resize "$3x$3" \) \
    -gravity center -compose over -composite "$4"
}
viz "$PNG/notification-icon-96.png" '#1C1C1E' 96 "$PNG/after-notif-status-dark.png"
viz "$PNG/notification-icon-96.png" '#F2F2F7' 96 "$PNG/after-notif-status-light.png"
viz "$PNG/notification-icon-96.png" '#F2F2F7' 48 "$PNG/after-notif-light-48.png"
viz "$PNG/notification-icon-96.png" '#1C1C1E' 24 "$PNG/after-notif-24.png"

if [[ -f "$PNG/before-notification-icon.png" ]]; then
  "$MAGICK" -size 96x96 xc:'#1C1C1E' \
    \( "$PNG/before-notification-icon.png" -resize 96x96 -channel RGB -negate +channel \) \
    -gravity center -compose over -composite "$PNG/before-notif-as-white-96.png"
  "$MAGICK" -size 48x48 xc:'#F2F2F7' \
    \( "$PNG/before-notification-icon.png" -resize 48x48 -channel RGB -negate +channel \) \
    -gravity center -compose over -composite "$PNG/before-notif-light-48.png"
  "$MAGICK" -size 24x24 xc:'#1C1C1E' \
    \( "$PNG/before-notification-icon.png" -resize 24x24 -channel RGB -negate +channel \) \
    -gravity center -compose over -composite "$PNG/before-notif-24.png"
fi

"$MAGICK" "$PNG/adaptive-foreground-1024.png" -resize 256x256 \
  -stroke '#FF3B30' -strokewidth 2 -fill none -draw 'rectangle 43,43 212,212' \
  "$PNG/after-adaptive-safezone-256.png"

# Contact sheet (requires before-* previews already present)
if [[ -f "$PNG/before-icon-128.png" && -f "$PNG/before-adaptive-128.png" && -f "$PNG/before-notif-as-white-96.png" ]]; then
  "$MAGICK" -size 640x520 xc:'#111111' \
    -fill '#AAAAAA' -font Helvetica -pointsize 16 \
      -annotate +24+28 'Orca Beta icons - before (left) vs after (right)' \
    -fill '#777777' -pointsize 12 \
      -annotate +24+52 'launcher / adaptive / notification@48 / notification@24' \
    \( "$PNG/before-icon-128.png" -resize 120x120 \) -geometry +40+80 -composite \
    \( "$PNG/after-icon-128.png" -resize 120x120 \) -geometry +200+80 -composite \
    \( "$PNG/before-adaptive-128.png" -resize 120x120 -background '#111111' -flatten \) \
      -geometry +40+220 -composite \
    \( "$PNG/after-adaptive-128.png" -resize 120x120 -background '#111111' -flatten \) \
      -geometry +200+220 -composite \
    \( "$PNG/before-notif-as-white-96.png" -resize 48x48 \) -geometry +60+380 -composite \
    \( "$PNG/after-notif-status-dark.png" -resize 48x48 \) -geometry +220+380 -composite \
    \( "$PNG/before-notif-24.png" \) -geometry +360+392 -composite \
    \( "$PNG/after-notif-24.png" \) -geometry +420+392 -composite \
    \( "$PNG/before-notif-light-48.png" \) -geometry +60+450 -composite \
    \( "$PNG/after-notif-light-48.png" \) -geometry +220+450 -composite \
    -fill '#666666' -pointsize 11 \
      -annotate +360+380 '24dp status' \
      -annotate +40+370 'notif dark' \
      -annotate +40+440 'notif light' \
    "$CONTACT/before-after-contact-sheet.png"
  echo "contact -> $CONTACT/before-after-contact-sheet.png"
fi

identify "$PNG/icon-1024.png" "$PNG/adaptive-foreground-1024.png" \
  "$PNG/notification-icon-96.png" "$PNG/notification-icon-56.png"
