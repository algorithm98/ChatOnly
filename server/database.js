import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db.json');

const defaultData = {
  users: [],
  rooms: [],
  room_members: [],
  messages: [],
};

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  getUser(id) {
    const data = load();
    return data.users.find((u) => u.id === id);
  },

  getUserByUsername(username) {
    const data = load();
    return data.users.find((u) => u.username === username);
  },

  createUser(user) {
    const data = load();
    data.users.push(user);
    save(data);
  },

  createRoom(room) {
    const data = load();
    data.rooms.push(room);
    save(data);
  },

  getRooms() {
    const data = load();
    return data.rooms;
  },

  getRoom(id) {
    const data = load();
    return data.rooms.find((r) => r.id === id);
  },

  getUserRooms(userId) {
    const data = load();
    const memberRoomIds = data.room_members
      .filter((rm) => rm.user_id === userId)
      .map((rm) => rm.room_id);
    return data.rooms
      .filter((r) => memberRoomIds.includes(r.id))
      .map((r) => {
        const member = data.room_members.find((rm) => rm.room_id === r.id && rm.user_id === userId);
        return { ...r, joined_at: member?.joined_at };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  addRoomMember(member) {
    const data = load();
    const exists = data.room_members.some(
      (rm) => rm.room_id === member.room_id && rm.user_id === member.user_id
    );
    if (!exists) {
      data.room_members.push(member);
      save(data);
    }
  },

  isRoomMember(roomId, userId) {
    const data = load();
    return data.room_members.some((rm) => rm.room_id === roomId && rm.user_id === userId);
  },

  getRoomMessages(roomId) {
    const data = load();
    return data.messages
      .filter((m) => m.room_id === roomId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  addMessage(message) {
    const data = load();
    data.messages.push(message);
    save(data);
  },

  deleteRoom(roomId) {
    const data = load();
    data.rooms = data.rooms.filter((r) => r.id !== roomId);
    data.room_members = data.room_members.filter((rm) => rm.room_id !== roomId);
    data.messages = data.messages.filter((m) => m.room_id !== roomId);
    save(data);
  },
};
