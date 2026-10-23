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
  ExternalLink,
  RotateCcw,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminPortal() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date());

  const loadAdminData = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/analytics/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setLastSyncedTime(new Date());
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadAdminData();

    // Auto-sync real-time telemetry every 3.5 seconds
    const interval = setInterval(() => {
      loadAdminData();
    }, 3500);

    return () => clearInterval(interval);
  }, [token]);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset marketplace to clean slate (0 products, 0 orders)?')) return;
    try {
      await fetch('/api/auth/reset-clean', { method: 'POST' });
      await loadAdminData(true);
    } catch (e) {
      console.error(e);
    }
  };

  const formatPaymentBadge = (provider) => {
    switch (provider) {
      case 'upi':
        return (
          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Smartphone size={11} /> UPI / QR
          </span>
        );
      case 'netbanking':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Building2 size={11} /> NetBanking
          </span>
        );
      case 'cod':
        return (
          <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Banknote size={11} /> Cash on Del.
          </span>
        );
      default:
        return (
          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CreditCard size={11} /> Card
          </span>
        );
    }
  };

  const formatStatusBadge = (status) => {
    const s = (status || 'placed').toUpperCase();
    if (s === 'DELIVERED') return <span className="badge badge-green">DELIVERED</span>;
    if (s === 'SHIPPED') return <span className="badge badge-blue">SHIPPED</span>;
    if (s === 'PACKED') return <span className="badge badge-amber">PACKED</span>;
    return <span className="badge badge-gray">PLACED</span>;
  };

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
            {/* Live Telemetry Active Pulse */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 10px',
                background: 'rgba(48, 209, 88, 0.08)',
                border: '1px solid rgba(48, 209, 88, 0.25)',
                borderRadius: 20,
                fontSize: '0.74rem',
                color: 'var(--apple-green)',
                fontWeight: 500
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--apple-green)',
                  animation: 'livePulse 2s infinite'
                }}
              />
              <span>Live Sync Active</span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => loadAdminData(true)}
              title="Manual Real-Time Telemetry Refresh"
            >
              <RefreshCw size={12} className={isRefreshing ? 'spin-anim' : ''} /> Sync
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--apple-secondary)' }}
              onClick={handleResetDemo}
              title="Reset all products and orders to a clean demo slate"
            >
              <RotateCcw size={13} /> Reset Demo
            </button>

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 4 }}>
              Platform Revenue & Telemetry
            </h1>
            <p style={{ color: 'var(--apple-secondary)', fontSize: '0.86rem' }}>
              Real-time multi-vendor Gross Merchandise Value (GMV), 10% platform commission retention, and merchant remittances.
            </p>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)' }}>
            Updated: {lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {/* Master Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 40 }}>
          <div className="apple-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Platform Fee (10%)</span>
              <IndianRupee size={17} color="var(--apple-green)" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-green)' }}>
              ₹{(analytics?.summary?.platformCommissions || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Net retained platform profit
            </div>
          </div>

          <div className="apple-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Gross Merchandise Value</span>
              <TrendingUp size={17} color="#2997ff" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              ₹{(analytics?.summary?.grossMerchandiseValue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Total consumer GMV volume
            </div>
          </div>

          <div className="apple-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Vendor Remittances (90%)</span>
              <Store size={17} color="#2997ff" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#2997ff' }}>
              ₹{(analytics?.summary?.netVendorRemittance || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Total merchant earnings
            </div>
          </div>

          <div className="apple-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Orders Processed</span>
              <ShoppingBag size={17} color="var(--apple-amber)" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              {analytics?.summary?.totalOrders ?? 0} Orders
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Total consumer transactions
            </div>
          </div>

          <div className="apple-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Live Catalog</span>
              <Package size={17} color="var(--apple-secondary)" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              {analytics?.summary?.totalProducts ?? 0} Items
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Active in storefront
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Real-Time Financial Transactions Audit
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--apple-secondary)' }}>
            Showing {analytics?.recentOrders?.length || 0} recent transactions
          </span>
        </div>

        <div className="apple-card" style={{ overflow: 'hidden' }}>
          <table className="apple-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Merchant Store</th>
                <th>Payment</th>
                <th>Gross Total</th>
                <th>Platform (10%)</th>
                <th>Vendor Share (90%)</th>
                <th>Fulfillment</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {(!analytics?.recentOrders || analytics.recentOrders.length === 0) ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--apple-secondary)' }}>
                    No marketplace transactions recorded yet.
                  </td>
                </tr>
              ) : (
                analytics.recentOrders.map((o) => {
                  const vendorStoreName = o.items?.[0]?.vendor?.storeName || 'TechHub Electronics';
                  const vendorPayout = Math.max(0, o.totalAmount - o.commissionTotal);
                  return (
                    <tr key={o._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.orderNumber}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--apple-tertiary)', marginTop: 2 }}>
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{o.customer?.name || 'Customer'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--apple-secondary)' }}>{o.customer?.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem', color: 'var(--apple-text)' }}>{vendorStoreName}</span>
                      </td>
                      <td>
                        {formatPaymentBadge(o.paymentInfo?.provider)}
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString()}</td>
                      <td style={{ color: 'var(--apple-green)', fontWeight: 600 }}>+₹{o.commissionTotal.toLocaleString()}</td>
                      <td style={{ color: '#2997ff', fontWeight: 600 }}>₹{vendorPayout.toLocaleString()}</td>
                      <td>
                        {formatStatusBadge(o.orderStatus)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
