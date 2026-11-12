# Kiki prototypes — portfolio build

A portfolio cut of the Kiki prototype gallery, for embedding on
nhallam.design. Built by `node gallery/portfolio.mjs` (run on the
`flow-gallery` branch); do not edit `index.html` by hand.

What it is:

- **One self-contained file.** `index.html` (~9 MB) embeds every frozen
  prototype build, the user journey map and the card options page. No
  other assets, no network requests, no build step. Serve it from any
  static host, same-origin or iframe both work.
- **Prototypes only.** The client handover page and walkthrough videos
  are excluded on purpose.
- **Recoloured.** The client's teal brand is shifted to a blue hero
  colour (#2048a5 family) with neutral black/white chrome, applied
  consistently through every embedded build. Semantic colours (amber
  pending, red error) are untouched.

To put it on a site: copy `index.html` wherever the site serves static
files (rename freely, e.g. `kiki.html`), then either link to it directly
or embed it full-bleed:

    <iframe src="/kiki.html" style="width:100%;height:100vh;border:0"></iframe>

It manages its own internal navigation via the URL hash and needs
nothing from the parent page. Preview of this exact file:
https://kiki-nick.vercel.app/portfolio/
