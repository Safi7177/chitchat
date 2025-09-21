import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import { configureGemini } from "../config/openai-config.js";
import { randomUUID } from "crypto";

// Function to generate intelligent conversation name
async function generateConversationName(userMessage: string, assistantResponse: string): Promise<string> {
  try {
    const model = configureGemini();
    const prompt = `Based on this conversation, generate a short, descriptive title (2-4 words) for the chat:

User: ${userMessage}
Assistant: ${assistantResponse}

Generate a title that captures the main topic or intent. Examples:
- "hi" -> "Friendly Greeting"
- "help with JavaScript syntax" -> "JavaScript Help"
- "explain quantum physics" -> "Quantum Physics"
- "how to cook pasta" -> "Cooking Tips"
- "what's the weather" -> "Weather Query"

Title:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();
    
    // Clean up the title and ensure it's not too long
    const cleanTitle = title.replace(/['"]/g, '').substring(0, 50);
    return cleanTitle || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation name:", error);
    // Fallback to a simple name based on the first message
    return userMessage.length > 30 ? userMessage.substring(0, 30) + "..." : userMessage;
  }
}
export const generateChatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message, conversationId } = req.body;
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user)
      return res
        .status(401)
        .json({ message: "User not registered OR Token malfunctioned" });
    
    // Initialize conversations array if it doesn't exist
    if (!user.conversations) {
      user.conversations = [];
    }
    
    let conversation;
    
    if (conversationId) {
      // Find existing conversation
      conversation = user.conversations.find(conv => conv.id === conversationId && !conv.isDeleted);
    }
    
    if (!conversation) {
      // Create new conversation with a default name first
      conversation = {
        id: randomUUID(),
        name: "New Conversation",
        chats: [],
        createdAt: new Date(),
        isDeleted: false
      };
      user.conversations.push(conversation);
    }
    
    // Add user message
    const userMessage = { content: message, role: "user" };
    conversation.chats.push(userMessage);
    
    // Convert chat history to Gemini format
    const chatHistory = conversation.chats.map(chat => 
      `${chat.role === 'user' ? 'Human' : 'Assistant'}: ${chat.content}`
    ).join('\n\n');
    
    const prompt = `${chatHistory}\n\nAssistant:`;

    // send all chats with new one to Gemini API
    const model = configureGemini();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Add assistant response
    const assistantMessage = { content: text, role: "assistant" };
    conversation.chats.push(assistantMessage);
    
    // Generate intelligent conversation name if it's the first exchange
    if (conversation.chats.length === 2) {
      try {
        const intelligentName = await generateConversationName(userMessage.content, text);
        conversation.name = intelligentName;
      } catch (error) {
        console.error("Error generating conversation name:", error);
        // Fallback to simple name
        conversation.name = userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + "..." : userMessage.content;
      }
    }
    
    await user.save();
    return res.status(200).json({ 
      chats: conversation.chats,
      conversationId: conversation.id,
      conversationName: conversation.name
    });
  } catch (error) {
    console.error("Error in generateChatCompletion:", error);
    return res.status(500).json({ 
      message: "Something went wrong", 
      error: error.message 
    });
  }
};

export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    
    // Get all non-deleted conversations
    const activeConversations = (user.conversations || []).filter(conv => !conv.isDeleted);
    
    return res.status(200).json({ 
      message: "OK", 
      conversations: activeConversations,
      // Keep backward compatibility
      chats: user.chats 
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    
    // Soft delete all conversations
    if (user.conversations) {
      user.conversations.forEach(conv => {
        conv.isDeleted = true;
      });
    }
    
    // Also clear the old chats array for backward compatibility
    //@ts-ignore
    user.chats = [];
    
    await user.save();
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    
    // Soft delete specific conversation
    if (user.conversations) {
      const conversation = user.conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        conversation.isDeleted = true;
        await user.save();
      }
    }
    
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};
