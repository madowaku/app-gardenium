import Stripe from "stripe";
import { adminDb } from "./admin";
import { User, UserPlan, PlanStatus, ProductKey } from "../../types/appSproutTypes";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27" as any,
    })
  : null;

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