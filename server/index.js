import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const JWT_SECRET = 'chatonly-secret-key-2026';

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.createUser({ id, username, password: hashedPassword, created_at: new Date().toISOString() });

    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id, username } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUser(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: { id: user.id, username: user.username } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/rooms', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Room name required' });

    const id = uuidv4();
    const now = new Date().toISOString();

    db.createRoom({ id, name, created_by: decoded.id, created_at: now });
    db.addRoomMember({ id: uuidv4(), room_id: id, user_id: decoded.id, joined_at: now });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.json({ room: db.getRoom(id), inviteLink: `${frontendUrl}/join/${id}` });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/rooms', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rooms = db.getUserRooms(decoded.id);
    res.json({ rooms });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const room = db.getRoom(req.params.roomId);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    db.addRoomMember({
      id: uuidv4(),
      room_id: req.params.roomId,
      user_id: decoded.id,
      joined_at: new Date().toISOString(),
    });

    res.json({ room });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.delete('/api/rooms/:roomId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const room = db.getRoom(req.params.roomId);

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.created_by !== decoded.id) {
      return res.status(403).json({ error: 'Only the room creator can delete it' });
    }

    db.deleteRoom(req.params.roomId);

    io.to(req.params.roomId).emit('room_deleted');

    res.json({ message: 'Room deleted successfully' });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);

    const messages = db.getRoomMessages(req.params.roomId).map((msg) => {
      const user = db.getUser(msg.user_id);
      return { ...msg, username: user?.username || 'Unknown' };
    });

    res.json({ messages });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.user.username} joined room ${roomId}`);
  });

  socket.on('send_message', ({ roomId, content }) => {
    if (!content.trim()) return;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.addMessage({
      id,
      room_id: roomId,
      user_id: socket.user.id,
      content,
      created_at: now,
    });

    const message = {
      id,
      room_id: roomId,
      user_id: socket.user.id,
      username: socket.user.username,
      content,
      created_at: now,
    };

    io.to(roomId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
