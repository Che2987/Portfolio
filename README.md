# Chethna Ajith — Portfolio

A framework-free, static multi-page portfolio: a home page plus one page per
case study. No build step, no dependencies — just HTML, CSS, and a handful
of images and PDFs.

## Structure

```
portfolio-site/
  index.html              home page (hero, featured work, about)
  pgshop/index.html        case study
  mcorp/index.html         case study
  northstar/index.html     case study
  assets/
    css/
      style.css            shared reset, design tokens, header/nav/footer
      pgshop.css            page-specific styles for that case study
      mcorp.css
      northstar.css
    js/                    page-specific scripts, if any
    images/
      landing/             images used on the home page
      pgshop/ mcorp/ northstar/   images used on each case study
  resume/
    chethna-ajith-resume.pdf
```

Each case study is its own folder containing an `index.html`, so it's
reachable at a clean URL like `/pgshop/`. Every page links the shared
`assets/css/style.css` first, then its own page-specific stylesheet, so
page CSS can rely on cascade order to override shared rules (e.g. a
narrower `.wrap` column) without `!important`.

## Previewing locally

From the `portfolio-site/` directory:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a browser. Opening `index.html`
directly (via `file://`) also works for a quick look, though relative
links between pages behave more reliably over an actual HTTP server.

## Adding a new case study

1. Create a new folder at the project root, e.g. `newproject/`, with its
   own `index.html`.
2. Copy the header/footer/nav markup from an existing case study
   (`pgshop/index.html` is a good template) so the shared structure and
   classes stay consistent.
3. Add a scoped stylesheet at `assets/css/newproject.css`. Give it its own
   `:root { --case: ...; --case-soft: ...; }` accent tokens, then only the
   rules specific to that page — don't repeat anything already in
   `assets/css/style.css`.
4. In the new page's `<head>`, link `../assets/css/style.css` first, then
   `../assets/css/newproject.css`.
5. Drop any images into `assets/images/newproject/`.
6. Add a new project card to the "Featured work" section in `index.html`,
   pointing its "View case study" link at `newproject/index.html`.
