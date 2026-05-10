import { UserPlan } from '../../types/appSproutTypes';

export interface PlanDefinition {
  id: string;
  plan: UserPlan;
  displayName: string;
  priceLabel: string;
  priceAmount: number;
  billingCycle: 'monthly' | 'yearly';
  description: string;
  stripePriceId: string;
  features: string[];
  checkoutMode: 'subscription';
  isActive: boolean;
  accentColor: string;
}

export const APP_PLANS: Record<string, PlanDefinition> = {
  supporter_monthly: {
    id: 'supporter_monthly',
    plan: 'supporter',
    displayName: 'Supporter',
    priceLabel: '¥300',
    priceAmount: 300,
    billingCycle: 'monthly',
    description: 'A seat for steady nurturing. Keep posting, run the Growth Agent, and shape early tester outreach.',
    stripePriceId: 'price_supporter_monthly_placeholder', // REPLACE with real Stripe Price ID
    features: [
      'Post more ideas and dev logs',
      'Growth Agent up to 10 times / month',
      'Tester Strategy and Share Boost drafts',
      'Greenhouse access and Supporter badge'
    ],
    checkoutMode: 'subscription',
    isActive: true,
    accentColor: '#10b981' // emerald-500
  },
  pro_monthly: {
    id: 'pro_monthly',
    plan: 'pro',
    displayName: 'Pro',
    priceLabel: '¥980',
    priceAmount: 980,
    billingCycle: 'monthly',
    description: 'A seat for launch preparation. Organize next steps, review store risks, and get share-ready copy.',
    stripePriceId: 'price_pro_monthly_placeholder', // REPLACE with real Stripe Price ID
    features: [
      'Growth Agent up to 50 times / month',
      'Store Review Readiness',
      'Share Boost variants and SEO / OGP copy',
      'Tester recruitment boost and one monthly priority boost'
    ],
    checkoutMode: 'subscription',
    isActive: true,
    accentColor: '#0ea5e9' // sky-500
  }
};
