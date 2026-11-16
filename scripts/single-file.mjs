// Packs the built site into one self-contained page (styles and script inside it) for sharing as a preview.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const dir = 'dist/assets/';
const files = readdirSync(dir);
const css = readFileSync(dir + files.find((f) => f.endsWith('.css')), 'utf8');
const js = readFileSync(dir + files.find((f) => f.endsWith('.js')), 'utf8').replace(/<\/script/gi, '<\\/script');
const page = `<title>Hopcount</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Pinyon+Script&family=Arimo:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync('dist/hopcount-preview.html', page);
console.log('preview page', (page.length / 1024).toFixed(0) + ' KB');
