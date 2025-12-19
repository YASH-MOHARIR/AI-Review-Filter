import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReviewAnalysisResponse } from "../types";

const apiKey = process.env.API_KEY;

// Define the schema for the AI response
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Identify relevant categories from: Food, Delivery, Ambience, Service, Price.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["Positive", "Negative", "Neutral"],
      description: "Overall sentiment of the review.",
    },
    shortSummary: {
      type: Type.STRING,
      description: "A very short 5-8 word summary of the key point.",
    },
  },
  required: ["categories", "sentiment", "shortSummary"],
};

export const analyzeReviewWithGemini = async (reviewText: string): Promise<ReviewAnalysisResponse> => {
  if (!apiKey) {
    console.warn("No API Key found. Returning mock response.");
    // Fallback mock for demo if no key provided
    return {
      categories: ['Food', 'Service'],
      sentiment: 'Positive',
      shortSummary: 'Simulated AI Analysis Result'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: reviewText,
      config: {
        systemInstruction: "You are an expert review analyzer. specificially categorize restaurant reviews. Map categories strictly to: Food, Delivery, Ambience, Service, Price. If none match perfectly, choose the closest or omit.",
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(text) as ReviewAnalysisResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
