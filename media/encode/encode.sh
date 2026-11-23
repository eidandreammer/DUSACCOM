#!/bin/bash
# Web encodes for dusaccnj.org videos, always re-encoded from the original sources in ~/Downloads (never from existing mp4s).
# Each clip: per-channel match to the reference GW Bridge clip (match_<n>.txt, from match.py), then the shared
# Navy Steel grade (media/hero-video-grades/grade-c-navy-steel.ffmpeg.txt). The grade chain is unchanged.
# Outputs per clip: <name>-1080.mp4 (1920w), <name>-720.mp4 (1280w), <name>-540.mp4 (960w), <name>-poster.webp (1600w).
# Keyframes every 2 s; H.264 High, yuv420p, faststart, no audio (background clips are silent).
# Posters: ffmpeg has no libwebp here, so the frame goes out as PNG and sharp (the project's node dependency) writes the WebP.
SRC="$HOME/Downloads/dusaccnj hero videos"
OUT="$HOME/DUSACCOM/public/assets"
DIR="$HOME/DUSACCOM/media/encode"
C=$(cat "$HOME/DUSACCOM/media/hero-video-grades/grade-c-navy-steel.ffmpeg.txt")
X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an -force_key_frames expr:gte(t,n_forced*2)"
enc() { # n src name
  local g="format=rgb24,$(cat "$DIR/match_$1.txt"),$C" f="$SRC/$2" n="$3"
  ffmpeg -v error -y -i "$f" -vf "$g,scale=1920:-2:flags=lanczos,format=yuv420p" $X264 -crf 28 -maxrate 2000k -bufsize 4000k "$OUT/$n-1080.mp4"
  ffmpeg -v error -y -i "$f" -vf "$g,scale=1280:-2:flags=lanczos,format=yuv420p" $X264 -crf 29 -maxrate 1000k -bufsize 2000k "$OUT/$n-720.mp4"
  ffmpeg -v error -y -i "$f" -vf "$g,scale=960:-2:flags=lanczos,format=yuv420p" $X264 -crf 30 -maxrate 600k -bufsize 1200k "$OUT/$n-540.mp4"
  ffmpeg -v error -y -ss 0.5 -i "$f" -frames:v 1 -vf "$g,scale=1600:-2:flags=lanczos" "/tmp/$n-poster.png"
  (cd "$HOME/DUSACCOM" && node -e "require('sharp')(process.argv[1]).webp({quality:70,effort:6}).toFile(process.argv[2])" "/tmp/$n-poster.png" "$OUT/$n-poster.webp")
  echo "done $n"
}
enc 1 "a-drone-descends-over-greenery-beside-george-washi-2026-10-28-15-39-26-utc.mp4" george-washington-bridge-aerial-manhattan-skyline-golden-hour
enc 2 "washington-heights-overlooks-the-hudson-river-towa-2026-10-28-15-39-42-utc.mp4" washington-heights-aerial-george-washington-bridge-hudson-river
enc 3 "descending-to-the-george-washington-bridge-near-th-2026-11-05-18-33-31-utc.mp4" george-washington-bridge-aerial-descent-hudson-river
enc 4 "breathtaking-and-beautiful-view-of-george-washingt-2026-10-03-04-16-10-utc.mov" george-washington-bridge-night-lights-timelapse
enc 5 "statue-of-juan-pablo-duarte-founding-father-of-th-2026-10-03-12-01-33-utc.mp4" juan-pablo-duarte-statue-dominican-founding-father
echo ALLDONE
