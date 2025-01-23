# Sessions '24 Connect Demo

![preview](https://github.com/stripe-samples/s24-connect-demo/assets/59668283/69feff16-0cc9-4d56-a476-81d09ed15082)

## Overview

This demo is built with

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

Set up a platform with [the scenario](https://admin.corp.stripe.com/scenarios?id=scntmp*AY6-UTXCvgAAAL8d) in the country for the demo.

Unfortunately, this scenario still has a few things that need configuration once run. Do the following:

- [Set up multiple pricing groups for the platform](https://trailhead.corp.stripe.com/docs/connect-platmon-runbooks-and-development/multiple-pricing-groups-developer-guide/gate-a-platform-into-multi-pricing-groups).
  - One step is to flag in the platform token, and the client applications to https://amp.corp.stripe.com/feature-flags/flag/multi_pricing_structures
  - You also need to run a copy of [this migration](https://admin.corp.stripe.com/migrations/jobs/mijob_Q8jRqOEDBVTS0b) using [this query](https://hubble.corp.stripe.com/queries/streeter/7043d093) using the platform's token.
  - Set up the default pricing group values to be the same as the [default group](https://dashboard.stripe.com/test/settings/connect/platform_pricing/payments) on [this platform](https://admin.corp.stripe.com/login_as/acct_1OzMhEGtdpFcQNPS?redirect=test%2Fsettings%2Fconnect%2Fplatform_pricing%2Fpayments&role=urole_admin)
- Set up the margin report by copying [this excelsior](https://admin.corp.stripe.com/excelsior/AddMerchantsToGate/excl_Q8jqfRSCkgk3OJ/)
- Gate the platform into [the AV checks UI](https://admin.corp.stripe.com/gates/enable_merchant_risk_tooling_identity_av_ui)

The main thing is to make sure the configuration is the same [as this one](http://go/sei/acct_1OzMhEGtdpFcQNPS)

Install dependencies using npm:

```
npm install
```

Copy the environment file and add your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys):

```
cp .env.example .env.local
```

There are a few demo account IDs to set up, which can be gotten by running the script at `scripts/setup-accounts.py`. The script generates accounts, and then will output various account ids to fill into the environment file.

Install MongoDB Community Edition. Refer to the [official documentation](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/). Then, run MongoDB:

```
brew tap mongodb/brew && brew update
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Populating data

There is a script, at `./scripts/setup-accounts.py`, which is used to generate accounts and to create data on accounts. Run with the `-h` option to see the various options.

Once you do have accounts with data set up, run with the option `--export-sonar-data` to get a query to run, and then a migration. This causes the correct sonar data to be populated in the Dashboard.
