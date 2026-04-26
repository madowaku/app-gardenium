import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  serverTimestamp, 
  increment,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { SalonPost, SalonComment, SalonReaction, UserPlan, BoostState, SalonPostType } from '../types/appSproutTypes';

const POSTS_COL = 'salonPosts';
const COMMENTS_COL = 'salonComments';
const REACTIONS_COL = 'salonReactions';

export const salonService = {
  // --- Posts ---
  async createPost(data: {
    authorId: string;
    authorName: string;
    authorPlan: UserPlan;
    type: SalonPostType;
    title: string;
    body: string;
    screenshotUrl?: string;
  }): Promise<string> {
    const postData = {
      ...data,
      boostState: 'none' as BoostState,
      cheerCount: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, POSTS_COL), postData);
    return docRef.id;
  },

  subscribePosts(callback: (posts: SalonPost[]) => void) {
    const q = query(collection(db, POSTS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert server timestamp to number for the interface
        createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
      } as SalonPost));
      callback(posts);
    });
  },

  async updatePost(postId: string, data: Partial<SalonPost>) {
    const postRef = doc(db, POSTS_COL, postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async applyBoost(postId: string) {
    await this.updatePost(postId, { boostState: 'applied' } as any);
  },

  // --- Reactions (Cheers) ---
  async toggleCheer(postId: string, userId: string): Promise<boolean> {
    const reactionId = `${postId}_${userId}`;
    const reactionRef = doc(db, REACTIONS_COL, reactionId);
    const postRef = doc(db, POSTS_COL, postId);
    
    const reactionSnap = await getDoc(reactionRef);
    
    if (reactionSnap.exists()) {
      // Remove cheer
      await deleteDoc(reactionRef);
      await updateDoc(postRef, { cheerCount: increment(-1) });
      return false;
    } else {
      // Add cheer
      await setDoc(reactionRef, {
        postId,
        userId,
        type: 'cheer',
        createdAt: serverTimestamp()
      });
      await updateDoc(postRef, { cheerCount: increment(1) });
      return true;
    }
  },

  async checkIfCheered(postId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const reactionId = `${postId}_${userId}`;
    const reactionRef = doc(db, REACTIONS_COL, reactionId);
    const snap = await getDoc(reactionRef);
    return snap.exists();
  },

  // --- Comments ---
  async addComment(postId: string, data: {
    authorId: string;
    authorName: string;
    authorPlan: UserPlan;
    body: string;
  }) {
    const commentData = {
      postId,
      ...data,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, COMMENTS_COL), commentData);
    // Update post count
    await updateDoc(doc(db, POSTS_COL, postId), {
      commentCount: increment(1)
    });
  },

  subscribeComments(postId: string, callback: (comments: SalonComment[]) => void) {
    const q = query(
      collection(db, COMMENTS_COL), 
      where('postId', '==', postId), 
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || Date.now()
      } as SalonComment));
      callback(comments);
    });
  }
};

export const MAX_SALON_POST_BODY_LENGTH = 2000;
export const MAX_SALON_COMMENT_LENGTH = 1000;
