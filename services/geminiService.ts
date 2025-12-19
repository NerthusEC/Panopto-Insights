
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, QuizDifficulty, Lecture } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model configuration
const DEFAULT_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-3-pro-preview";
const VIDEO_ANALYSIS_MODEL = "gemini-3-pro-preview";

export const generateVideoSummary = async (transcript: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
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

export const answerVideoQuestion = async (
  transcript: string, 
  question: string,
  history: { role: 'user' | 'ai'; text: string }[] = []
): Promise<string> => {
  try {
    // Map UI history to API format
    // Note: The UI uses 'ai' role, API expects 'model'
    const historyParts = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const systemInstruction = `You are a helpful teaching assistant. Answer the student's questions based strictly on the provided lecture transcript below. If the answer is not in the transcript, state that clearly.
    
    TRANSCRIPT:
    ${transcript}`;

    const contents = [
      ...historyParts,
      { role: 'user', parts: [{ text: question }] }
    ];

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
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
      model: DEFAULT_MODEL,
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

export const transcribeMedia = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Remove data URL prefix (e.g. "data:video/mp4;base64,")
    const base64Content = base64Data.split(',')[1];
    const mimeType = file.type || 'video/mp4'; // Default fallback

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Content
          }
        },
        {
          text: "Generate a chronologically accurate, timestamped transcript for this media. Format the timestamps as [MM:SS] at the beginning of segments."
        }
      ]
    });

    return response.text || "Transcription failed.";
  } catch (error) {
    console.error("Error transcribing media:", error);
    throw error;
  }
};

export const analyzeVideo = async (file: File): Promise<{ summary: string; transcript: string }> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Remove data URL prefix
    const base64Content = base64Data.split(',')[1];
    const mimeType = file.type || 'video/mp4';

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A detailed academic summary of the video content, highlighting key topics and visual information." },
        transcript: { type: Type.STRING, description: "A complete, verbatim transcript of the video from start to finish, including timestamps and visual descriptions." }
      },
      required: ["summary", "transcript"]
    };

    const response = await ai.models.generateContent({
      model: VIDEO_ANALYSIS_MODEL,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Content
          }
        },
        {
          text: `Analyze this video lecture.
          1. Provide a comprehensive summary.
          2. Generate a FULL, VERBATIM transcript of the ENTIRE video.
             - You must transcript the audio from the beginning (00:00) to the very end.
             - Timestamp every segment (approx every 10-30 seconds) using [MM:SS] format.
             - **CRITICAL: VISUAL ANALYSIS**: Examine every image, slide, whiteboard writing, and visual demonstration shown. Write down this visual information into the transcript enclosed in parentheses or brackets, e.g., "(Visual: Diagram of ...)" or "[Visual: Instructor points to ...]".
             - Combine spoken text and visual descriptions in chronological order.
             - Ensure every minute and second of the content is covered.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    return JSON.parse(jsonText) as { summary: string; transcript: string };
  } catch (error) {
    console.error("Error analyzing video with Gemini Pro:", error);
    throw error;
  }
};

export const searchLibrary = async (query: string, lectures: Lecture[]): Promise<{ answer: string; relevantLectureIds: string[] }> => {
  try {
    // Prepare a lightweight version of the library for context.
    const libraryContext = lectures.map(l => ({
      id: l.id,
      title: l.title,
      instructor: l.instructor,
      subject: l.subject,
      summary: l.summary || "Summary not available.",
      // Include a significant portion of the transcript to allow deep search
      transcript_snippet: l.transcript ? l.transcript.slice(0, 20000) : "No transcript available."
    }));

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING, description: "A helpful, conversational answer addressing the user's query based on the library content." },
        relevantLectureIds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          description: "A list of IDs for the lectures that contain the information requested." 
        }
      },
      required: ["answer", "relevantLectureIds"]
    };

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `You are a smart library assistant for a university video platform.
      User Query: "${query}"
      
      Search through the following library content (summaries and transcripts) and identify which lectures match the user's request. 
      If the user asks about a specific topic, concept, or quote, check both the summaries and transcript snippets.
      
      Library Content:
      ${JSON.stringify(libraryContext)}
      
      Return a conversational answer describing what you found, and list the IDs of the relevant lectures.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");

    return JSON.parse(jsonText) as { answer: string; relevantLectureIds: string[] };

  } catch (error) {
    console.error("Error searching library:", error);
    return {
      answer: "I'm having trouble searching the library right now. Please try again later.",
      relevantLectureIds: []
    };
  }
};
