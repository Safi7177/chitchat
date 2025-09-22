import mongoose, { Schema } from 'mongoose';
import { randomUUID } from 'crypto';

const chatSchema = new Schema({
  id: { type: String, default: randomUUID() },
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new Schema({
  id: { type: String, default: randomUUID() },
  name: { type: String, required: true },
  chats: [chatSchema],
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
});

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  conversations: [conversationSchema],
  chats: [chatSchema], // For backward compatibility
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
