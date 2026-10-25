import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import { FileText, ArrowLeft, Package, Layers } from 'lucide-react';

export default function MyOrdersPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch(apiUrl('/api/orders/my-orders'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--apple-bg)' }}>
      {/* Header */}
      <header className="apple-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          <div className="logo-wrap" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Layers size={16} />
            </div>
            <span>MarketPulse</span>
          </div>

          <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => navigate('/')}>
            <ArrowLeft size={14} /> Back to Store
          </button>
        </div>
      </header>

      <main className="main-wrapper" style={{ flex: 1, maxWidth: 960 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 4 }}>
            Order History
          </h1>
          <p style={{ color: 'var(--apple-secondary)', fontSize: '0.86rem' }}>
            Track merchant fulfillments and download official tax invoices.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="apple-card" style={{ padding: 48, textAlign: 'center', color: 'var(--apple-secondary)' }}>
            <Package size={36} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--apple-text)', marginBottom: 6 }}>No purchase records found</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 18 }}>Items purchased from marketplace merchants will appear here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map((order) => (
              <div key={order._id} className="apple-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--apple-text)' }}>
                      {order.orderNumber}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--apple-secondary)', marginTop: 2 }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-green">{order.orderStatus.toUpperCase()}</span>
                    <a
                      href={apiUrl(`/api/orders/${order._id}/invoice`)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <FileText size={14} /> Tax Invoice
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={item.image} alt={item.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{item.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--apple-secondary)' }}>
                            Merchant: {item.vendor?.storeName || 'Verified Store'} • Qty: {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
