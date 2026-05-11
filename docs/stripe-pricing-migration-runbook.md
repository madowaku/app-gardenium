# Stripe Pricing Migration Runbook

This runbook explains how to change App Gardenium pricing without breaking checkout, webhook processing, or the meaning of purchased items.

It is written for the current billing implementation in:

- `server.ts`
- `src/lib/server/billingService.ts`
- `src/lib/server/usageService.ts`
- `src/lib/billing/plans.ts`
- `src/lib/commerce/pricingConfig.ts`
- `src/contexts/LanguageContext.tsx`

## Current Billing Shape

Current Stripe-backed product keys in code:

- `supporter` -> subscription
- `pro` -> subscription
- `boost_support` -> one-time payment
- `extra_activity_report` -> one-time payment
- `extra_tester_recruitment` -> one-time payment

Current server behavior:

- checkout uses `productKey` to choose a Stripe `Price ID`
- the Stripe `Price ID` is read from env vars
- webhook fulfillment uses `productKey`, not the numeric amount
- subscription plan sync uses the subscription item's Stripe `Price ID`

That means:

1. changing UI text alone is not enough
2. changing env vars alone is not enough
3. changing product meaning is riskier than changing product price

## Important Safety Rule

Always update in this order:

1. create new Stripe Prices first
2. update server env vars to point to the new Price IDs
3. verify checkout and webhook behavior
4. only then update UI copy and displayed prices

Do not ship a UI price change before the matching Stripe Price exists in production.

## Current Env Mapping

The current code expects these env vars:

- `STRIPE_SUPPORTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_BOOST_SUPPORT_PRICE_ID`
- `STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID`
- `STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID`

These are consumed in `src/lib/server/billingService.ts`.

## Migration Types

### A. Price-only migration

Use this when the product meaning stays the same and only the amount changes.

Examples:

- `Pro` from `¥500` to `¥980`
- `boost_support` from `¥100` to `¥300`

This is the safest migration.

### B. Positioning copy migration

Use this when the amount stays the same but the marketing language changes.

Examples:

- rename visible card copy
- improve feature explanation
- clarify who each plan is for

This is usually safe if checkout amount and product meaning do not change.

### C. Product-meaning migration

Use this when the purchased item changes what is actually fulfilled.

Examples:

- `extra_activity_report` becomes `AI Deep Review`
- `extra_tester_recruitment` becomes `Tester Recruitment Boost`

This is the riskiest migration because webhook fulfillment and remaining balances still use the old product key semantics.

For this type, do not reuse the old product key unless the fulfilled behavior is still truly the same.

## Recommended Migration Strategy

For App Gardenium, use this default rule:

- if only the price changes, reuse the existing product key and point it to a new Stripe Price
- if the fulfilled behavior changes, create a new product key in code and a new Stripe Price in Stripe

## Safe Procedure: Price-only Migration

Example target:

- `supporter`: unchanged
- `pro`: `¥500` -> `¥980`
- `boost_support`: `¥100` -> `¥300`
- `extra_activity_report`: `¥300` -> `¥500`
- `extra_tester_recruitment`: `¥300` -> `¥500`

### Step 1. Freeze the source of truth

Before editing code, write down the intended matrix:

| productKey | current | target | mode |
| --- | ---: | ---: | --- |
| `supporter` | ¥300 | ¥300 | subscription |
| `pro` | ¥500 | ¥980 | subscription |
| `boost_support` | ¥100 | ¥300 | payment |
| `extra_activity_report` | ¥300 | ¥500 | payment |
| `extra_tester_recruitment` | ¥300 | ¥500 | payment |

### Step 2. Create new Prices in Stripe

In Stripe Dashboard:

1. open the existing product for each item
2. create a new Price for the new amount
3. keep the old Price active until rollout completes
4. label the new Price clearly, for example:
   - `pro-monthly-jpy-980-2026-05`
   - `boost-support-jpy-300-2026-05`

Do not delete the old Price during rollout.

### Step 3. Rotate secrets if they were exposed

If a webhook secret or secret key was ever pasted into chat, docs, screenshots, or commits:

