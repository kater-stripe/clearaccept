# ClearAccept

**ClearAccept** is a fictional embedded-finance SaaS platform for service-based merchants, built as a Stripe sales demo. It showcases Stripe Capital, embedded financial accounts, card issuing, and money movement via Stripe's v2 API.

This repo is built on top of the [`demoeng-zenflow`](https://github.com/stripe-demos/demoeng-zenflow) demo (`sage` branch), customised for the ClearAccept brand. The upstream `sage` branch is the base — all ClearAccept changes live on `main` here.

---

## Demo surfaces

| Route | What it shows |
|-------|---------------|
| `/en/demo/finance` | Merchant Finance — Stripe Capital embedded component (live Stripe data) |
| `/en/demo/wallet` | ClearAccept Wallet — interactive mock wallet with localStorage state |
| `/en/demo/issuing` | Corporate Card — simulates card spend; shares balance state with the wallet slide |

The wallet and issuing slides share state via the `ca_demo_wallet` localStorage key.

---

## Tech stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Stripe Node SDK v22 (`stripe@^22.4.0-beta.1`, API version `2026-06-24.preview`)
- TanStack Query, Tailwind CSS, Headless UI

---

## Setup

Requires **Node 24.11.0** (enforced via `.node-version` + nodenv).

```bash
node -v        # must be v24.11.0

npm install
cp .env.example .env.local   # already exists with ClearAccept defaults
npm run dev    # http://localhost:3000
```

`.env.local` is pre-configured with `CURRENCY=gbp`, dark sidebar, and `DEMO_NAME=clearaccept`. Add your Stripe secret and publishable keys.

---

## Key commands

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # ESLint
npm run format   # Prettier
```

There is no test suite.

---

## Deploying

1. Go to the **Actions** tab in this repository.
2. Run the **"Build and Deploy to Cloud Run"** workflow.
3. Select your branch, enter a subdomain (e.g. `clearaccept`), choose **Custom** deployment type, and paste in your `.env.local` contents.
4. Once complete, your demo is live at `<subdomain>.stripedemos.com`.

---

## Development notes

See [`CLAUDE.md`](./CLAUDE.md) for detailed architecture notes covering the Stripe v2 API patterns, context provider hierarchy, GB Confirmation of Payee flow, and all ClearAccept-specific customisations.
