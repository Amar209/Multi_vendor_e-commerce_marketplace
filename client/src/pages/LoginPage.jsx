import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Store, ShieldCheck, User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState('customer'); // 'customer' | 'vendor' | 'admin'
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (role) => {
    setRoleTab(role);
    setError('');
    if (role === 'customer') {
      setEmail('customer@example.com');
      setPassword('password123');
    } else if (role === 'vendor') {
      setEmail('tech@vendor.com');
      setPassword('password123');
    } else if (role === 'admin') {
      setEmail('admin@marketplace.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'vendor') navigate('/vendor');
        else navigate('/');
      } else {
        setError(result.message || 'Invalid credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--apple-bg)' }}>
      <div className="apple-card" style={{ maxWidth: 420, width: '100%', padding: 36 }}>
        {/* Apple Logo Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#1c1c1f',
              border: '1px solid var(--apple-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--apple-text)'
            }}
          >
            <Layers size={22} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}>
            Sign in to MarketPulse
          </h1>
          <p style={{ color: 'var(--apple-secondary)', fontSize: '0.84rem' }}>
            Enter your credentials to access your portal
          </p>
        </div>

        {/* Apple Segmented Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, background: 'rgba(255, 255, 255, 0.04)', padding: 3, borderRadius: 10, marginBottom: 24, border: '1px solid var(--apple-hairline)' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 8px',
              fontSize: '0.78rem',
              borderRadius: 8,
              background: roleTab === 'customer' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: roleTab === 'customer' ? 'var(--apple-text)' : 'var(--apple-secondary)'
            }}
            onClick={() => handleTabChange('customer')}
          >
            Shopper
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 8px',
              fontSize: '0.78rem',
              borderRadius: 8,
              background: roleTab === 'vendor' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: roleTab === 'vendor' ? 'var(--apple-text)' : 'var(--apple-secondary)'
            }}
            onClick={() => handleTabChange('vendor')}
          >
            Merchant
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 8px',
              fontSize: '0.78rem',
              borderRadius: 8,
              background: roleTab === 'admin' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: roleTab === 'admin' ? 'var(--apple-text)' : 'var(--apple-secondary)'
            }}
            onClick={() => handleTabChange('admin')}
          >
            Admin
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--apple-red-subtle)', border: '1px solid rgba(255, 69, 58, 0.25)', color: '#ff6961', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : `Sign in to ${roleTab === 'customer' ? 'Storefront' : roleTab === 'vendor' ? 'Seller Central' : 'Admin Console'}`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <a
            href="/"
            style={{ color: 'var(--apple-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            ← Return to Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
