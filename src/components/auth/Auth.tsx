import { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import './Auth.css';

interface AuthProps {
  onAuthenticated: (user: User, token: string) => void;
}

// Demo credentials for testing (bypasses server auth)
const DEMO_MODE = true;
const DEMO_CREDENTIALS = {
  email: 'operator@argus.space',
  password: 'argus123',
};

export default function Auth({ onAuthenticated }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (DEMO_MODE) {
        // Demo mode - bypass server authentication
        if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
          const mockToken = 'demo-token-' + Date.now();
          const mockUser: User = {
            uid: 'demo-user-1',
            email: email,
            role: 'operator',
          };
          localStorage.setItem('auth_token', mockToken);
          onAuthenticated(mockUser, mockToken);
        } else {
          throw new Error('Invalid credentials.');
        }
      } else {
        const result = await api.login(email, password);
        const user: User = {
          uid: result.user.uid,
          email: result.user.email,
          role: result.user.role as User['role'],
        };
        localStorage.setItem('auth_token', result.token);
        onAuthenticated(user, result.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="logo-title">ARGUS</h1>
          <p className="logo-subtitle">Satellite Telemetry Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">Sign In</h2>

          {DEMO_MODE && (
            <div className="demo-notice">
              <p>Demo Mode</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@argus.space"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Protected by blockchain verification</p>
          <div className="footer-icons">⛓️ 🔒 🛰️</div>
        </div>
      </div>
    </div>
  );
}
