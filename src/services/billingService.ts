import { authenticatedFetch } from '../lib/authenticatedFetch';

export const billingService = {
  /**
   * Creates a Stripe Checkout session for a plan or top-up.
   */
  async createCheckoutSession(params: {
    productKey: 'supporter' | 'pro' | 'boost_support' | 'extra_activity_report' | 'extra_tester_recruitment';
  }): Promise<{ url: string }> {
    const response = await authenticatedFetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    return response.json();
  },

  /**
   * Creates a Stripe Customer Portal session.
   */
  async createPortalSession(): Promise<{ url: string }> {
    const response = await authenticatedFetch('/api/billing/create-portal-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    return response.json();
  }
};
