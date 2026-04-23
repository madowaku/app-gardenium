import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProductDefinition, Purchase } from '../../types/commerce';
import { generateAiReport } from './aiReportService';

/**
 * Creates a pending purchase record in Firestore.
 */
export async function createPurchase(
  userId: string, 
  product: ProductDefinition, 
  targetPostId?: string
): Promise<string> {
  const purchaseData = {
    userId,
    productId: product.id,
    productType: product.type,
    status: 'pending',
    price: product.price,
    currency: 'JPY',
    targetPostId: targetPostId || null,
    ticketAmount: product.ticketAmount || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'purchases'), purchaseData);
  return docRef.id;
}

/**
 * Simulates a payment process and updates the purchase status.
 * TODO: Integrate with a real payment provider like Stripe here.
 */
export async function processMockPayment(purchaseId: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Update to paid
  const purchaseRef = doc(db, 'purchases', purchaseId);
  await updateDoc(purchaseRef, {
    status: 'paid',
    updatedAt: serverTimestamp()
  });

  return true;
}

/**
 * Fulfills the purchase by granting tickets or generating reports.
 */
export async function fulfillPurchase(purchaseId: string): Promise<void> {
  const purchaseRef = doc(db, 'purchases', purchaseId);
  const purchaseSnap = await getDoc(purchaseRef);
  
  if (!purchaseSnap.exists()) throw new Error('Purchase not found');
  const data = purchaseSnap.data() as Purchase;

  if (data.status !== 'paid') throw new Error('Purchase not paid');

  if (data.productType === 'ai_ticket' && data.ticketAmount) {
    // Grant tickets to user
    const userRef = doc(db, 'users', data.userId);
    await updateDoc(userRef, {
      aiTicketBalance: increment(data.ticketAmount)
    });
  } else if (data.productType === 'ai_report' && data.targetPostId) {
    // Generate AI Report
    await generateAiReport(data.userId, data.targetPostId);
  }

  // Mark as fulfilled
  await updateDoc(purchaseRef, {
    status: 'fulfilled',
    updatedAt: serverTimestamp()
  });
}
