/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  uid: string;
  displayName: string | null;
  username: string | null; // Handle system
  email: string | null;
  photoURLs: string[]; // Multiple profile pictures
  phoneNumber: string | null;
  bio?: string;
  lastSeen: any; // Firestore Timestamp
  status?: 'online' | 'offline';
  theme?: string; // Hex code or theme ID
  pinnedChats?: string[];
  folders?: { id: string; name: string; chatIds: string[] }[];
}

export interface Chat {
  id: string;
  type: 'personal' | 'group' | 'channel' | 'secret';
  participants: string[];
  admins?: string[];
  name?: string; // For groups/channels
  description?: string;
  photoURL?: string;
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    timestamp: any; // Firestore Timestamp
    isDeleted?: boolean;
    isEdited?: boolean;
  };
  updatedAt: any; // Firestore Timestamp
  isPinned?: boolean;
  selfDestructTime?: number; // For secret chats
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any; // Firestore Timestamp
  type: 'text' | 'image' | 'call' | 'file' | 'sticker';
  isEdited?: boolean;
  isDeleted?: boolean;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: { [emoji: string]: string[] }; // emoji -> list of userIds
  replyTo?: string; // Message ID
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'connected' | 'ended' | 'missed';
  type: 'voice' | 'video';
  offer?: any;
  answer?: any;
  iceCandidates?: any[];
  createdAt: any; // Firestore Timestamp
}

export interface Bot {
  id: string;
  name: string;
  username: string;
  description: string;
  creatorId: string;
  webhookUrl?: string;
  commands: { command: string; description: string }[];
}
