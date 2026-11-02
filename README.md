# Ars Goetica — Cinematic Landing (v2)

Open `index.html` in your browser. The demon image is embedded, so the HTML file also runs alone offline. No libraries or server required.

## Add apps (easy)

Open `index.html`, search for `APP CONFIGURATION`, then edit the `const APPS = [...]` list.

```js
const APPS = [
  { name: 'Solomon', type: 'Orchestration', description: 'The command center.' },
  { name: 'Stolas', type: 'Knowledge', description: 'Everything worth remembering.' },
  { name: 'Paimon', type: 'AI Agents', description: 'Another entity prepares to awaken.' },
];
```

Every app card automatically shows **COMING SOON** (including the details dialog); cards and unique sigils are generated dynamically, and the entity count updates automatically. You can remove, reorder, or add as many apps as needed.

Includes: scroll-driven cinematic reveal, pointer parallax, dynamic seal count, interactive spotlight/tilt cards, accessible details dialogs, and reduced-motion support.

Deploy to GitHub Pages by using `index.html` as the repository entry point.
