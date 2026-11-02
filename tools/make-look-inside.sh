#!/bin/sh
# Page pictures for "Look inside": the first five pages of every sample PDF,
# as small JPEGs beside it (samples/<skill>/<level>-p<N>.jpg). Needs poppler.
cd "$(dirname "$0")/../output/data/catalog/samples" || exit 1
for pdf in */[123].pdf; do
  base="${pdf%.pdf}"
  [ -f "$base-p1.jpg" ] && continue
  pdftoppm -jpeg -jpegopt quality=72 -scale-to 640 -f 1 -l 5 "$pdf" "$base-p"
  # pdftoppm numbers pages with padding that depends on the page count; normalise to -p1..-p5.
  for f in "$base"-p-*.jpg; do
    [ -f "$f" ] || continue
    n=$(echo "$f" | sed 's/.*-p-0*\([0-9]*\)\.jpg/\1/')
    mv "$f" "$base-p$n.jpg"
  done
done
