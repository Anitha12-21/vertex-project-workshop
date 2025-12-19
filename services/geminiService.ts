
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { Source } from "../types";

export const sendMessageToGemini = async (
  prompt: string,
  image?: string,
  history: { role: string; content: string }[] = []
): Promise<{ text: string; sources: Source[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const parts: any[] = [{ text: prompt }];
  if (image) {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  }

  // Formatting history for contents
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  // Add the current message
  contents.push({
    role: 'user',
    parts: parts
  });

  const config: GenerateContentParameters = {
    model: 'gemini-3-pro-preview',
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are OmniChat, a world-class AI assistant with deep expertise in all subjects. Provide accurate, helpful, and concise answers. If appropriate, use Markdown to format your response. When providing technical or factual information, ensure high precision.",
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    }
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent(config);
    const text = response.text || "I'm sorry, I couldn't process that request.";
    
    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Reference",
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
