# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**Уникалисты (Unicalist)** — a static marketing landing site for a Russian-language
method/community brand ("превращай уникальность в проект, аудиторию и доход").
It is a hand-written, no-framework website deployed via **GitHub Pages** to the
custom domain **unicalist.com** (see `CNAME`).

All user-facing copy is in **Russian**. Keep it that way — write UI text, headings,
and meta descriptions in Russian, matching the existing tone (direct, informal "ты",
no hype, no promises of quick money).

## Stack & structure

There is **no build step, no package manager, no dependencies to install**. The site
is plain HTML/CSS/JS served as-is. To preview locally, open the HTML files in a browser
or run any static server, e.g.:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Files:

| File / dir      | Purpose |
|-----------------|---------|
| `index.html`    | Main landing page. Sections: Hero, Концепция (`#concept`), Побег (`#escape`), Тусовка (`#crew`), Уникализатор (`#unikalizator`), final CTA, footer. |
| `email.html`    | Email capture page (`page-email` body class). Standalone form + inline `<script>`. |
| `styles.css`    | All styles for both pages. Design-token driven (CSS custom properties). |
| `script.js`     | Progressive-enhancement micro-interactions for the main page only. |
| `assets/`       | Logos/wordmarks as PNG: `y-acid.png`, `y-graphite.png`, `wordmark-acid.png`, `wordmark-graphite.png`. "acid" = lime variant, "graphite" = dark variant. |
| `CNAME`         | GitHub Pages custom domain (`unicalist.com`). Do not remove. |
| `LICENSE`       | Repository license. |

## Design system (follow these tokens)

Defined in `:root` at the top of `styles.css`. Always use the variables, never hard-code
the hex values:

- `--charcoal` `#272727` — background (dark theme only; there is no light theme)
- `--lime` `#e8ff2b` — the one signal/accent color. Use sparingly (≤ ~10% of the page): CTAs, chips, active states.
- `--olive` `#7a8239` — secondary decorative accent
- `--gray` `#8e8e8e` — muted/secondary text (`.muted`)
- `--light` `#f0f0f0` — primary text
- `--border` `rgba(255,255,255,.1)` — hairline dividers
- `--maxw` `1080px` — content max width (`.wrap`)
- `--px` `8px` — the pixel-grid module; spacing/decor derives from multiples of this

Typography: **Manrope** (Google Fonts, weights 400/600/800). Headings are `font-weight: 800`,
UPPERCASE, tight letter-spacing. Font sizes use `clamp()` for fluid scaling.

Reusable classes: `.wrap` (centered container), `.chip` / `.chip--ghost` (lime label with
pixel tail), `.btn` / `.btn--ghost` (buttons), `.card`, `.grid` + `.grid--2/3/4`,
`.section` + `.section-head`, `.lead`, `.muted`. Reuse these instead of inventing new ones.

## Conventions

- **Language & comments:** code comments in `styles.css` / `script.js` are in Russian. Match that.
- **Section anchors:** nav links point to section `id`s (`#concept`, `#escape`, `#crew`,
  `#unikalizator`). Keep ids and nav in sync if you add/rename sections.
- **CTAs** across the site link to `email.html` — the single conversion action.
- **Accessibility:** the site uses `aria-label`, `aria-hidden` on decorative elements,
  `:focus-visible` outlines, and an `sr-only` label on the email input. Preserve these.
- **Motion:** all `script.js` effects are opt-out — they are disabled under
  `prefers-reduced-motion: reduce` and gated to `pointer: fine` (mouse) devices. Effects
  use only `transform`/`opacity`. Keep any new animation within these constraints.
- **Scroll reveal:** elements matched by the `revealTargets` selector in `script.js` get
  `.reveal` → `.in` staggered on scroll. If you add content that should animate in, either
  match an existing selector or extend that list.

## Email form (important)

`email.html` posts to **Formspree**. The `action` currently contains the placeholder
`https://formspree.io/f/YOUR_FORM_ID`. While the placeholder is present, the inline script
detects it and simulates success locally (no email is actually sent). To make the form
live, create a Formspree form and replace `YOUR_FORM_ID` — do not remove the placeholder
guard logic unless you replace it with a real endpoint.

## Git & deployment workflow

- Deployment is automatic: pushing to the GitHub Pages branch publishes to unicalist.com.
  There is no CI, test suite, or lint step to run.
- Work on the branch you were assigned; commit with clear messages; push with
  `git push -u origin <branch>`. Do **not** open a pull request unless explicitly asked.
- Do not delete `CNAME` or the `assets/` files — both are required for a working deploy.

## When making changes

1. Edit HTML for structure/copy, `styles.css` for styling, `script.js` for behavior —
   keep that separation. Prefer existing tokens and classes over new ones.
2. If you add a section, update the nav in **both** `index.html` (and the anchor id) and
   keep `email.html`'s trimmed nav consistent in style.
3. Verify visually in a browser at mobile and desktop widths (the layout is
   `clamp()`/`grid`-based and responsive) — there are no automated tests to rely on.
