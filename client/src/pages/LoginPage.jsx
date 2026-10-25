import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import { Layers, Store, ShieldCheck, User, Lock, Mail, ArrowRight, Sparkles, Phone, Building2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [roleTab, setRoleTab] = useState('customer'); // 'customer' | 'vendor' | 'admin'
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (role) => {
    setRoleTab(role);
    setError('');
    if (!isRegister) {
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!isRegister) {
        // Sign in
        const result = await login(email, password);
        if (result.success) {
          if (result.user.role === 'admin') navigate('/admin');
          else if (result.user.role === 'vendor') navigate('/vendor');
          else navigate('/');
        } else {
          setError(result.message || 'Invalid credentials.');
        }
      } else {
        // Registration / Merchant Onboarding
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            role: roleTab,
            phone,
            storeName: roleTab === 'vendor' ? storeName : undefined,
            storeDescription: roleTab === 'vendor' ? storeDescription : undefined
          })
        });

        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          // Reload window so AuthProvider grabs token cleanly
          if (roleTab === 'vendor') {
            window.location.href = '/vendor';
          } else {
            window.location.href = '/';
          }
        } else {
          setError(data.message || 'Registration failed.');
        }
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--apple-bg)' }}>
      <div className="apple-card" style={{ maxWidth: 460, width: '100%', padding: 36 }}>
        {/* Apple Logo Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #116dff 0%, #0050d8 100%)',
              boxShadow: '0 4px 14px rgba(17, 109, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ffffff'
            }}
          >
            <Layers size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 6, color: '#0f172a' }}>
            {isRegister
              ? roleTab === 'vendor'
                ? 'Merchant Store Onboarding'
                : 'Create Customer Account'
              : 'Sign in to MarketPulse'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.86rem' }}>
            {isRegister
              ? 'Join the multi-vendor marketplace platform'
              : 'Enter your credentials to access your portal'}
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: isRegister ? '1fr 1fr' : '1fr 1fr 1fr', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 22, border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '7px 8px',
              fontSize: '0.8rem',
              borderRadius: 8,
              background: roleTab === 'customer' ? '#ffffff' : 'transparent',
              color: roleTab === 'customer' ? '#0f172a' : '#64748b',
              fontWeight: roleTab === 'customer' ? 600 : 500,
              boxShadow: roleTab === 'customer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
            onClick={() => handleTabChange('customer')}
          >
            {isRegister ? 'Shopper' : 'Shopper'}
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '7px 8px',
              fontSize: '0.8rem',
              borderRadius: 8,
              background: roleTab === 'vendor' ? '#ffffff' : 'transparent',
              color: roleTab === 'vendor' ? '#0f172a' : '#64748b',
              fontWeight: roleTab === 'vendor' ? 600 : 500,
              boxShadow: roleTab === 'vendor' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
            onClick={() => handleTabChange('vendor')}
          >
            {isRegister ? '🏪 Merchant' : 'Merchant'}
          </button>
          {!isRegister && (
            <button
              type="button"
              className="btn"
              style={{
                padding: '7px 8px',
                fontSize: '0.8rem',
                borderRadius: 8,
                background: roleTab === 'admin' ? '#ffffff' : 'transparent',
                color: roleTab === 'admin' ? '#0f172a' : '#64748b',
                fontWeight: roleTab === 'admin' ? 600 : 500,
                boxShadow: roleTab === 'admin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              onClick={() => handleTabChange('admin')}
            >
              Admin
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--apple-red-subtle)', border: '1px solid rgba(255, 69, 58, 0.25)', color: '#ff6961', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {roleTab === 'vendor' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Storefront / Brand Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Electronics & Audio"
                      className="form-input"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Curated studio headphones and wireless tech."
                      className="form-input"
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

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
            {isSubmitting
              ? 'Processing...'
              : isRegister
              ? roleTab === 'vendor'
                ? 'Complete Store Onboarding'
                : 'Create Shopper Account'
              : `Sign in to ${roleTab === 'customer' ? 'Storefront' : roleTab === 'vendor' ? 'Seller Central' : 'Admin Console'}`}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--apple-hairline)' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--apple-blue)', cursor: 'pointer', fontSize: '0.82rem' }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              if (!isRegister && roleTab === 'admin') setRoleTab('customer');
            }}
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : 'New to MarketPulse? Onboard as Merchant / Register'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
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
