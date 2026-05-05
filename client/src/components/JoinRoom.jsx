import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UsersIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const JoinRoom = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { token, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Room not found');
          setLoading(false);
          return;
        }

        setRoom(data.room);
        setLoading(false);
      } catch {
        setError('Failed to join room. Please try again.');
        setLoading(false);
      }
    };

    if (token) {
      fetchRoom();
    } else {
      localStorage.setItem('pendingRoom', roomId);
      navigate('/signin');
    }
  }, [roomId, token]);

  const openChat = () => {
    navigate(`/room/${roomId}`);
  };

  if (!token || loading) {
    return (
      <div className="join-page">
        <div className="join-card">
          <p>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-card">
        {error ? (
          <>
            <div style={{ marginBottom: '20px', opacity: 0.6 }}>
              <UsersIcon />
            </div>
            <h2>Unable to Join</h2>
            <p>{error}</p>
            <Link to="/">
              <button className="btn btn-primary" style={{ marginTop: '20px' }}>
                Go to Dashboard
              </button>
            </Link>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <UsersIcon />
            </div>
            <h2>Join "{room?.name}"</h2>
            <p>You've been invited to join this chat room.</p>
            <button className="btn btn-primary" onClick={openChat}>
              Join Chat
            </button>
            <p className="auth-link" style={{ marginTop: '20px' }}>
              <Link to="/">Cancel</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinRoom;
