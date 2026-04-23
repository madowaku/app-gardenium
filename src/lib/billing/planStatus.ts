import { PlanStatus, User } from '../../types/appSproutTypes';

/**
 * UI-friendly membership status keys.
 * These are used by the translation system to display human-readable labels/descriptions.
 */
export type MembershipUiState = 
  | 'active'
  | 'pending_activation'
  | 'renewing'
  | 'payment_issue'
  | 'cancel_scheduled'
  | 'canceled'
  | 'expired';

/**
 * Maps technical plan statuses (from Firestore/Stripe) to user-centric UI states.
 * 
 * @param planStatus The technical status (active, past_due, etc.)
 * @param cancelAtPeriodEnd Whether the subscription is set to cancel at the end of the term
 * @returns A MembershipUiState key
 */
export const mapPlanStatusToUiState = (
  planStatus: PlanStatus | undefined,
  cancelAtPeriodEnd: boolean | undefined
): MembershipUiState => {
  if (!planStatus || planStatus === 'inactive') {
    return 'expired';
  }

  // Handle scheduled cancellations
  if (cancelAtPeriodEnd && planStatus === 'active') {
    return 'cancel_scheduled';
  }

  switch (planStatus) {
    case 'active':
      // By default, active means it's set to renew
      return 'active';
    case 'past_due':
      return 'payment_issue';
    case 'canceled':
      return 'canceled';
    default:
      return 'active';
  }
};

/**
 * Convenience helper for getting current UI state from a User object.
 */
export const getMembershipUiState = (user: Partial<User>): MembershipUiState => {
  // If no plan, it's basically expired/free
  if (user.plan === 'free' || !user.plan) {
    return 'expired';
  }
  
  return mapPlanStatusToUiState(user.planStatus, user.cancelAtPeriodEnd);
};
