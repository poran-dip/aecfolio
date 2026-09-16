# `@aecfolio/ui`

The design system and the CV templates. One place where visual decisions live, so a second web app — an alumni portal, say — inherits them rather than reinventing them.

Two consumers today: `apps/worker` renders a template to a PDF, and `apps/web` will import the app stylesheet in Phase 6.

```bash
src/
  styles/     the token layer, as CSS
  icons/      literal inline SVGs
  markdown/   the two markdown renderers
  cv/         everything about CVs: types, the registry, the templates
scripts/
  build-css   compiles the CV stylesheet
  preview     renders a template to an HTML file you can open
```

---

## Colours

Two accents, from the college's own marks, and one neutral.

|           | Hex       | Where                                               |
| --------- | --------- | --------------------------------------------------- |
| Turquoise | `#0093DF` | Primary. Headings, rules, the verified mark, focus. |
| Red       | `#DF4532` | Second accent, and every destructive meaning.       |
| Neutral   | —         | Near-black ink through to white paper.              |

Each is an eleven-step OKLCH ramp in `styles/palette.css`, built so that **the college's exact hex is the 500 step** — the brand colour is literally in the palette, not approximated by it. The neutral ramp borrows the turquoise hue at very low chroma, so greys read as part of the same family rather than as a second, colder palette sitting alongside.

Tailwind's default colours are cleared (`--color-*: initial`). Every colour that reaches a screen or a PDF is one that was chosen here.

**There is no dark mode and no theme switcher.** Light only, one token set.

### Don't name a ramp step in a component

`bg-surface` survives a palette change. `bg-neutral-50` has to be found and edited. The ramps exist so the semantic tokens have something to point at; the semantic tokens are what components are written against.

Contrast on white, for the ones that carry text:

| Token                        | Ratio                                                   |
| ---------------------------- | ------------------------------------------------------- |
| `ink`                        | 14.5:1                                                  |
| `ink-muted`                  | 7.5:1                                                   |
| `ink-subtle`                 | 4.8:1                                                   |
| `ink-faint`                  | 3.1:1 — placeholders and disabled only, never body copy |
| `primary` with `primary-ink` | 4.5:1                                                   |
| `primary-text` on background | 6.6:1                                                   |
| `danger-text` on background  | 7.4:1                                                   |

`brand` is the logo colour itself and is for marks and rules that carry no text; `primary` is one step darker so white text on it clears AA. The logo colour alone only reaches 3.4:1, which is why the two are separate tokens.

---

## Two themes, two stylesheets

| File             | For              | Preflight |
| ---------------- | ---------------- | --------- |
| `styles/app.css` | the web apps     | yes       |
| `styles/cv.css`  | the CV templates | no        |

Both build on `styles/palette.css`. They are **not** variants of one theme, and this is the thing to understand before editing either.

A CV is a fixed 210mm sheet at an 11px base. It needs absolute type and absolute spacing, not a screen's rem rhythm, so `theme-cv.css` redefines `--spacing` as **1px** and replaces the whole `--text-*` scale with pixel values. Every spacing utility in a template is then literally a pixel count — `gap-20` is 20px — which is the right mental model for something that gets printed, and it keeps a template's numbers checkable against a ruler.

### Page margins live on `@page`, not on an element

This is the one thing in the file most likely to get "tidied" back into a bug.

Padding on `.cv-page` applies **once**, to that element's own box. On a multi-page PDF that puts a margin at the top of page one and the bottom of the last page and nowhere in between — every page after the first starts flush against the paper edge. Horizontal padding hides the symptom, because it applies to every line box, so the document looks correctly inset until you scroll to page two.

`@page` is the only thing that repeats per page, so it owns the margin, and `.cv-page` carries no width, height or padding at all. The rule is deliberately _not_ inside `@media print`: the worker renders with the media type emulated as `screen`, so a print-only block would never apply, whereas `@page` is honoured whenever the document is paginated. Puppeteer's own `margin` option is not used either — the margin is a template option, and the worker has no business knowing which density a template chose.

A browser ignores `@page`, so on screen the sheet is drawn by hand through the opt-in `.cv-sheet` class, which reads the same custom properties. The standard template emits its own `@page` rule per render and builds both from one `Density` record, so the printed margin and the previewed sheet cannot disagree.

Related: **`break-inside: avoid` does not belong on a whole section.** A section taller than a page cannot fit anywhere, so the browser pushes it to the next page and breaks it there anyway — with a long Projects list that left most of page one blank. What was worth saying is that a heading stays with what follows it, which is `break-after: avoid` on the heading. `cv-break-avoid` stays on individual entries, which are small enough for it to mean something.

### The boundary the print theme buys

> **`cv.css` belongs in its own document** — the worker's PDF page, or a preview iframe. Injected into the app document it would silently retune every app utility on the page.

This is why the live CV preview in Phase 6 wants an iframe. An iframe is the right call there anyway: it is the only way the preview paginates like the PDF.

### The app stylesheet

One line, and a web app has the system:

```css
@import "@aecfolio/ui/styles/app.css";
```

