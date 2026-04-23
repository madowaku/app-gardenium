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
    description: 'A seat to keep going. Read development logs and watch the greenhouse grow.',
    stripePriceId: 'price_supporter_monthly_placeholder', // REPLACE with real Stripe Price ID
    features: [
      'Read greenhouse WIP posts',
      'Support with cheers and comments',
      'Community dev map access',
      'Gentle supporting role'
    ],
    checkoutMode: 'subscription',
    isActive: true,
    accentColor: '#10b981' // emerald-500
  },
  pro_monthly: {
    id: 'pro_monthly',
    plan: 'pro',
    displayName: 'Pro',
    priceLabel: '¥500',
    priceAmount: 500,
    billingCycle: 'monthly',
    description: 'A seat to move forward. Post your progress, get feedback, and boost your seeds.',
    stripePriceId: 'price_pro_monthly_placeholder', // REPLACE with real Stripe Price ID
    features: [
      'Post items in greenhouse',
      'Apply for spotlight boosts',
      'AI seedling analysis',
      'Priority tester calls',
      'Direct builder feedback'
    ],
    checkoutMode: 'subscription',
    isActive: true,
    accentColor: '#0ea5e9' // sky-500
  }
};
