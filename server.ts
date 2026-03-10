import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('telepro.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    displayName TEXT,
    email TEXT UNIQUE,
    phoneNumber TEXT UNIQUE,
    password TEXT,
    photoURL TEXT,
    status TEXT DEFAULT 'offline',
    lastSeen DATETIME,
    role TEXT DEFAULT 'user',
    verified BOOLEAN DEFAULT 0,
    banned BOOLEAN DEFAULT 0
  );

  -- Create a default Bot user if not exists
  INSERT OR IGNORE INTO users (uid, username, displayName, role, verified) 
  VALUES ('bot-1', 'telepro_bot', 'TelePro Assistant', 'bot', 1);

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    type TEXT,
    name TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_participants (
    chatId TEXT,
    userId TEXT,
    PRIMARY KEY (chatId, userId)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chatId TEXT,
    senderId TEXT,
    text TEXT,
    type TEXT DEFAULT 'text',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isEdited BOOLEAN DEFAULT 0,
    isDeleted BOOLEAN DEFAULT 0
  );
`);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const JWT_SECRET = 'telepro-secret-key-123';

app.use(express.json());

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { username, displayName, email, password, phoneNumber } = req.body;
  const uid = Math.random().toString(36).substring(2, 15);
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    db.prepare('INSERT INTO users (uid, username, displayName, email, password, phoneNumber) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uid, username, displayName, email, hashedPassword, phoneNumber);
    
    const token = jwt.sign({ uid, username }, JWT_SECRET);
    res.json({ token, user: { uid, username, displayName, email, phoneNumber } });
  } catch (err: any) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ uid: user.uid, username: user.username }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Simulated OTP Login
app.post('/api/auth/otp-request', (req, res) => {
  const { phoneNumber } = req.body;
  // In a real app, send SMS here
  res.json({ message: 'OTP sent to ' + phoneNumber, code: '123456' });
});

app.post('/api/auth/otp-verify', (req, res) => {
  const { phoneNumber, code } = req.body;
  if (code === '123456') {
    let user: any = db.prepare('SELECT * FROM users WHERE phoneNumber = ?').get(phoneNumber);
    if (!user) {
      const uid = Math.random().toString(36).substring(2, 15);
      const username = `user_${uid.substring(0, 5)}`;
      db.prepare('INSERT INTO users (uid, username, phoneNumber) VALUES (?, ?, ?)')
        .run(uid, username, phoneNumber);
      user = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
    }
    const token = jwt.sign({ uid: user.uid, username: user.username }, JWT_SECRET);
    res.json({ token, user });
  } else {
    res.status(401).json({ error: 'Invalid OTP' });
  }
});

// --- Chat Routes ---

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT uid, username, displayName, photoURL, status, lastSeen, verified, role FROM users').all();
  res.json(users);
});

app.get('/api/chats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const chats = db.prepare(`
      SELECT c.* FROM chats c
      JOIN chat_participants cp ON c.id = cp.chatId
      WHERE cp.userId = ?
      ORDER BY c.updatedAt DESC
    `).all(decoded.uid);
    
    // Add participants and last message to each chat
    const fullChats = chats.map((chat: any) => {
      const participants = db.prepare('SELECT userId FROM chat_participants WHERE chatId = ?').all(chat.id).map((p: any) => p.userId);
      const lastMessage = db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT 1').get(chat.id);
      return { ...chat, participants, lastMessage };
    });
    
    res.json(fullChats);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/chats/:chatId/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC').all(req.params.chatId);
  res.json(messages);
});

app.post('/api/chats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const { type, participants, name } = req.body;
    const chatId = Math.random().toString(36).substring(2, 15);
    
    db.prepare('INSERT INTO chats (id, type, name) VALUES (?, ?, ?)')
      .run(chatId, type, name || null);
    
    const stmt = db.prepare('INSERT INTO chat_participants (chatId, userId) VALUES (?, ?)');
    participants.forEach((uid: string) => stmt.run(chatId, uid));
    
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    res.json({ ...chat, participants });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- Admin Routes ---

app.post('/api/admin/users/:uid/ban', (req, res) => {
  const { banned } = req.body;
  db.prepare('UPDATE users SET banned = ? WHERE uid = ?').run(banned ? 1 : 0, req.params.uid);
  res.json({ success: true });
});

app.post('/api/admin/users/:uid/verify', (req, res) => {
  const { verified } = req.body;
  db.prepare('UPDATE users SET verified = ? WHERE uid = ?').run(verified ? 1 : 0, req.params.uid);
  res.json({ success: true });
});

// --- Socket.io Logic ---

const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.uid;
      onlineUsers.set(decoded.uid, socket.id);
      
      db.prepare("UPDATE users SET status = 'online' WHERE uid = ?").run(decoded.uid);
      io.emit('user_status', { userId: decoded.uid, status: 'online' });
      
      // Join rooms for all user's chats
      const chats = db.prepare('SELECT chatId FROM chat_participants WHERE userId = ?').all(decoded.uid);
      chats.forEach((c: any) => socket.join(c.chatId));
      
      console.log(`User ${decoded.username} authenticated`);
    } catch (err) {
      socket.disconnect();
    }
  });

  socket.on('send_message', (data) => {
    const { chatId, text, type } = data;
    const userId = socket.data.userId;
    if (!userId) return;

    const messageId = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO messages (id, chatId, senderId, text, type) VALUES (?, ?, ?, ?, ?)')
      .run(messageId, chatId, userId, text, type || 'text');
    
    db.prepare('UPDATE chats SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(chatId);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    io.to(chatId).emit('new_message', message);

    // --- Bot System Logic ---
    const participants = db.prepare('SELECT userId FROM chat_participants WHERE chatId = ?').all(chatId);
    const hasBot = participants.some((p: any) => p.userId === 'bot-1');
    
    if (hasBot && userId !== 'bot-1') {
      setTimeout(() => {
        const botMessageId = Math.random().toString(36).substring(2, 15);
        const botResponse = `I am your TelePro Assistant. You said: "${text}". How can I help you further?`;
        
        db.prepare('INSERT INTO messages (id, chatId, senderId, text, type) VALUES (?, ?, ?, ?, ?)')
          .run(botMessageId, chatId, 'bot-1', botResponse, 'text');
        
        const botMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(botMessageId);
        io.to(chatId).emit('new_message', botMsg);
      }, 1000);
    }
  });

  socket.on('edit_message', ({ messageId, text }) => {
    const userId = socket.data.userId;
    if (!userId) return;

    const msg: any = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (msg && msg.senderId === userId) {
      db.prepare('UPDATE messages SET text = ?, isEdited = 1 WHERE id = ?').run(text, messageId);
      const updatedMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
      io.to(msg.chatId).emit('message_updated', updatedMsg);
    }
  });

  socket.on('delete_message', (messageId) => {
    const userId = socket.data.userId;
    if (!userId) return;

    const msg: any = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (msg && msg.senderId === userId) {
      db.prepare('UPDATE messages SET isDeleted = 1, text = "" WHERE id = ?').run(messageId);
      const updatedMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
      io.to(msg.chatId).emit('message_updated', updatedMsg);
    }
  });

  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(chatId).emit('user_typing', { chatId, userId: socket.data.userId, isTyping });
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      onlineUsers.delete(userId);
      db.prepare("UPDATE users SET status = 'offline', lastSeen = CURRENT_TIMESTAMP WHERE uid = ?").run(userId);
      io.emit('user_status', { userId, status: 'offline', lastSeen: new Date() });
    }
    console.log('User disconnected');
  });
});

// --- Vite Middleware ---

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