1. rotate `STRIPE_WEBHOOK_SECRET`
2. rotate `STRIPE_SECRET_KEY` if exposure is suspected
3. update the deployment environment
4. resend a test webhook after rotation

Treat pasted secrets as compromised.

### Step 4. Update production env vars

Update deployment env vars so each key points to the new Stripe Price ID.

Example:

```env
STRIPE_PRO_PRICE_ID=price_new_pro_980
STRIPE_BOOST_SUPPORT_PRICE_ID=price_new_boost_300
STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID=price_new_report_500
STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID=price_new_tester_500
```

If `supporter` stays unchanged, leave its env var as-is.

### Step 5. Deploy server-side config first

Deploy with the new env vars before changing visible UI price labels.

Reason:

- checkout sessions are created on the server
- if the server still points at old Stripe Prices, the UI will lie to the user

### Step 6. Smoke test checkout

Test each affected purchase path:

1. `Pro`
2. `boost_support`
3. `extra_activity_report`
4. `extra_tester_recruitment`

For each one, confirm:

- Stripe Checkout opens successfully
- displayed amount inside Stripe matches the intended amount
- success redirect returns to the app
- webhook processing succeeds
- Firestore user document updates correctly

### Step 7. Confirm fulfillment behavior

After successful payment, verify:

- `pro` updates user `plan` and `planStatus`
- `boost_support` increments `topUps.boostSupportCount`
- `extra_activity_report` increments `topUps.extraActivityReportsRemaining`
- `extra_tester_recruitment` increments `topUps.extraTesterRecruitmentsRemaining`

### Step 8. Update UI labels

Only after Stripe checkout is confirmed:

1. update `src/lib/billing/plans.ts`
2. update `src/lib/commerce/pricingConfig.ts`
3. update `src/contexts/LanguageContext.tsx`
4. verify any hardcoded display prices in `src/components/PricingPage.tsx`

### Step 9. Remove old Prices later

After production is stable and no rollback is needed:

- archive old Stripe Prices if desired
- keep internal notes of which env var moved to which Price ID

## Procedure: Product-meaning Migration

Use this if the user-facing item is no longer the same thing operationally.

Example:

- old: `extra_activity_report` = one extra activity report balance
- new: `store_review_readiness_report` = a different AI output with different fulfillment logic

Recommended steps:

1. add a new `ProductKey` in `src/types/appSproutTypes.ts`
2. add a new env var in `.env.example`
3. add a new case in `createCheckoutSession`
4. add webhook fulfillment logic for the new product
5. add UI labels and prices for the new key
6. keep the old key working until any purchased balances are exhausted

Do not silently rename the old key in UI if the backend still fulfills the old behavior.

## Rollback Procedure

If checkout becomes inconsistent after a release:

1. revert UI labels and display prices to the previous live values
2. point env vars back to the previous Stripe Price IDs
3. redeploy
4. run checkout smoke tests again
5. inspect webhook logs and Firestore user updates

Because fulfillment uses `productKey`, rollback is usually straightforward if product meaning did not change.

## Verification Checklist

Before release:

- `npm run lint`
- `npm run build`
- checkout session creation works for every affected SKU
- Stripe Checkout amount matches UI amount
- webhook signature verification works
- subscription sync still maps `STRIPE_SUPPORTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID` correctly
- success and cancel URLs are correct
- customer portal still returns to the intended page

After release:

- one successful `supporter` test
- one successful `pro` test
- one successful top-up test for each one-time SKU
- Firestore balances updated correctly
- no webhook signature failures

## Current Known Pitfall

The current implementation has two different concepts that can drift:

1. what the UI says is being sold
2. what the backend actually fulfills via `productKey`

When in doubt, trust backend fulfillment and make the UI match it until the new Stripe Price and fulfillment path are ready.

## Suggested Next Move for App Gardenium

If the goal is still:

- `Pro = ¥980`
- one-time menu repriced upward

then the next safe sequence is:

1. create new Stripe Prices
2. update production env vars
3. verify checkout in Stripe
4. re-apply the UI pricing update

If the goal is also to introduce new items such as `Store Review Readiness Report`, treat that as a new product key migration, not just a text change.
