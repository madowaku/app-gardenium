import Stripe from "stripe";
import { adminDb } from "./admin";
import { User, UserPlan, PlanStatus, ProductKey } from "../../types/appSproutTypes";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27" as any,
    })
  : null;

function getNow() {
  return Date.now();
}

function mapStripeStatus(status: Stripe.Subscription.Status): PlanStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

function getPlanFromPriceId(priceId?: string | null): UserPlan | null {
  if (!priceId) {
    return null;
  }

  if (priceId === process.env.STRIPE_SUPPORTER_PRICE_ID) {
    return "supporter";
  }

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  return null;
}

async function findUidByCustomerId(customerId?: string | null): Promise<string | null> {
  if (!customerId) {
    return null;
  }

  const snapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].id;
}

async function handlePaymentCompleted(session: Stripe.Checkout.Session) {
  const uid = session.metadata?.uid;
  const productKey = session.metadata?.productKey as ProductKey | undefined;

  if (!uid || !productKey) {
    return;
  }

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const currentTopUps = userSnap.data()?.topUps || {};

  if (productKey === "boost_support") {
    await userRef.set(
      {
        topUps: {
          ...currentTopUps,
          boostSupportCount: (currentTopUps.boostSupportCount || 0) + 1,
          boostSupportLastPurchasedAt: getNow(),
        },
      },
      { merge: true }
    );
    return;
  }

  if (productKey === "extra_activity_report") {
    await userRef.set(
      {
        topUps: {
          ...currentTopUps,
          extraActivityReportsRemaining: (currentTopUps.extraActivityReportsRemaining || 0) + 1,
        },
      },
      { merge: true }
    );
    return;
  }

  if (productKey === "extra_tester_recruitment") {
    await userRef.set(
      {
        topUps: {
          ...currentTopUps,
          extraTesterRecruitmentsRemaining: (currentTopUps.extraTesterRecruitmentsRemaining || 0) + 1,
        },
      },
      { merge: true }
    );
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  const uid =
    subscription.metadata?.uid || (await findUidByCustomerId(customerId));

  if (!uid) {
    return;
  }

  const plan = getPlanFromPriceId(subscription.items.data[0]?.price?.id) || "free";
  const planStatus = mapStripeStatus(subscription.status);

  await adminDb.collection("users").doc(uid).set(
    {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscription.id,
      plan,
      planStatus,
      planStartedAt: subscription.start_date ? subscription.start_date * 1000 : getNow(),
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? subscription.items.data[0].current_period_end * 1000
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    { merge: true }
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  const uid =
    subscription.metadata?.uid || (await findUidByCustomerId(customerId));

  if (!uid) {
    return;
  }

  await adminDb.collection("users").doc(uid).set(
    {
      plan: "free",
      planStatus: "inactive",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    { merge: true }
  );
}

function requireStripe() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local");
  }
  return stripe;
}

/**
 * Gets or creates a Stripe Customer for a Firebase User.
 */
export async function getOrCreateCustomer(uid: string, user: User) {
  const stripeClient = requireStripe();

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripeClient.customers.create({
    email: user.name.includes("@") ? user.name : undefined,
    metadata: { uid },
  });

  await adminDb.collection("users").doc(uid).update({
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * Creates a Checkout Session for a subscription or one-time payment.
 */
export async function createCheckoutSession(uid: string, user: User, productKey: ProductKey) {
  const stripeClient = requireStripe();
  const customerId = await getOrCreateCustomer(uid, user);

  let priceId = "";
  let mode: any = "subscription";

  switch (productKey) {
    case "supporter":
      priceId = process.env.STRIPE_SUPPORTER_PRICE_ID || "";
      mode = "subscription";
      break;
    case "pro":
      priceId = process.env.STRIPE_PRO_PRICE_ID || "";
      mode = "subscription";
      break;
    case "boost_support":
      priceId = process.env.STRIPE_BOOST_SUPPORT_PRICE_ID || "";
      mode = "payment";
      break;
    case "extra_activity_report":
      priceId = process.env.STRIPE_EXTRA_ACTIVITY_REPORT_PRICE_ID || "";
      mode = "payment";
      break;
    case "extra_tester_recruitment":
      priceId = process.env.STRIPE_EXTRA_TESTER_RECRUITMENT_PRICE_ID || "";
      mode = "payment";
      break;
    default:
      throw new Error(`Invalid product key: ${productKey}`);
  }

  if (!priceId) {
    throw new Error(`Stripe Price ID not configured for product: ${productKey}`);
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { uid, productKey },
    success_url: process.env.STRIPE_SUCCESS_URL!,
    cancel_url: process.env.STRIPE_CANCEL_URL!,
  });

  return session.url;
}

/**
 * Creates a Customer Portal Session.
 */
export async function createPortalSession(customerId: string) {
  const stripeClient = requireStripe();

  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.STRIPE_PORTAL_RETURN_URL!,
  });

  return session.url;
}

/**
 * Handles Webhook Events to sync Firestore.
 */
export async function handleStripeEvent(event: Stripe.Event) {
  const stripeClient = requireStripe();
  const eventId = event.id;

  const eventDoc = await adminDb.collection("stripe_events").doc(eventId).get();
  if (eventDoc.exists) {
    console.log(`Event ${eventId} already processed`);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        await handlePaymentCompleted(session);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const sub = await stripeClient.subscriptions.retrieve(invoice.subscription as string);
        await syncSubscription(sub);
      }
      break;
    }
  }

  await adminDb.collection("stripe_events").doc(eventId).set({ processedAt: Date.now() });
}
