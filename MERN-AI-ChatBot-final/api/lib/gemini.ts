import { GoogleGenerativeAI } from "@google/generative-ai";

export const configureGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const generateConversationName = async (userMessage: string, aiResponse: string) => {
  try {
    const model = configureGemini();
    const prompt = `Based on this conversation exchange, generate a short, descriptive title (max 30 characters) for the conversation:

User: ${userMessage}
AI: ${aiResponse}

Generate only the title, nothing else:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim().replace(/['"]/g, ''); // Remove quotes if any
  } catch (error) {
    console.error("Error generating conversation name:", error);
    return userMessage.length > 30 ? userMessage.substring(0, 30) + "..." : userMessage;
  }
};
