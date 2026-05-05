import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Dashboard from './components/Dashboard';
import ChatRoom from './components/ChatRoom';
import JoinRoom from './components/JoinRoom';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/signin" />;
};

const AuthRoute = ({ children }) => {
  const { token } = useAuth();
  if (token) {
    const pendingRoom = localStorage.getItem('pendingRoom');
    if (pendingRoom) {
      localStorage.removeItem('pendingRoom');
      return <Navigate to={`/room/${pendingRoom}`} />;
    }
    return <Navigate to="/" />;
  }
  return children;
};

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/signin" element={<AuthRoute><Signin /></AuthRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/join/:roomId"
        element={
          <ProtectedRoute>
            <JoinRoom />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? "/" : "/signin"} />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
