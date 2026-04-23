import { auth } from '../lib/firebase';

export const billingService = {
  /**
   * Creates a Stripe Checkout session for a plan or top-up.
   */
  async createCheckoutSession(params: {
    productKey: 'supporter' | 'pro' | 'boost_support' | 'extra_activity_report' | 'extra_tester_recruitment';
  }): Promise<{ url: string }> {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/billing/create-portal-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    return response.json();
  }
};
