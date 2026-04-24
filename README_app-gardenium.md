# App Gardenium

App Gardenium is a community app for growing app ideas together.  
Users can post ideas, explore concepts, join salon-style discussions, and access membership features such as billing, boosts, and AI-powered summaries.

## Overview

This project was originally scaffolded from Google AI Studio and is now maintained locally with GitHub-based version control.

Current stack:

- React 19
- Vite
- TypeScript
- Express
- Firebase / Firestore / Firebase Auth
- Firebase Admin
- Stripe
- Google GenAI

## Project Status

The project currently supports:

- local development via `server.ts`
- Firebase Admin integration
- Stripe billing integration
- membership / usage endpoints
- AI summary endpoint
- front-end pages for ideas, profiles, membership, commerce, salon, and legal pages

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm
- Firebase project access
- Stripe account and product / price setup
- Google GenAI / Gemini API access if AI features are enabled

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Then fill in the required values in `.env.local`.

Important:
- Do not commit `.env.local`
- Client-side variables should use the `VITE_` prefix
- Server-only secrets must **not** use the `VITE_` prefix

## Running the App

Start the local dev server:

```bash
npm run dev
```

The app runs through `server.ts`, which starts the Express server and mounts Vite in middleware mode for development.

Default local URL:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```
Starts the local development server through `server.ts`.

```bash
npm run build
```
Builds the front-end with Vite.

```bash
npm run start
```
Starts the app using the Node + tsx runtime.

```bash
npm run lint
```
Runs TypeScript type checking with `tsc --noEmit`.

## Environment Variables

Typical variables used by this project include:

### Client

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
```

### Server

```env
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
STRIPE_PORTAL_RETURN_URL=
STRIPE_SUPPORTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_BOOST_SUPPORT_PRICE_ID=
STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID=
STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID=
```

## Firebase Notes

This project uses Firebase both on the client and server.

Relevant files:

- `src/lib/firebase.ts`
- `src/lib/server/admin.ts`
- `firestore.rules`
- `firebase-applet-config.json`

Current Firebase project target for App Gardenium:

```text
gen-lang-client-0325724503
```

If you clone this repository for a different Firebase project, update:
- `.env.local`
- `firebase-applet-config.json`
- any related Firebase console settings

## Stripe Notes

Billing is handled on the server side.

Relevant files:

- `server.ts`
- `src/lib/server/billingService.ts`
- `src/lib/server/usageService.ts`

If `STRIPE_SECRET_KEY` is missing, billing-related endpoints will fail.  
For local development, confirm that both secret key and price IDs are configured.

## Project Structure

```text
.
├─ public/
├─ src/
│  ├─ components/
│  ├─ contexts/
│  ├─ data/
│  ├─ lib/
│  │  ├─ ai/
│  │  ├─ billing/
│  │  ├─ commerce/
│  │  └─ server/
│  ├─ pages/
│  ├─ services/
│  └─ types/
├─ server.ts
├─ firestore.rules
├─ firebase-applet-config.json
├─ package.json
└─ README.md
```

## Deployment Notes

Before deploying, verify:

- production environment variables are configured
- Firebase project settings match the intended environment
- Stripe webhook endpoint is registered correctly
- `npm run build` passes
- billing success / cancel URLs are correct
- Firestore rules are reviewed before release

## Git / Repository Workflow

Recommended workflow:

1. develop locally
2. run `npm run lint`
3. run `npm run build`
4. commit changes
5. push to GitHub
6. deploy from the tracked branch

## Security Notes

- Never commit `.env.local`
- Never expose Stripe secret keys in client code
- Never expose Firebase Admin credentials in client code
- Review Firestore rules carefully before production release

## Origin

This app was initially exported from Google AI Studio and then adapted for local development and Git-based maintenance.

## License

Add your preferred license here.
