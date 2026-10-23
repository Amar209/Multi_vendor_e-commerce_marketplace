import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, FileText, ArrowLeft, Package, Sparkles } from 'lucide-react';

export default function MyOrdersPage() {
  const { user, token } = useAuth();
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
        const res = await fetch('/api/orders/my-orders', {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          <div className="logo-wrap" onClick={() => navigate('/')}>
            <div className="logo-badge">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <span>Market<span style={{ color: 'var(--primary-light)' }}>Pulse</span></span>
          </div>

          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Continue Shopping
          </button>
        </div>
      </header>

      <main className="main-wrapper" style={{ flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading-display" style={{ fontSize: '2.2rem', marginBottom: 6 }}>My Purchase History</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track order delivery status and download automated multi-vendor tax PDF invoices.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={44} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>No orders found</h3>
            <p style={{ marginBottom: 20 }}>You haven't placed any orders yet. Discover trending products from verified vendors!</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order) => (
              <div key={order._id} className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>
                      {order.orderNumber}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge badge-emerald">{order.orderStatus.toUpperCase()}</span>
                    <a
                      href={`/api/orders/${order._id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px' }}
                    >
                      <FileText size={16} /> Download PDF Invoice
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img src={item.image} alt={item.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Sold by: {item.vendor?.storeName || 'Verified Store'} | Qty: {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
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
