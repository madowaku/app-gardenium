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
import { Type } from "@google/genai";
import { getAIModelForTask, getAIService } from '../ai/modelRouting';

/**
 * Generates an AI analysis report based on comments of a post.
 */
export async function generateAiReport(userId: string, postId: string, isPremium: boolean = false): Promise<string> {
  try {
    const ai = getAIService();
    
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
      
    // Enhanced prompt for premium
    const premiumInstructions = isPremium 
      ? "As a premium deep dive, provide extra details on feasibility and specific technical challenges."
      : "";

    const prompt = `
      You are an expert product manager analyzing user feedback.
      Please analyze the following product idea and its user comments to generate a structured report.
      Output the analysis in Japanese by default, unless the comments are overwhelmingly in another language.
      ${premiumInstructions}
      
      # Product Idea
      Title: ${ideaTitle}
      Description: ${ideaSummary}
      
      # User Comments
      ${commentsText}
      
      Generate a report with:
      - summary: A general overview of the sentiment and feedback. (about 2-3 sentences)
      - commonRequests: Top 3 requested features or improvements.
      - concerns: Top 3 concerns or complaints.
      - nextActions: 3 actionable next steps for the creator based on the feedback.
    `;

    const response = await ai.models.generateContent({
      model: getAIModelForTask(isPremium ? 'analysis_report_premium' : 'analysis_report'),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            commonRequests: { type: Type.ARRAY, items: { type: Type.STRING } },
            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "commonRequests", "concerns", "nextActions"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);

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
