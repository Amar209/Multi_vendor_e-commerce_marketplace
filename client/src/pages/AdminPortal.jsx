import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  IndianRupee,
  Store,
  Package,
  FileText,
  LogOut,
  ExternalLink
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--apple-bg)' }}>
      {/* Header */}
      <header className="apple-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container" style={{ maxWidth: 1240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon">
              <ShieldCheck size={16} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
              MarketPulse Console <span style={{ color: 'var(--apple-secondary)', fontWeight: 400 }}>• Platform Administration</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => navigate('/')}>
              <ExternalLink size={14} /> Public Storefront
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', color: 'var(--apple-secondary)' }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-wrapper" style={{ maxWidth: 1240, flex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 4 }}>
            Platform Revenue & Telemetry
          </h1>
          <p style={{ color: 'var(--apple-secondary)', fontSize: '0.86rem' }}>
            Consolidated Gross Merchandise Value (GMV), 10% platform commission retention, and multi-vendor settlements.
          </p>
        </div>

        {/* Master Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Platform Commissions Retained</span>
              <IndianRupee size={18} color="var(--apple-green)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-green)' }}>
              ₹{(analytics?.summary?.platformCommissions || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Net 10% marketplace revenue
            </div>
          </div>

          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Gross Merchandise Value (GMV)</span>
              <TrendingUp size={18} color="#2997ff" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              ₹{(analytics?.summary?.grossMerchandiseValue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Total consumer transaction volume
            </div>
          </div>

          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Authorized Vendors</span>
              <Store size={18} color="var(--apple-amber)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              {analytics?.summary?.totalVendors ?? 0} Stores
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Active merchant storefronts
            </div>
          </div>

          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Catalog Size</span>
              <Package size={18} color="var(--apple-secondary)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              {analytics?.summary?.totalProducts ?? 0} Items
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Active in marketplace
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Platform Financial Transactions
        </h2>

        <div className="apple-card" style={{ overflow: 'hidden' }}>
          <table className="apple-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Gross Total</th>
                <th>Platform Commission (10%)</th>
                <th>Status</th>
                <th>Tax Invoice</th>
              </tr>
            </thead>
            <tbody>
              {(!analytics?.recentOrders || analytics.recentOrders.length === 0) ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--apple-secondary)' }}>
                    No marketplace transactions recorded yet.
                  </td>
                </tr>
              ) : (
                analytics.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                    <td style={{ color: 'var(--apple-secondary)' }}>{o.customer?.name}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount}</td>
                    <td style={{ color: 'var(--apple-green)', fontWeight: 600 }}>+₹{o.commissionTotal}</td>
                    <td>
                      <span className="badge badge-green">{o.orderStatus.toUpperCase()}</span>
                    </td>
                    <td>
                      <a
                        href={`/api/orders/${o._id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <FileText size={12} /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
