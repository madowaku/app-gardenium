import { User, UserPlan } from "../../types/appSproutTypes";
import { adminDb } from "./admin";

/**
 * Plan configuration for usage limits.
 */
export const PLAN_LIMITS = {
  free: {
    aiSummaries: 3,
    reports: 0,
  },
  supporter: {
    aiSummaries: 10,
    reports: 1,
  },
  pro: {
    aiSummaries: 50,
    reports: 10,
  }
};

/**
 * Ensures user has an initialized usage window for the current month.
 */
export async function ensureMonthlyUsage(uid: string, user: User): Promise<User> {
  const now = new Date();
  const aiDayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const reportsMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const currentUsage = user.usage;

  const updatedUsage = {
    monthKey: reportsMonthKey,
    aiDayKey,
    reportsMonthKey,
    aiSummariesUsed: currentUsage?.aiDayKey === aiDayKey ? currentUsage.aiSummariesUsed : 0,
    reportsUsed: currentUsage?.reportsMonthKey === reportsMonthKey ? currentUsage.reportsUsed : 0,
  };

  if (
    currentUsage?.aiDayKey === updatedUsage.aiDayKey &&
    currentUsage?.reportsMonthKey === updatedUsage.reportsMonthKey &&
    currentUsage?.aiSummariesUsed === updatedUsage.aiSummariesUsed &&
    currentUsage?.reportsUsed === updatedUsage.reportsUsed
  ) {
    return user;
  }

  try {
    await adminDb.collection('users').doc(uid).update({ usage: updatedUsage });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("[Usage] Skipping monthly usage persistence:", {
        uid,
        message: error?.message,
        code: error?.code,
      });
    } else {
      throw error;
    }
  }
  return { ...user, usage: updatedUsage };
}

/**
 * Checks if user has access to a feature based on plan.
 */
export function hasFeatureAccess(user: User, allowedPlans: UserPlan[]): boolean {
  return allowedPlans.includes(user.plan) && user.planStatus === 'active';
}

/**
 * Consumes usage for a specific feature.
 * Returns true if allowed and consumed, false if limit reached.
 */
export async function consumeUsage(
  uid: string, 
  user: User, 
  feature: 'aiSummaries' | 'reports'
): Promise<{ allowed: boolean; remaining: number }> {
  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
  const currentUsage = user.usage || { aiSummariesUsed: 0, reportsUsed: 0 };
  
  const usedKey = feature === 'aiSummaries' ? 'aiSummariesUsed' : 'reportsUsed';
  const limitValue = limits[feature];
  const currentlyUsed = currentUsage[usedKey as keyof typeof currentUsage] as number;

  if (currentlyUsed >= limitValue) {
    return { allowed: false, remaining: 0 };
  }

  await adminDb.collection('users').doc(uid).update({
    [`usage.${usedKey}`]: currentlyUsed + 1
  });

  return { allowed: true, remaining: limitValue - (currentlyUsed + 1) };
}

/**
 * Ensures user top-up monthly resets are applied.
 */
export async function ensureMonthlyTopUps(uid: string, user: User): Promise<User> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

  if (user.topUps?.currentMonthKey === monthKey) {
    return user;
  }

  const updatedTopUps = {
    ...(user.topUps || {}),
    currentMonthKey: monthKey,
    boostSupportCount: 0, // Reset monthly
  };

  try {
    await adminDb.collection('users').doc(uid).update({ topUps: updatedTopUps });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("[Usage] Skipping monthly top-up persistence:", {
        uid,
        message: error?.message,
        code: error?.code,
      });
    } else {
      throw error;
    }
  }
  return { ...user, topUps: updatedTopUps };
}

/**
 * Consumes a top-up resource.
 */
export async function consumeTopUp(
  uid: string,
  user: User,
  product: 'extra_activity_report' | 'extra_tester_recruitment'
): Promise<{ allowed: boolean; remaining: number }> {
  const fieldKey = product === 'extra_activity_report' 
    ? 'extraActivityReportsRemaining' 
    : 'extraTesterRecruitmentsRemaining';
  
  const currentCount = user.topUps?.[fieldKey] || 0;

  if (currentCount <= 0) {
    return { allowed: false, remaining: 0 };
  }

  const newCount = currentCount - 1;
  await adminDb.collection('users').doc(uid).update({
    [`topUps.${fieldKey}`]: newCount
  });

  return { allowed: true, remaining: newCount };
}
