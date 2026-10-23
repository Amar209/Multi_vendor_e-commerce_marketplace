import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Store,
  Package,
  FileText,
  LogOut,
  ExternalLink,
  Users
} from 'lucide-react';

export default function AdminPortal() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const loadAdminData = async () => {
      try {
        const res = await fetch('/api/analytics/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container" style={{ maxWidth: 1400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-badge" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>
              MarketPulse Console <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem' }}>• Master Platform Administration</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <ExternalLink size={16} /> Public Storefront
            </button>
            <button
              className="btn btn-secondary"
              style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-wrapper" style={{ maxWidth: 1400, flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading-display" style={{ fontSize: '2.2rem', marginBottom: 6 }}>
            Platform Revenue & System Overview
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time multi-vendor transactions, Gross Merchandise Value (GMV), and 10% platform commission accounting.
          </p>
        </div>

        {/* Master Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 36 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Platform Commissions Collected</span>
              <DollarSign size={22} color="#34d399" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
              ₹{(analytics?.summary?.platformCommissions || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Net retained revenue across all vendors (10%)
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Gross Merchandise Value (GMV)</span>
              <TrendingUp size={22} color="var(--primary-light)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
              ₹{(analytics?.summary?.grossMerchandiseValue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Total consumer spending processed
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Active Vendors</span>
              <Store size={22} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {analytics?.summary?.totalVendors || 2} Stores
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Onboarded & authorized merchant accounts
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Catalog Products</span>
              <Package size={22} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {analytics?.summary?.totalProducts || 6} Items
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Synchronized in search engine
            </div>
          </div>
        </div>

        {/* Platform Transaction Audit Log */}
        <h2 className="heading-display" style={{ fontSize: '1.4rem', marginBottom: 16 }}>
          Platform Financial Audit Log
        </h2>

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Order ID</th>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Gross Amount</th>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Platform Cut (10%)</th>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '16px 22px', color: 'var(--text-muted)' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.recentOrders || []).map((o) => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 700 }}>{o.orderNumber}</td>
                  <td style={{ padding: '16px 22px' }}>{o.customer?.name}</td>
                  <td style={{ padding: '16px 22px', fontWeight: 700 }}>₹{o.totalAmount}</td>
                  <td style={{ padding: '16px 22px', color: '#34d399', fontWeight: 700 }}>+₹{o.commissionTotal}</td>
                  <td style={{ padding: '16px 22px' }}>
                    <span className="badge badge-emerald">{o.orderStatus.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '16px 22px' }}>
                    <a
                      href={`/api/orders/${o._id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <FileText size={14} /> PDF Invoice
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
