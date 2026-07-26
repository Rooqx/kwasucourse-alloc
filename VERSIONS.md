# Version Substitutions

This project was built from a specification that targeted specific library versions.
The following substitutions were made, per the spec's Section 2 instructions:

| Layer | Spec Requires | Actual Version | Impact |
|---|---|---|---|
| **Next.js** | 14.x (App Router) | 16.2.10 | App Router patterns are identical. API route handler signatures use the same `NextRequest`/`NextResponse` pattern. No functional impact on this project. |
| **React** | 18.x | 19.2.4 | Fully backward-compatible for this project's usage. Server Components, hooks, and client components work the same way. |
| **TailwindCSS** | 3.x (`tailwind.config.js`) | 4.x (CSS-based `@theme inline`) | Configuration format differs — Tailwind v4 uses CSS-based config instead of `tailwind.config.js`. Color tokens are defined in `globals.css` via `@theme inline`. shadcn/ui components use the `base-nova` style which is designed for Tailwind v4. |
| **Prisma** | 5.x (`prisma-client-js`) | 7.x (`prisma-client`) | Generator name changed from `prisma-client-js` to `prisma-client` with explicit output path. Import path is `@/generated/prisma` instead of `@prisma/client`. Client API is identical for all queries used in this project. |
| **shadcn/ui** | Radix-based | Base UI (`@base-ui/react`) | Using `base-nova` style. Component APIs are very similar. Uses `@base-ui/react` primitives instead of `@radix-ui` ones. |

## Notes

- The `next-auth` package was NOT used despite being a common Next.js pattern. The spec explicitly requires custom JWT auth with `jsonwebtoken` + `bcryptjs`, with tokens stored in `localStorage`.
- The `@tanstack/react-query` package was NOT used. Data fetching is done via direct `fetch()` calls in client components and direct Prisma queries in Server Components.
