import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../config';

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChatRoom = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const initializedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const handleMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/signin');
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const roomRes = await fetch(api(`/api/rooms/${roomId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roomData = await roomRes.json();

        if (!roomRes.ok) {
          navigate('/');
          return;
        }

        setRoom(roomData.room);

        const msgRes = await fetch(api(`/api/rooms/${roomId}/messages`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgData = await msgRes.json();
        if (msgRes.ok) setMessages(msgData.messages);

        const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
        socketRef.current = io(backendUrl, {
          auth: { token },
        });

        socketRef.current.emit('join_room', roomId);
        socketRef.current.on('receive_message', handleMessage);

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        navigate('/');
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message', handleMessage);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [roomId, token, handleMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      roomId,
      content: newMessage,
    });

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="join-page">
        <div className="join-card">
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>{room?.name}</h2>
          <span>{messages.length} messages</span>
        </div>
        <button className="btn-small btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeftIcon />
          Back
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.user_id === user?.id ? 'own' : 'other'}`}
          >
            {msg.user_id !== user?.id && (
              <div className="sender">{msg.username}</div>
            )}
            <div className="text">{msg.content}</div>
            <div className="time">
              {new Date(msg.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="btn btn-primary">
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
