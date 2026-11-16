# Hopcount (working name)

A path-map learning site for networking, cloud and AI infrastructure, built on the same foundation as berniebrice.com
(React, Vite, Tailwind, one design-tokens file).

- `src/content/` holds the lessons. Each certification stop maps to one line of the official exam topics and lists its sources and the date it was checked.
- `src/app/` holds the app: map, lesson pages, practice tools and progress (saved in the learner's browser only).
- `npm run preview-page` builds the site and packs it into one self-contained page at `dist/hopcount-preview.html`.

CCNA content follows 200-301 v2.0 (tested from 3 February 2027). Practice questions are original.
