import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config';

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showInvite, setShowInvite] = useState(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/signin');
      return;
    }
    fetchRooms();
  }, [token]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(api('/api/rooms'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch(api('/api/rooms'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewRoomName('');
        fetchRooms();
        setShowInvite(data.inviteLink);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? This cannot be undone.')) return;

    try {
      const res = await fetch(api(`/api/rooms/${roomId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setToast('Room deleted successfully');
        setToastType('success');
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      } else {
        setToast(data.error || 'Failed to delete room');
        setToastType('error');
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
      setToast('Failed to delete room');
      setToastType('error');
    }

    setTimeout(() => setToast(''), 3000);
  };

  const copyInviteLink = (link) => {
    navigator.clipboard.writeText(link);
    setToast('Link copied to clipboard!');
    setToastType('success');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="container">
          <span className="logo">ChatOnly</span>
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <button className="btn-small btn-secondary" onClick={logout}>
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="container">
          <div className="create-room-section">
            <h2 style={{ marginBottom: '16px' }}>Create a New Chat Room</h2>
            <form className="create-room-form" onSubmit={createRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
              />
              <button type="submit" className="btn btn-primary">
                <PlusIcon />
                Create Room
              </button>
            </form>
          </div>

          {showInvite && (
            <div className="invite-modal" onClick={() => setShowInvite(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3>Room Created!</h3>
                  <button
                    onClick={() => setShowInvite(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <CloseIcon />
                  </button>
                </div>
                <p>Share this link with others to invite them to the chat:</p>
                <div className="invite-link-box">
                  <input type="text" value={showInvite} readOnly />
                  <button className="btn-small btn-copy" onClick={() => copyInviteLink(showInvite)}>
                    <CopyIcon />
                    Copy
                  </button>
                </div>
                <button className="btn btn-primary" onClick={() => navigate(`/room/${showInvite.split('/').pop()}`)}>
                  <ChatIcon />
                  Join Chat Now
                </button>
              </div>
            </div>
          )}

          <h2>Your Rooms</h2>

          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No chat rooms yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="rooms-list">
              {rooms.map((room) => {
                const inviteLink = `${window.location.origin}/join/${room.id}`;
                const isCreator = room.created_by === user?.id;

                return (
                  <div key={room.id} className="room-card">
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <span>
                        Created{' '}
                        {new Date(room.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="room-actions">
                      <button
                        className="btn-small btn-copy"
                        onClick={() => copyInviteLink(inviteLink)}
                      >
                        <CopyIcon />
                        Copy Link
                      </button>
                      <button
                        className="btn-small btn-open"
                        onClick={() => navigate(`/room/${room.id}`)}
                      >
                        <ChatIcon />
                        Open Chat
                      </button>
                      {isCreator && (
                        <button
                          className="btn-small"
                          style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}
                          onClick={() => deleteRoom(room.id)}
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="toast" style={{ background: toastType === 'error' ? 'var(--error)' : 'var(--success)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
