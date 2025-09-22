import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { verifyToken } from '../lib/jwt';
import { configureGemini, generateConversationName } from '../lib/gemini';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!user.conversations) {
      user.conversations = [];
    }

    let conversation;
    if (conversationId) {
      conversation = user.conversations.find(conv => conv.id === conversationId && !conv.isDeleted);
    }
    
    if (!conversation) {
      conversation = {
        id: randomUUID(),
        name: "New Conversation",
        chats: [],
        createdAt: new Date(),
        isDeleted: false
      };
      user.conversations.push(conversation);
    }

    const userMessage = { content: message, role: "user" };
    conversation.chats.push(userMessage);

    // Generate AI response
    const model = configureGemini();
    const prompt = `You are Chit Chat, a helpful AI assistant. Respond to the user's message in a conversational and helpful manner.

User: ${message}

Response:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const assistantMessage = { content: text, role: "assistant" };
    conversation.chats.push(assistantMessage);

    // Generate intelligent conversation name after first exchange
    if (conversation.chats.length === 2) {
      try {
        const intelligentName = await generateConversationName(userMessage.content, text);
        conversation.name = intelligentName;
      } catch (error) {
        console.error("Error generating conversation name:", error);
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
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
