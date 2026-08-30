#!/bin/bash
# Generate editorial desk hero images for Nagarik Watch (no text — typography
# stays in HTML where it belongs). Style: flat editorial newspaper illustration
# in the site's warm paper + crimson palette.
set -u
OUT=/home/z/my-project/public/photos/desks
mkdir -p "$OUT"

STYLE="flat modern editorial newspaper illustration, warm cream paper background, deep crimson red and ink black palette, subtle gold accents, clean vector shapes, soft grain texture, minimalist composition with generous negative space, no text, no letters, no words, no typography"

gen() {
  local file="$1"; shift
  local subject="$1"; shift
  if [ -s "$OUT/$file" ]; then echo "skip $file (exists)"; return; fi
  z-ai image -p "$subject, $STYLE" -o "$OUT/$file" -s 1344x768 && echo "ok $file" || echo "FAIL $file"
}

gen politics.jpg "neoclassical parliament building with columns and nepali flag, government architecture"
gen society.jpg "diverse nepali community people walking in a kathmandu neighborhood street, everyday life"
gen business.jpg "stock market trading board with rising and falling candlestick charts and a bull silhouette"
gen sports.jpg "cricket stadium with ball and bat, players in action silhouette"
gen entertainment.jpg "film reel, cinema camera and musical notes, cultural performance stage curtain"
gen world.jpg "world globe with flight paths and connection arcs between continents"
gen opinion.jpg "quill pen and ink bottle on a folded newspaper, column writing, editorial desk"
gen literature.jpg "open book with himalayan mountains rising from pages, flying birds"
gen technology.jpg "circuit board patterns merging with smartphone and digital network nodes"
gen health.jpg "hospital cross, stethoscope and healing hands, public health"
gen education.jpg "classroom with blackboard, books and raised hand, school learning"
gen interview.jpg "studio microphone with speech bubbles, press conference podium"
gen photo-story.jpg "vintage camera with photo frames and light rays, visual storytelling"
gen video.jpg "video camera with play button and film clapperboard, multimedia news"
gen diaspora.jpg "airplane flying over world map with passport and suitcase, migration journey"

# OG background (composed with brand text later via PIL)
gen og-bg.jpg "broad newspaper front page abstract collage, himalayan mountain silhouette, printing press textures, deep crimson masthead band"
echo "ALL DONE"
