# Monomi conventions

Coding patterns and rules taken from the builder's `~/Documents/Assets MFB/assetsmfb-web` (Next.js app at `apps/ibank`). Paths below are relative to `apps/ibank` unless noted. The source was read only.

Where the source does something the brief forbids, the rule says "not adopted" and the brief wins.

## 0. Principles

- **KISS, YAGNI, DRY.** Add a file, hook, abstraction, dependency or layer only when something needs it today. No wrappers around one call site, no config for one value, no "for later" code.
- **One Next.js app.** No shared UI package and no workspace tooling around it. Small UI primitives live in `components/ui/` and only get created when a second screen needs them.
- **Max 120 lines per code file, not counting imports.** Split by extracting a subcomponent, a hook or a helper. (`../../CONTRIBUTING.md`)

## 1. Structure

- **Feature code sits next to its route** in underscore folders Next does not route: `_components`, `_hooks`, `_services`, `_schemas`, `_types`, `_lib`. Create only the folders a feature uses. (`app/(protected)/send-money/*`)
- **Route groups for layout families.** (`app/(protected)/layout.tsx`) Monomi: `(marketing)`, `(worker)`, `(public)`, `(console)`, one layout each (brief 8.1a).
- **App-wide code at the app root:** `components/` (shared components, providers), `hooks/`, `lib/<domain>/` (clients, auth), `utils/` (pure helpers), `config/` (env, routes). (`components/`, `hooks/`, `lib/api/`, `lib/auth/`, `utils/format/`, `config/`)
- **Pages are thin:** render one view, wrapped in `Suspense` when it reads search params. (`app/(protected)/send-money/page.tsx`)
- **Logic in hooks, layout in components.** (`_hooks/use-asset-user-form.ts` + `_components/forms/asset-user-form.tsx`)
- **Pure builders and mappers in `_lib/`, one function per file:** `buildX`, `mapX`, `parseX`. (`_lib/build-confirm-payload.ts`, `_lib/map-beneficiary.ts`)
- **Navigation as a data array** that every nav surface reads. (`config/routes.ts`)

## 2. Data flow

- **Services: one server function per endpoint, one per file, named `verbNoun`.** (`_services/get-beneficiaries.ts`, `_services/approve-pending.ts`)
- **Services return `{ data, error }` and never throw to the caller.** `data: T | null`, `error: string | null`. (`_services/get-beneficiaries.ts`, `_actions/send-login-otp.ts`)
- **Guard inputs first and return the error shape early.** (`_services/approve-pending.ts`)
- **Endpoints as named constants at the top of the module.** (`_services/decline-pending.ts`)
- **One client per backend, created once; modules holding secrets start with `import "server-only"`.** (`lib/api/clients/api-client.ts`)
- **Errors normalised in one helper** to `{ message, status?, code?, data? }`. (`lib/api/errors/api-error.ts`)
- **Route handlers answer `NextResponse.json({ data, error }, { status })`.** (`app/api/auth/session/route.ts`)
- **Reads go through TanStack Query:** a `use-x` hook calls the service, throws `new Error(result.error)` so Query sees the failure, and exports its `X_QUERY_KEY`. (`_hooks/use-pending-approvals.ts`, `_lib/constants.ts`)
- **Query defaults:** `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 60s`. (`lib/react-query/query-client.ts`)
- **Writes are async handlers in a `use-x-submit` hook** that set `isSubmitting` and `submitError`, call the service, then invalidate the affected query keys. (`_hooks/use-send-money-submit.ts`)

## 3. State

- **Multi-step flows are a `useState` step union with named transitions** (`openReview`, `goToSuccess`, `reset`). (`_hooks/use-checker-flow.ts`, `_types/flow.ts`) Monomi capture flow: `"camera" | "review" | "uploading" | "signing" | "checking" | "result"`.
- **App-wide values in a context provider with a `useX` hook that throws outside the provider.** (`components/session-provider.tsx`, `hooks/use-session.ts`) Monomi: the connected wallet.
- **Filters and prefill in URL search params.** (`panels/pending-approvals-panel.tsx`)
- A store library (the source uses Zustand in `dashboard/_store/`) only if context plus local state stops being enough.

## 4. Forms and validation

- **TanStack Form; logic in a `use-x-form` hook that returns `form` and handlers; the component only lays out fields.** (`_hooks/use-asset-user-form.ts`, `_components/forms/asset-user-form.tsx`)
- **zod schemas in `_schemas/`, validated `onSubmit`**, cross-field checks in `superRefine`, form type via `z.input<...>`, a factory only when the schema needs runtime values. (`_schemas/asset-user.ts`)
- **Reusable field schemas take a `fieldName` and give plain messages** ("Enter a valid amount"). (`utils/validation-schemas.ts`)
- **Show a field error only once the field is touched and invalid.** (`../../packages/assets-ui/src/components/form/ui-form-input-field.tsx`)
- **Validate every external input with zod** (forms, route bodies, API responses). Brief rule; the source does it for forms only.

## 5. Errors and loading

