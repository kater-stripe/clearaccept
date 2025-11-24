# [ZenFlow](https://zenflow.stripedemos.com/en)

###### `ZenFlow` is a fictional embedded payments SaaS platform demo for service-based merchants.

### Tech Stack

- Next.js
- React
- TypeScript
- Stripe (via. `stripe-node`)

### Important! Before you get started, read this.

- If you only need to change colors, hero image, or logo of ZenFlow we recommend going to [go/demos](https://www.stripedemos.com/demos), choosing ZenFlow, and going through the Personalization flow there.

- If you need to do Advanced Personalization like adding new Stripe features, changing text, changing the structure of the components on the UI, etc., go to [go/demos](https://www.stripedemos.com/demos), choose ZenFlow, and go to the Advanced tab to Clone to GitHub. After doing so, follow [these](#advanced-personalization-setup) instructions.

### Advanced Personalization Setup

1. Copy `env.example` and rename to `.env` then paste in your public and private API keys

   > :bulb: By going to [go/demos](https://www.stripedemos.com/demos) and finding ZenFlow you can choose the seed only option to seed your demo account with products. We strongly recommend doing this so you don't have to manually add the required product metadata.

2. Open the VS code terminal
   - Either use the shortcut `` control + ` `` or click `terminal` and `new terminal` in the top bar

3. Check your node version.

   > :warning: Please follow the directions below closely otherwise you will not be able to install dependencies or run the local development server.

   ```bash
   # Check that your `node` version matches the version in the `.node-version` file (24.11.1).
   node -v

   # If you see 24.11.1, skip to step number 4.
   # If you see another version, follow the steps below.

   # Check you have `nodenv` installed.

   nodenv -v

   # If you do not have `nodenv` installed, follow these instructions:
   # https://trailhead.corp.stripe.com/docs/frontend/setup

   # If you do have `nodenv` installed, use the command below to check what versions of node are installed.
   # A list of node versions will appear. Check if 24.11.1 is in the list.

   nodenv versions

   # If node version 24.11.1 is listed, run the following command:

   nodenv local 24.11.1

   # If node version 24.11.1 is NOT listed, run the following two commands:

   nodenv install 24.11.1
   nodenv local 24.11.1

   # Finally, ensure the your `node` version was changed correctly.

   node -v

   # You should see 24.11.1.
   ```

4. Install dependencies

   ```bash
   npm install
   ```

5. Run the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the running demo.

### Deploying Your Changes

###### If you made your own branch, follow the below instructions to deploy your demo.

1. Navigate to the [ZenFlow GitHub Repository](https://github.com/stripe-demos/demoeng-zenflow).
2. Click the "Actions" tab.
3. Click the "Build and Deploy to Cloud Run" action.
4. Click on "Run workflow".
5. Choose the name of your branch.
6. Enter a subdomain (e.g. if you are making an OCS demo for REI then enter rei-ocs).
7. Choose the "Custom" deployment type.
8. Paste in the `.env` file you made [previously](#advanced-personalization-setup).
9. Click on "Run workflow".
10. Refresh the page and you should see a new workflow running. Feel free to click into it to see the deployment progress. Once the workflow is complete your demo should be live at \<subdomain\>.stripedemos.com.

### Learn More

###### To learn more about this demo in particular or see this demo live, take a look at the following resources:

- [go/zenflow-demo](http://go/zenflow-demo) - ZenFlow Demo Instructions

- [go/demos/zenflow](http://go/demos/zenflow) - ZenFlow Live Site

###### To learn more about the Demo Engineering team, take a look at the following resources:

- [go/demoeng](https://confluence.corp.stripe.com/display/DemoEng) - Our confluence Home page where you can find our roadmap and other useful links.
- [#demos](https://stripe.enterprise.slack.com/archives/C018UF94KEY) - Public slack channel where you can ask questions.

###### To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
