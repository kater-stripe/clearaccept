# AGENTS.md

## Tech Stack

- **Node.js**: v24.11.0 (managed via nodenv - see `.node-version`)
- **Next.js**: v15.5.6 (App Router with Server Actions)
- **React**: v19.1.0
- **TypeScript**: v5.6.3
- **Stripe**: v20.1.0-alpha.2 with @stripe/react-stripe-js and @stripe/stripe-js
- **Package Manager**: npm
- **Styling**: Tailwind CSS v4.14.0 with @tailwindcss/forms and tailwind-scrollbar
- **i18n**: i18next + react-i18next
- **State**: React Context + localStorage

## Project Structure

```
/src/app/[language]/         - All pages are language-scoped (e.g., /en, /fr)
/src/app/api/                - Server-side API logic (not Next.js route handlers, see note below)
/src/components/             - UI components organized by feature (cart, checkout, account, etc.)
/src/context/                - React Context providers (DemoConfig, Cart, DemoCustomer, ToolsPanel)
/src/constants/              - Static configuration (demoConfig, languages, currency mappings)
/src/types/                  - TypeScript type definitions
/public/locales/             - i18n JSON files (en.json, fr.json, etc.)
```

## Dev Environment

```bash
# Install (requires Node 24.11.0)
npm install

# Run dev server (localhost:3000 redirects to /default)
npm run dev

# Build for production
npm build

# Format
npm run format        # Prettier
```

## Key Patterns & Conventions

### API Structure Pattern

- Files in `/src/app/api/**/` are **NOT** Next.js route handlers (no `route.ts`)
- Instead, they export `'use server'` async functions called directly from client components
- Example: `getProducts.ts` exports `getProducts()` function, not a route handler
- We can then call `getProducts()` directly from Tantack (React) Query by using it within a `queryFn` or `mutationFn`.
- Naming: Use descriptive function names (`getProducts`, `getProductById`, not generic `route.ts`)

### Multi-Language Routing

- **All pages** must be under `/[language]/` dynamic segment
- Root `/` redirects to `/default` (see `next.config.mjs`)
- Access language in components via URL params, not Context

### Context Provider Hierarchy (Critical Order)

```tsx
QueryClientProvider
  → UmamiProvider
    → DemoConfigProvider
      → DemoMerchantProvider
        → CartProvider
          → DemoCustomerProvider
            → ToolsPanelProvider
              → HandleCallbacksProvider
```

- This order matters! Cart depends on DemoConfig, etc.
- See `/src/app/layout.tsx` for the canonical structure

### LocalStorage Keys Pattern

- All keys prefixed with demo name: `${demoName}-cart`, `${demoName}-demo-config`, etc.
- Custom storage events dispatched after updates: `new StorageEvent('local-storage', { key })`
- Enables cross-tab synchronization

### Styling

- Tailwind with **CSS variables for brand colors**:
  - `--brand-primary`, `--brand-secondary` (set via DemoConfig)
  - Contrasting text colors auto-calculated
- Use `brand-primary`, `brand-secondary` Tailwind classes, not hex codes

## Gotchas & Common Issues

### 1. Node Version Lock

- **Must use Node 24.11.0** via nodenv (not nvm!)
- Installing with wrong version causes cryptic build errors

### 2. Transpile Packages

- `@demoeng/utils` is a GitHub package, not npm
- Must be listed in `next.config.mjs` `transpilePackages` array
- Installed from: `github:stripe-demos/demoeng-utils#main`

### 3. TypeScript Build Errors Ignored in Custom Builds

- `ignoreBuildErrors: true` when `BUILD_ENVIRONMENT === 'CUSTOM'`
- Allows personalized demos to deploy with minor TS errors
- **Don't rely on this for development!**

### 4. Image Configuration

- SVGs allowed via `dangerouslyAllowSVG` (for brand logos/flags)
- All remote images permitted (http/https wildcards)
- Required for user-uploaded custom logos

### 5. Server Actions Must Use `plain()` Utility

- Stripe objects contain circular refs and non-serializable data
- Always wrap Stripe API responses with `plain()` from `@/utils/plain`
- Example: `return plain(productsWithExpandedDefaultPrice)`

### 6. Demo Config Lives in Three Places

- Default: `src/constants/demoConfig.ts` (`DEFAULT_DEMO_CONFIG`)
- Runtime: localStorage (`${demoName}-demo-config`)
- Custom: localStorage (`${demoName}-custom-demo-config`) - takes precedence
- Context merges all three via `DemoConfigContext`

### 7. Checkout Methods Are Mutually Exclusive

- `checkoutMethod` prop controls which Stripe integration renders
- Options: `'hosted-checkout'`, `'embedded-checkout'`, `'elements-checkout'`, `elements-checkout-with-checkout-sessions`
- Changing requires full page re-mount

### 8. Currency/Country Mappings

- Not all currencies support all features (e.g., Affirm, Afterpay)
- See `/src/constants/currencyCodeToCountryCodeMapping.ts` for valid combos
- Payment messaging has separate allowed lists

### 9. Onboarding Type

- `onboardingType` prop controls which Stripe Connect embedded onboarding integration is used
- Options: `embedded`, `hosted`

### 10. Charge Type

- `chargeType` prop controls what type of charge is used when completing a payment
- Options: `direct`, `destination`, `destination-on-behlaf-of` (Merchant of Record offering)

## Useful Commands

```bash
# Check current node version matches requirement
node -v  # Should output v24.11.0

# Switch to correct node version (if using nodenv)
nodenv local 24.11.0

# Run dev server on different port
PORT=3001 npm run dev
```

## Before You Commit

- [ ] Run `npm run format` (Prettier)
- [ ] Run `npm run lint` (ESLint)
- [ ] If changing Context providers, verify hierarchy order in `layout.tsx`
- [ ] If adding new locales, update `src/constants/languages.ts` AND add JSON file to `public/locales/`
- [ ] If modifying Stripe integration, test with both regular and membership accounts
- [ ] Clear localStorage and test from fresh state
- [ ] Check that root redirect still works (`/` → `/default`)

## Demo-Specific Context

This is a **Stripe internal demo platform** application:

- Designed for personalization (colors, logos, checkout methods)
- Analytics: PostHog + Umami (DO NOT REMOVE from `layout.tsx`)

When adding features, consider:

- Will this need to be configurable per demo? → Add to `DemoConfig` type
- Is this user-facing? → Needs i18n support in all locale files
