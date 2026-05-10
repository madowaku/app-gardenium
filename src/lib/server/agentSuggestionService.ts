import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { buildApplyPatchForSuggestion } from "../agents/growthAgent";
import type { AgentSuggestion } from "../../types/agents";

async function loadOwnedSuggestion(transaction: FirebaseFirestore.Transaction, suggestionId: string, userId: string) {
  const suggestionRef = adminDb.collection("agentSuggestions").doc(suggestionId);
  const suggestionDoc = await transaction.get(suggestionRef);
  if (!suggestionDoc.exists) {
    throw new Error("Suggestion not found.");
  }
  const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as AgentSuggestion;
  if (suggestion.userId !== userId) {
    throw new Error("You cannot update another user's suggestion.");
  }

  const ideaRef = adminDb.collection("ideas").doc(suggestion.ideaId);
  const ideaDoc = await transaction.get(ideaRef);
  if (!ideaDoc.exists) {
    throw new Error("Idea not found.");
  }
  if (ideaDoc.data()?.authorId !== userId) {
    throw new Error("Only the idea owner can apply this suggestion.");
  }

  return { suggestionRef, suggestion, ideaRef, idea: ideaDoc.data() || {} };
}

export async function applySuggestion(params: {
  suggestionId: string;
  userId: string;
}): Promise<AgentSuggestion> {
  return adminDb.runTransaction(async (transaction) => {
    const { suggestionRef, suggestion, ideaRef, idea } = await loadOwnedSuggestion(
      transaction,
      params.suggestionId,
      params.userId,
    );
    const patch = buildApplyPatchForSuggestion(suggestion);
    const now = Date.now();

    if (patch.idea) {
      transaction.update(ideaRef, {
        ...patch.idea,
        ...(patch.testerCall
          ? {
              stage: "testing",
              testerCall: {
                ...(typeof idea.testerCall === "object" && idea.testerCall ? idea.testerCall : {}),
                prototypeStage: idea.testerCall?.prototypeStage || "Clickable Mockup",
                idealTester: patch.testerCall.suggestedTesterPersona || "",
                testingGoal: patch.testerCall.testerCallCopy || suggestion.summary,
                feedbackQuestions: patch.testerCall.suggestedFeedbackQuestions || [],
              },
            }
          : {}),
        agentUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(suggestionRef, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    return {
      ...suggestion,
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    };
  });
}

export async function dismissSuggestion(params: {
  suggestionId: string;
  userId: string;
}): Promise<AgentSuggestion> {
  return adminDb.runTransaction(async (transaction) => {
    const { suggestionRef, suggestion } = await loadOwnedSuggestion(
      transaction,
      params.suggestionId,
      params.userId,
    );
    if (suggestion.status === "accepted") {
      throw new Error("Accepted suggestions cannot be dismissed.");
    }
    const now = Date.now();
    transaction.update(suggestionRef, {
      status: "dismissed",
      dismissedAt: now,
      updatedAt: now,
    });
    return {
      ...suggestion,
      status: "dismissed",
      dismissedAt: now,
      updatedAt: now,
    };
  });
}
