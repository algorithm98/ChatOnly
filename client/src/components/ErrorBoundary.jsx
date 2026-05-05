import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#fff',
          padding: '20px',
        }}>
          <div style={{
            background: '#1e1e2f',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h2 style={{ marginBottom: '12px' }}>Something went wrong</h2>
            <p style={{ color: '#a0a0b0', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
