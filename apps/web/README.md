# `@aecfolio/web`

The React Router app: the marketing pages and, from Phase 6, every signed-in screen for students, faculty, mods and admins.

```bash
app/
  app.css        the design system import and the app font
  root.tsx       document shell, public env injection, the top-level error page
  routes.ts      route config
  routes/        route modules (loaders, meta, page components)
  components/    brand/, marketing/, ui/ (our own primitives)
  lib/           api and auth clients, session lookup, the spreadsheet import helpers
```

## Styling

`app.css` imports `@aecfolio/ui/styles/app.css`, which carries Tailwind, the palette and the semantic tokens. There is no second token block in this app and no dark mode (see `packages/ui/README.md`). Write components against the semantic tokens (`bg-surface`, `text-ink`, `text-primary-text`, `border-line`), never a ramp step like `bg-neutral-50`.

Text is `text-ink` by default. `text-ink-muted` is for supporting copy that sits next to something more important, such as a description under a heading, and `text-ink-subtle` is for small hints and metadata. Neither is a default for body text.

`cv.css` never belongs in this document. The CV preview renders in an iframe.

## Scale

Keep everything restrained. The first pass made text, gaps, padding and corner radii far too large, and it read as a template rather than a college system. When in doubt, go a step smaller.

| What                                 | Use                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Home page heading                    | `text-3xl sm:text-4xl`                                                                                                 |
| Page heading everywhere else         | `text-2xl sm:text-3xl`                                                                                                 |
| Section heading inside a page        | `text-xl`                                                                                                              |
| Lead and body copy that matters most | `text-base sm:text-lg`                                                                                                 |
| Card titles and step titles          | `text-base`                                                                                                            |
| Card descriptions, hints, metadata   | `text-sm`                                                                                                              |
| Vertical padding of a page section   | `py-12 sm:py-16`, never more                                                                                           |
| Card padding                         | `p-5 sm:p-6`                                                                                                           |
| Gaps inside a block                  | `gap-3` to `gap-6`; between major columns `gap-10 lg:gap-12`                                                           |
| Corner radius                        | `rounded-xl` for cards and panels, `rounded-lg` for callouts, `rounded-md` for controls; never `rounded-2xl` or larger |
| Shadows                              | `shadow-xs` on controls, `shadow-sm` on raised cards                                                                   |

Buttons have three sizes: `sm` (h-8) for the navbar and dense toolbars, `md` (h-9) as the default and for primary calls to action, `lg` (h-10) only where a control has to be easy to hit. Don't size a button up to make it look important; its colour already does that.

The navbar and footer use Tailwind's `container` class directly. Page content uses the `Container` primitive (`max-w-6xl`, centred); long-form pages such as About narrow it with `max-w-3xl` and stay centred.

## Sections

A marketing page is a stack of full-width `Section` components, and their backgrounds alternate so each one is unmistakably separate: light blue (`primary-surface`), white, light blue, white, and so on. The alternation comes from `odd:`/`even:` on the section itself, so adding, removing or reordering sections needs no colour changes. Don't give a section its own background class, and don't wrap sections in an extra element, or the odd/even count breaks.

The home page's first section passes `emphasis`, which uses the slightly darker `primary-surface-strong` so the sign-in area stands out. It still counts as the first (light blue) section in the sequence. Nothing else uses `emphasis`.

A section is a unit of content, not a heading. The About page's title belongs in the same section as the story under it; Credits is the next section.

Don't make a section fill the viewport height (`min-h-svh` or similar) to look impressive. It adds empty space above and below the content on every laptop screen.

## Fonts

The font is self-hosted through `@fontsource-variable/*` and set once in `app.css` by overriding `--font-sans`, with `--font-heading` pointing at the same family. To try a different family, install its fontsource package, swap the `@import` and the family name in `app.css`, and nothing else changes. Loading from the Google Fonts CDN is avoided on purpose: the app runs on the college's servers, and a third-party font request costs a connection, a Lighthouse penalty and an outside dependency.

## Components

`components/ui/` holds our own primitives, styled with the tokens. Behaviour that is hard to get right by hand (dialogs, menus, selects, tooltips) comes from the headless `radix-ui` package, wrapped in a primitive here. shadcn is not used. Variants are plain objects keyed by name, not `class-variance-authority`.

Icons: brand marks (GitHub, LinkedIn and the other social icons) come from `@aecfolio/ui/icons`, the same inline SVGs the CV templates use. UI glyphs come from `lucide-react`. Import brand icons from the `/icons` subpath rather than the package root, which also pulls in the CV templates and markdown renderer.

## Motion

`motion/react` is loaded through `LazyMotion` with `domAnimation` in the marketing layout, and components use `m.*`, which keeps the animation runtime small. `MotionConfig reducedMotion="user"` respects the operating system setting. Content above the fold is never animated from `opacity: 0`: the server renders the initial style, so a fully transparent hero would delay Largest Contentful Paint until hydration. Headings start slightly translucent and offset instead. Avoid `whileInView` for content that must be readable without scrolling or before JavaScript loads.

## Auth

Sign-in is Google only and there is no sign-up. `signInWithGoogle()` in `lib/auth-client.ts` sends users to `/dashboard` on success and back to `/` on failure, where the home page reads `?error=` and explains it. `account_not_provisioned` is the case that matters: a Google account that the college has not registered.

The per-role app routes are not built yet. `/dashboard` is a placeholder behind a session check.
