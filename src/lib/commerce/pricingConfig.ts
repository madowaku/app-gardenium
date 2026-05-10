import { ProductKey } from "../../types/appSproutTypes";

interface PricingInfo {
  price: number;
  currency: string;
  priceId: string;
}

export const TOP_UP_CONFIG: Record<string, PricingInfo> = {
  boost_support: {
    price: 300,
    currency: 'JPY',
    priceId: 'STRIPE_BOOST_SUPPORT_PRICE_ID' // Note: This refers to the environment variable key on the backend
  },
  extra_activity_report: {
    price: 500,
    currency: 'JPY',
    priceId: 'STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID'
  },
  extra_tester_recruitment: {
    price: 500,
    currency: 'JPY',
    priceId: 'STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID'
  }
};

/**
 * Gets the display price for a top-up product.
 * In the future, this can be expanded to check user's preferred currency
 * and return formatted strings for USD, EUR, etc.
 */
export function getTopUpDisplayPrice(productKey: string, language: 'en' | 'ja'): string {
  const config = TOP_UP_CONFIG[productKey];
  if (!config) return "";

  // Currently fixed to JPY as requested
  if (config.currency === 'JPY') {
    return `¥${config.price}`;
  }

  // Placeholder for future currency logic:
  // if (userCurrency === 'USD') return `$${config.priceUsd}`;

  return `¥${config.price}`;
}
