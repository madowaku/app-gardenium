# Stripe Dashboard Checklist

Use this checklist when updating App Gardenium pricing in Stripe Dashboard.

Related runbook:

- `docs/stripe-pricing-migration-runbook.md`

## First Decision

Choose one path before opening Stripe:

### Path A. Price-only migration

Use this when:

- the product meaning stays the same
- only the amount changes

For the current App Gardenium target, this is the recommended path.

### Path B. New product migration

Use this when:

- the purchased item means something new
- webhook fulfillment or remaining balance semantics change

Examples:

- `extra_activity_report` becomes a truly different product
- `extra_tester_recruitment` becomes a different fulfillment flow

## What To Create: Price-only Migration

If the intended rollout is:

- `supporter`: keep `¥300`
- `pro`: change `¥500` -> `¥980`
- `boost_support`: change `¥100` -> `¥300`
- `extra_activity_report`: change `¥300` -> `¥500`
- `extra_tester_recruitment`: change `¥300` -> `¥500`

Then in Stripe Dashboard create:

- **0 new Products**
- **4 new Prices**

Why 4:

- `supporter` is unchanged
- the other 4 items need new Price IDs

## Exact Create List For Path A

Create these new Prices under the existing Stripe Products:

1. `pro`
   - new recurring monthly JPY price
   - amount: `¥980`

2. `boost_support`
   - new one-time JPY price
   - amount: `¥300`

3. `extra_activity_report`
   - new one-time JPY price
   - amount: `¥500`

4. `extra_tester_recruitment`
   - new one-time JPY price
   - amount: `¥500`

## Recommended Price Labels In Stripe

Use labels that make rollback easy.

Examples:

- `pro-monthly-jpy-980-2026-05`
- `boost-support-jpy-300-2026-05`
- `extra-activity-report-jpy-500-2026-05`
- `extra-tester-recruitment-jpy-500-2026-05`

## Stripe Dashboard Click Checklist

For each affected item:

1. open the existing Product
2. click `Add another price`
3. choose correct billing type
4. choose `JPY`
5. enter the new amount
6. save
7. copy the new `price_...` ID
8. paste it into your migration note

## Billing Type Checklist

Match the current server behavior exactly:

- `supporter` -> recurring / monthly
- `pro` -> recurring / monthly
- `boost_support` -> one-time
- `extra_activity_report` -> one-time
- `extra_tester_recruitment` -> one-time

If billing type is wrong, checkout mode and fulfillment will drift.

## Env Mapping Checklist

After creating the new Stripe Prices, update only the affected env vars:

```env
STRIPE_PRO_PRICE_ID=price_new_pro_980
STRIPE_BOOST_SUPPORT_PRICE_ID=price_new_boost_300
STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID=price_new_report_500
STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID=price_new_tester_500
```

Leave these unchanged if they are not changing:

```env
STRIPE_SUPPORTER_PRICE_ID=price_existing_supporter_300
```

## Do Not Do These Yet

Before verification is complete:

- do not delete old Prices
- do not archive old Products
- do not update UI display prices first
- do not rename a product in UI if webhook fulfillment still uses the old meaning

## Verification Pass After Stripe Changes

Once the new Prices exist and env vars are updated:

1. open checkout for `Pro`
2. confirm Stripe shows `¥980`
3. open checkout for `boost_support`
4. confirm Stripe shows `¥300`
5. open checkout for `extra_activity_report`
6. confirm Stripe shows `¥500`
7. open checkout for `extra_tester_recruitment`
8. confirm Stripe shows `¥500`

Only after this should UI copy and display prices be updated.

## What To Create: New Product Migration

Use this only if the product meaning changes.

Example:

- old: `extra_activity_report`
- new: `store_review_readiness_report`

For each truly new product, create:

- **1 new Product**
- **1 new Price**

And outside Stripe, also add:

- 1 new `ProductKey` in code
- 1 new env var
- 1 new checkout mapping case
- 1 new webhook fulfillment path
- 1 new UI purchase label

## Count Examples For Path B

### Example 1: Add only `store_review_readiness_report`

Create:

- **1 new Product**
- **1 new Price**

### Example 2: Add both `store_review_readiness_report` and `share_boost_premium`

Create:

- **2 new Products**
- **2 new Prices**

## Current App Gardenium Recommendation

Right now, the safest Dashboard plan is:

- keep `supporter` as-is
- create **4 new Prices**
- create **0 new Products**

That gets pricing migration done without changing fulfillment semantics.

## Security Checklist

If a Stripe secret was pasted into chat, docs, screenshots, or commits:

1. rotate the webhook secret
2. update deployment env vars
3. resend a test webhook
4. verify webhook delivery succeeds again

Treat exposed Stripe secrets as compromised.
