#!/usr/bin/env bash
set -euo pipefail

# App Gardenium Stripe test-mode Price creator
# Usage:
#   stripe login
#   export STRIPE_PRO_PRODUCT_ID=prod_xxx
#   export STRIPE_BOOST_SUPPORT_PRODUCT_ID=prod_xxx
#   export STRIPE_EXTRA_ACTIVITY_REPORT_PRODUCT_ID=prod_xxx
#   export STRIPE_EXTRA_TESTER_RECRUITMENT_PRODUCT_ID=prod_xxx
#   bash create_app_gardenium_stripe_test_prices.sh
#
# This creates new test-mode Prices for existing Products.
# It does not create or modify live-mode objects.

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env: $name" >&2
    exit 1
  fi
}

require_env STRIPE_PRO_PRODUCT_ID
require_env STRIPE_BOOST_SUPPORT_PRODUCT_ID
require_env STRIPE_EXTRA_ACTIVITY_REPORT_PRODUCT_ID
require_env STRIPE_EXTRA_TESTER_RECRUITMENT_PRODUCT_ID

command -v stripe >/dev/null 2>&1 || {
  echo "stripe CLI not found. Install/login to Stripe CLI first." >&2
  exit 1
}

echo "Creating App Gardenium test-mode prices..."
echo

PRO_PRICE_ID=$(stripe prices create \
  --currency=jpy \
  --unit-amount=980 \
  --product="$STRIPE_PRO_PRODUCT_ID" \
  --nickname="App Gardenium Pro monthly - JPY 980" \
  -d "recurring[interval]"=month \
  -d "metadata[app]"="app_gardenium" \
  -d "metadata[key]"="pro_monthly" \
  --format=json | node -pe "JSON.parse(fs.readFileSync(0, 'utf8')).id")

BOOST_PRICE_ID=$(stripe prices create \
  --currency=jpy \
  --unit-amount=300 \
  --product="$STRIPE_BOOST_SUPPORT_PRODUCT_ID" \
  --nickname="App Gardenium Display Boost 7 days - JPY 300" \
  -d "metadata[app]"="app_gardenium" \
  -d "metadata[key]"="boost_support" \
  --format=json | node -pe "JSON.parse(fs.readFileSync(0, 'utf8')).id")

DEEP_REVIEW_PRICE_ID=$(stripe prices create \
  --currency=jpy \
  --unit-amount=500 \
  --product="$STRIPE_EXTRA_ACTIVITY_REPORT_PRODUCT_ID" \
  --nickname="App Gardenium AI Deep Review - JPY 500" \
  -d "metadata[app]"="app_gardenium" \
  -d "metadata[key]"="extra_activity_report" \
  --format=json | node -pe "JSON.parse(fs.readFileSync(0, 'utf8')).id")

TESTER_BOOST_PRICE_ID=$(stripe prices create \
  --currency=jpy \
  --unit-amount=500 \
  --product="$STRIPE_EXTRA_TESTER_RECRUITMENT_PRODUCT_ID" \
  --nickname="App Gardenium Tester Recruitment Boost - JPY 500" \
  -d "metadata[app]"="app_gardenium" \
  -d "metadata[key]"="extra_tester_recruitment" \
  --format=json | node -pe "JSON.parse(fs.readFileSync(0, 'utf8')).id")

cat <<ENV

Created test Price IDs:

STRIPE_PRO_PRICE_ID=$PRO_PRICE_ID
STRIPE_BOOST_SUPPORT_PRICE_ID=$BOOST_PRICE_ID
STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID=$DEEP_REVIEW_PRICE_ID
STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID=$TESTER_BOOST_PRICE_ID

Paste these into your local test .env / deploy test environment.
ENV
