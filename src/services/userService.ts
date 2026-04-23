import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserPlan } from '../types/appSproutTypes';

export const userService = {
  async updatePlan(userId: string, plan: UserPlan) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan,
      updatedAt: new Date().toISOString()
    });
  }
};