- **Every async view renders, in order: skeleton, error box, empty box, data.** (`panels/pending-approvals-panel.tsx`)
- **Route-level `error.tsx`** showing the message with "Back to home" and "Refresh". (`app/(protected)/bulk-payment/error.tsx`)
- **Submit errors live in hook state**, shown next to the action, cleared when the step changes. (`_hooks/use-checker-flow.ts`)
- **Buttons take `loading`**, which disables them and shows a spinner. (`../../packages/assets-ui/src/components/ui-button.tsx`)
- **Retry a transient 5xx once, then give up.** (`lib/auth/session.ts`)
- **Server logs tagged `[module-name]`.** (`_services/get-beneficiaries.ts`) Not adopted: logging payloads or response bodies (`_services/execute-transfer.ts`). Never log keys, signatures, codes or photos.

## 6. Config and auth

- **Env validated with zod through `@t3-oss/env-nextjs`, split into `config/env/client.ts` and `config/env/server.ts`, `emptyStringAsUndefined: true`.** (`config/env/*`)
- **`.env.example` committed, real env files ignored.** (`.env.example`, `../../.gitignore`)
- **Protected route groups check auth in their server layout.** (`app/(protected)/layout.tsx`)
- **Auth built in one helper that every protected route calls.** (`lib/auth/get-auth-headers.ts`) Monomi: `lib/auth/verify-nep413.ts`.

## 7. Naming and components

- **kebab-case files and folders.** (throughout)
- **Hooks `useX` in `use-x.ts`; components PascalCase; feature components default-exported.** (`_hooks/`, `_components/`)
- **Constants SCREAMING_SNAKE.** (`PAGE_SIZE`, `DEFAULT_ERROR_MESSAGE` in `pending-approvals-panel.tsx`, `bulk-payment/error.tsx`)
- **Type suffixes by role:** `*Props`, `*Input`, `*Result`, `*Params`, `*Response`, `*State`. (`_services/approve-pending.ts`, `components/session-provider.tsx`)
- **Props destructured in the signature and typed `Readonly<XProps>`, the interface declared just above.** (`_components/forms/asset-user-form.tsx`)
- **`key={searchParams.toString()}` to remount a form when its prefill changes.** (`_components/forms/asset-user-form.tsx`)
- **Formatting helpers in `utils/format/`.** (`utils/format/currency.ts`) Monomi: `formatUsdc("15000000")` returns `15.00 USDC`.

## 8. Style

- **TypeScript `strict` and `noUncheckedIndexedAccess`.** (`../../packages/typescript-config/base.json`)
- **`interface` for object shapes and props, `type` for unions and derived types; string unions, no enums; `import type` for types.** (`_types/flow.ts`, `_services/execute-transfer.ts`)
- **Not adopted:** non-null `!` and `as` casts on API data (`_hooks/use-send-money-submit.ts`, `_services/approve-pending.ts`). Parse with zod instead. No `any`.
- **Tailwind v4, classes sorted by `prettier-plugin-tailwindcss`, `cn()` for merging, `cva` only for real variants.** (`../../.prettierrc`)
- **Fonts through `next/font` as CSS variables; design tokens as CSS variables in one `globals.css`.** (`app/layout.tsx`, `../../packages/ui/src/styles/globals.css`)
- **`lucide-react` icons, no emoji.** (`config/routes.ts`)
- **Prettier: no semicolons, double quotes, 2 spaces, trailing commas `es5`, 80 columns, LF.** (`../../.prettierrc`)
- **ESLint: JS + typescript-eslint recommended, React Hooks, Next core-web-vitals, Prettier last.** (`../../packages/eslint-config/next.js`)
- **Imports grouped:** React/Next, third party, `@/`, relative. (`panels/pending-approvals-panel.tsx`)
- **Comments only for a non-obvious why.** (`lib/auth/session.ts`, `components/session-provider.tsx`) Not adopted: commented-out code (`config/routes.ts`, `proxy.ts`).

## 9. Tests and commits

- **Vitest, node environment, `globals: false`, explicit imports from `vitest`, `*.test.ts` next to the file.** (`vitest.config.mts`, `hooks/use-geolocation.test.ts`)
- **jsdom per file with `/** @vitest-environment jsdom */`.** (`hooks/use-geolocation.test.ts`)
- **Mocks via `vi.hoisted` + `vi.mock`, `vi.clearAllMocks()` in `beforeEach`, test names as full sentences.** (`app/(auth)/login/_actions/send-login-otp.test.ts`)
- **Conventional commits, lower-case imperative: `feat(scope): ...`, `fix: ...`, `refactor`, `chore`.** (`git log`) Monomi scopes: `contract`, `verifier`, `agent`, `web`, `docs`.

## 10. Outside the web app (not from the source repo)

Same rules as above where they apply: small files, `{ data, error }` at boundaries, zod on every external input, plain-language errors.

- **Rust contract:** near-sdk; files split by concern (`lib.rs`, `worker.rs`, `verifier.rs`, `admin.rs`, `housekeeping.rs`, `payout.rs`, `views.rs`, `events.rs`, `errors.rs`); `require!(cond, ERR_X)` with error strings as constants; checks-effects-interactions on every transfer; one sandbox test per brief case.
- **Verifier and agent code:** plain TypeScript with no Next.js imports. Pure functions (`checks.ts`, `decide.ts`) do no I/O; I/O modules take `fetch` and config as arguments so tests can pass mocks.
- **MCP server:** three tools, a zod input per tool, handlers call `client.ts`, errors returned as plain messages.