It is shipped as source, not as a compiled bundle, so the consuming app's own Tailwind run scans the app's components too. Fonts are _named_ in `theme-app.css` and loaded by the app — this package has no opinion about whether they come from a CDN, `@fontsource`, or a self-hosted file.

### The CV stylesheet

Built by the Tailwind CLI:

```bash
pnpm -F @aecfolio/ui build:css
```

It writes two things:

- `dist/cv.css` — for anything that can load a file
- `src/cv/generated/stylesheet.ts` — the same CSS as an exported string

The worker uses the string. It renders a template to markup and hands the whole document to Puppeteer as a `data:` URI, and a `data:` document can resolve no relative URL and fetch no stylesheet, so the CSS has to already be inside the bundle. Exporting it as a module means the worker's bundler inlines it and there is no path to resolve at runtime, in a container or anywhere else.

**The generated file is committed.** It has to exist for `tsc` to typecheck this package on a fresh clone, and Turbo's `typecheck` only waits on _dependencies'_ builds, not this package's own. `stylesheet.test.ts` recompiles and compares, so "forgot to rebuild the CSS" is a red test rather than a CV that renders unstyled in production and nowhere else.

Two things about the build that are not obvious:

- Preflight is omitted deliberately (`@import "tailwindcss/theme.css"` + `utilities.css`, no `preflight.css`). A scoped reset under `.cv-page` does the same job without reaching outside the sheet.
- `src/cv/generated` is excluded from the source scan. The compiled CSS is written back into a scanned directory, and left in, every class name in the output reads as a class name in a source file — each build a superset of the last, growing until it converges.

---

## Icons

Literal inline `<svg>`, one per file, no icon library.

lucide-react and simple-icons both build their icons through a factory, and those did not survive the worker's render-to-string → `data:` URI → Puppeteer path reliably. A plain inline `<svg>` has nothing to resolve at runtime and always renders. The geometry is copied from those libraries; the indirection is not.

Every icon takes one prop, `className`, and nothing else. Size comes from the class (they declare `1em`, so they inherit the surrounding font size by default); colour comes from `currentColor` in every case, outline and solid alike.

`socialIcon(title)` picks the icon for a social link from its free-text title. The map is keyed off `SOCIAL_PLATFORMS` in `@aecfolio/shared`, so adding a platform there fails to typecheck here until it has an icon — which is the only way a social link on a CV cannot end up unlabelled. An unrecognised title is normal, not an error, and gets the generic link mark.

`apps/web` keeps its own icon library. This constraint is about the render path the worker uses, not about the app.

---

## Markdown

Every text field on a CV takes markdown, not just the bodies — a student can bold one word of a job title or italicise a publication name.

|                    |                                                    |
| ------------------ | -------------------------------------------------- |
| `<Markdown>`       | bodies: descriptions, bios, custom-section entries |
| `<MarkdownInline>` | titles, subtitles, organisations, dates            |

`MarkdownInline` emits no block element at all. It allows `em`, `strong`, `del`, `code`, `a` and `br`, and unwraps everything else — children survive, boxes do not — so a stray `#` at the start of a job title cannot turn that title into a heading and blow the row apart.

Both render to real React elements rather than an HTML string, which is what makes them behave identically under the worker's `renderToStaticMarkup` and in a browser preview.

**Safety, and why there is no sanitiser.** `rehype-raw` is deliberately not installed, so raw HTML in the source is inert — a `<script>` pasted into a bio prints as those literal characters instead of running. `javascript:` hrefs are emptied by react-markdown's default URL transform. Nothing to configure, nothing to forget to apply.

**Markdown images are dropped.** `![](https://anything)` becomes a real `<img src>`, and the worker inlines every remote `<img>` it finds by fetching it from inside the Docker network. Allowing images in a bio would hand that fetch a student-controlled URL — a new way into an SSRF that is already scheduled for removal, reached through a field with no reason to carry a picture. The avatar and the proof files are data, not markdown.

Styling for both lives in `cv.css` as `.cv-prose` / `.cv-prose-inline`. The CV reset strips every list marker and margin in the document, so without those classes a markdown list renders as unmarked, unindented lines.

---

## CV templates

### Summary and Skills are sections, not switches

They read from `students.bio` and `students.skills` rather than a table of their own, which makes them look like they should be on/off options. They are not: a student should be able to move the summary below their projects, and a switch cannot express that. Both are entries in `BUILT_IN_CV_SECTION_TYPES`, so inclusion and order come from the saved section config like everything else.

They have no entries to order, and each returns nothing when it has nothing to say — an included-but-empty Summary costs no orphaned heading and rule, so nobody has to remember to exclude it as well as leaving the bio blank.

### Every template has its own manifest

Templates do not all support the same sections or expose the same switches, and the alternative to a manifest each is one shared config that grows a special case per template.

```ts
{
  id, name, description,
  supportedSections,   // what it can draw
  defaultSections,     // what a student starts with, in order
  sectionNotes,        // anything the builder UI has to explain
  optionsSchema,       // a zod schema — this template's own options
}
```

