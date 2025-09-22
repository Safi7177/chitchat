import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { verifyToken } from '../lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    // Find and soft delete the specific conversation
    if (user.conversations) {
      const conversation = user.conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        conversation.isDeleted = true;
        await user.save();
        return res.status(200).json({ message: 'Conversation deleted successfully' });
      }
    }

    return res.status(404).json({ message: 'Conversation not found' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
