import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, QuizDifficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model configuration
const MODEL_NAME = "gemini-2.5-flash";

export const generateVideoSummary = async (transcript: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide a concise, academic summary (max 3 paragraphs) of the following lecture transcript. Highlight key concepts and takeaways. Transcript: ${transcript}`,
      config: {
        systemInstruction: "You are an expert academic tutor assisting university students.",
      }
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Failed to generate summary. Please try again later.";
  }
};

export const answerVideoQuestion = async (transcript: string, question: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Answer the student's question based strictly on the provided lecture transcript. If the answer is not in the transcript, state that clearly.
      
      Transcript: ${transcript}
      
      Student Question: ${question}`,
      config: {
        systemInstruction: "You are a helpful teaching assistant.",
      }
    });
    return response.text || "I couldn't find an answer in the video.";
  } catch (error) {
    console.error("Error answering question:", error);
    return "Error processing your request.";
  }
};

export const generateQuizFromTranscript = async (
  transcript: string, 
  difficulty: QuizDifficulty, 
  numQuestions: number
): Promise<QuizQuestion[]> => {
  try {
    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 4 possible answers."
          },
          correctAnswer: { 
            type: Type.INTEGER,
            description: "The index (0-3) of the correct option." 
          }
        },
        required: ["question", "options", "correctAnswer"],
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate ${numQuestions} multiple-choice questions based on the following lecture transcript. 
      The difficulty level should be: ${difficulty}.
      Ensure the questions test understanding of the core concepts appropriate for this difficulty level.
      
      Transcript: ${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};