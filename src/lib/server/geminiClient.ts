import { getAIService } from "../ai/modelRouting";

export async function generateStructuredJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  schema: unknown;
  model?: string;
}): Promise<T> {
  const model = params.model || process.env.GROWTH_AGENT_MODEL || "gemini-2.5-flash-lite";
  const ai = getAIService();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: params.schema as any,
      },
    });
    const text = (response as any).text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text.trim()) {
      throw new Error("Gemini returned an empty response.");
    }
    return JSON.parse(text) as T;
  } catch (error: any) {
    throw new Error(`Growth Agent generation failed: ${error?.message || String(error)}`);
  }
}
