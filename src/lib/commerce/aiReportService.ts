import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { AiReport } from '../../types/commerce';
import { authenticatedFetch } from '../authenticatedFetch';

/**
 * Generates an AI analysis report based on comments of a post.
 */
export async function generateAiReport(userId: string, postId: string, isPremium: boolean = false): Promise<string> {
  try {
    // Fetch Idea Data
    const ideaSnapshot = await getDoc(doc(db, 'ideas', postId));
    const ideaData = ideaSnapshot.exists() ? ideaSnapshot.data() : null;
    
    // Fetch Comments
    const commentsSnapshot = await getDocs(query(collection(db, 'ideas', postId, 'comments')));
    const comments = commentsSnapshot.docs.map(d => d.data());
    
    const ideaTitle = ideaData?.title || 'Unknown Idea';
    const ideaSummary = ideaData?.oneLineSummary || ideaData?.problemDetails || 'No details provided';
    
    const commentsText = comments.length > 0 
      ? comments.map((c, i) => `Comment ${i + 1}: ${c.text}`).join('\n')
      : "No comments yet.";

    const response = await authenticatedFetch('/api/ai/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isPremium,
        activityData: {
          ideaTitle,
          ideaSummary,
          commentsText
        }
      })
    });

    if (!response.ok) {
      throw new Error('AI analysis request failed');
    }

    const parsedData = await response.json();

    const reportData = {
      postId,
      userId,
      summary: parsedData.summary || "分析できる十分なデータがありませんでした。",
      commonRequests: parsedData.commonRequests || [],
      concerns: parsedData.concerns || [],
      nextActions: parsedData.nextActions || [],
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'aiReports'), reportData);

    // Notify the user
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'ai_report',
      message: `AI分析レポートの準備ができました！ (${ideaTitle})`,
      link: `/ideas/${postId}`,
      read: false,
      createdAt: serverTimestamp()
    });

    return docRef.id;

  } catch (error) {
    console.error("AI Report Generation Error:", error);
    // Fallback in case of failure
    const fallbackData = {
      postId,
      userId,
      summary: "AIレポートの生成に失敗しました。しばらく経ってから再度お試しください。",
      commonRequests: [],
      concerns: ["エラーが発生しました"],
      nextActions: [],
      createdAt: serverTimestamp()
    };
    const fallbackRef = await addDoc(collection(db, 'aiReports'), fallbackData);
    return fallbackRef.id;
  }
}

/**
 * Consumes one AI ticket from the user's balance.
 */
export async function consumeAiTicket(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      aiTicketBalance: increment(-1)
    });
    return true;
  } catch (error) {
    console.error('Failed to consume ticket:', error);
    return false;
  }
}
