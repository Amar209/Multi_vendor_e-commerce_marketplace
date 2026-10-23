import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Store, ShieldCheck, User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [roleTab, setRoleTab] = useState('customer'); // 'customer' | 'vendor' | 'admin'
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick fill credentials based on role tab
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
        // Redirect to respective portal based on user role
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (result.user.role === 'vendor') {
          navigate('/vendor');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-dark)' }}>
      <div className="glass-card" style={{ maxWidth: 460, width: '100%', padding: 36 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Sparkles size={26} color="#ffffff" />
          </div>
          <h1 className="heading-display" style={{ fontSize: '1.8rem', marginBottom: 6 }}>Welcome to MarketPulse</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to access your dedicated portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, background: 'rgba(255, 255, 255, 0.04)', padding: 4, borderRadius: 10, marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px 10px',
              fontSize: '0.8rem',
              borderRadius: 8,
              background: roleTab === 'customer' ? 'var(--primary)' : 'transparent',
              color: roleTab === 'customer' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => handleTabChange('customer')}
          >
            <User size={14} /> Shopper
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px 10px',
              fontSize: '0.8rem',
              borderRadius: 8,
              background: roleTab === 'vendor' ? 'var(--primary)' : 'transparent',
              color: roleTab === 'vendor' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => handleTabChange('vendor')}
          >
            <Store size={14} /> Vendor
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px 10px',
              fontSize: '0.8rem',
              borderRadius: 8,
              background: roleTab === 'admin' ? 'var(--primary)' : 'transparent',
              color: roleTab === 'admin' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => handleTabChange('admin')}
          >
            <ShieldCheck size={14} /> Admin
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: 42 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: 42 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : `Enter as ${roleTab === 'customer' ? 'Customer' : roleTab === 'vendor' ? 'Vendor Portal' : 'Admin Console'}`} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/"
            style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            ← Back to Public Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}
