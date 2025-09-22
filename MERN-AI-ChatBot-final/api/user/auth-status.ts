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
      return res.status(401).json({ message: 'No token provided' });
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

    return res.status(200).json({ message: 'User authenticated', user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Auth status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
