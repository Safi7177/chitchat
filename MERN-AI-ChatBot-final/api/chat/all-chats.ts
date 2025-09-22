import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { verifyToken } from '../lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const activeConversations = user.conversations?.filter(conv => !conv.isDeleted) || [];
    
    return res.status(200).json({ 
      message: 'Chats retrieved successfully', 
      conversations: activeConversations 
    });
  } catch (error) {
    console.error('Get chats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