Options are stored in `cv_preferences.options` and `cv_exports.options` as an opaque jsonb bag. `@aecfolio/shared` deliberately does not know their shape: which options exist is a property of one template, and putting the schema there would mean editing the contract layer every time a template gained a switch, and a second place for that list to be wrong.

`parseTemplateOptions()` never throws. A stored bag may have been written by an older version of this template, or by a different template entirely if the student switched; the right response to any of that is the template's defaults, not a failed export. A CV that renders with default spacing beats a 500.

### Two entry points besides the main one

- **`@aecfolio/ui/manifests`** is every manifest, `parseTemplateOptions`, `defaultSectionsConfig` and the `CvData` types, with no React in it. The API imports it to reject unknown templates, drop sections a template cannot draw and normalise options before they go into a cache key. `src/cv/manifests.ts` must not import a template component or the registry; `registry.test.tsx` checks that, and checks that every manifest has a renderer and every renderer a manifest.
- **`@aecfolio/ui/fixtures`** exports `makeCvData()`, so the worker's PDF tests render the same awkward fixture the template tests do.

`printsPhoto(options)` on a manifest tells the API whether this render will show the photo. The API reads the avatar out of the bucket and inlines it only when it will, since the worker fetches nothing.

### Adding a template

A directory under `src/cv/templates/`, a manifest, an options schema, one line in `manifests.ts` and one line in `registry.tsx`. Nothing outside that file needs to know — the picker reads `listTemplateManifests()`, the export path looks it up by id.

Template ids are stored in the database. Renaming one orphans every saved preference for it.

### Options change tokens, not class names

Tailwind only generates classes it can see as complete strings in the source, so an option that picked a class name would need a lookup table of every combination. The standard template's `accent` and `density` write CSS custom properties onto the page root instead, overriding the tokens the utilities already read. One inline style, and it cannot fall out of sync with the stylesheet.

### The verified mark

A bare checkmark, linked to its proof where there is one. Never the word "Verified" — in a view where everything shown is verified by construction the word is noise, and the mark's job is to be a handle on the evidence.

**`mark` is an input to the template, never derived from `status`.** The same verified achievement prints _with_ a mark in a faculty export and the same pending one prints _without_ one, unmarked but present, in the student's own export. The caller knows which export shape it is building; the template does not, and must not guess.

| `mark`               | prints                                     |
| -------------------- | ------------------------------------------ |
| `{ proofUrl: "…" }`  | checkmark, linked                          |
| `{ proofUrl: null }` | bare checkmark — verified, nothing to open |
| `null`               | nothing at all                             |

`null` means nothing at all: no greyed tick, no "pending" pill. The absence of a mark is the signal. A bare mark covers a verified claim whose `proofKey` is null, a result (that table has no proof column), and the CGPA (derived from verified semesters, so there is no single object to point at). A link that 404s is worse than no link.

On a certification, the checkmark and the credential link are **two different things and stay separate**: the checkmark opens the proof the college actually reviewed, the arrow opens the issuer's own page, which nobody here has seen. Pointing the mark at the issuer would make it vouch for something it does not.

**Review metadata never reaches a document.** `reviewedBy` and `reviewedAt` are a screen concern. A CV that leaves the college prints the checkmark and theproof link, not a named reviewer. Rejection reasons are owner-only and print nowhere.

### Working on a template

```bash
pnpm -F @aecfolio/ui preview
pnpm -F @aecfolio/ui preview -- --accent ink --density compact
```

Writes `preview/<template>.html` — the same markup and the same stylesheet the worker puts in front of Puppeteer, so what the browser shows is what the PDF will be, minus pagination. The fixture behind it (`src/cv/fixtures.ts`) is deliberately awkward: markdown in a title as well as a body, a verified claim with no proof, a pending claim, an unrecognised social title, a student whose location is not the college's.

---

## Which student fields reach a CV

Not every column belongs on every document, and two of the omissions are decisions rather than gaps.

|                                                                     | standard template                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| name, email, phone, location, photo                                 | header — photo behind `showPhoto`                       |
| `titleSought`                                                       | header, beside the name; hidden when the field is empty |
| course, branch, admissionYear, cgpa, semester                       | subtitle and Education                                  |
| bio                                                                 | the Summary section                                     |
| skills, `spokenLanguages`                                           | the Skills section — languages behind `showLanguages`   |
| `rollNo`                                                            | not rendered                                            |
| `dob`, `gender`                                                     | not rendered                                            |
| `caste`, `religion`, `motherName`/`Contact`, `fatherName`/`Contact` | **deliberately never rendered**                         |

The last row exists for a **biodata template that has not been built yet** — the format some government and PSU applications still expect. They are not stray columns and they are not to be "tidied up" onto this template; a test asserts none of them can reach it. `dob` and `gender` belong to the same family and land with it.

`rollNo` is a genuine gap rather than a decision. It would go in the Education section next to the degree, not the header: it means something to the college and nothing to an outside recruiter.

## Known gaps

- **`apps/web` has not moved onto any of this yet.** It still has shadcn and its own token block; `styles/app.css` is here waiting for Phase 6.
