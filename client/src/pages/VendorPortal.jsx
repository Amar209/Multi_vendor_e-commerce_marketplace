import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  CheckCircle,
  LogOut,
  ExternalLink,
  X,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function VendorPortal() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Product Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Electronics',
    brand: '',
    price: '',
    discountPrice: '',
    stock: 10,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, orderRes, analyticsRes] = await Promise.all([
        fetch('/api/products/vendor/mine', { headers }),
        fetch('/api/orders/vendor/incoming', { headers }),
        fetch('/api/analytics/vendor', { headers })
      ]);

      const [prods, ords, anl] = await Promise.all([
        prodRes.json(),
        orderRes.json(),
        analyticsRes.json()
      ]);

      if (prods.success) setProducts(prods.data);
      if (ords.success) setOrders(ords.data);
      if (anl.success) setAnalytics(anl.data);
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          brand: form.brand || 'Store Brand',
          price: Number(form.price),
          discountPrice: Number(form.discountPrice || 0),
          stock: Number(form.stock || 10),
          description: form.description,
          images: [form.imageUrl]
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        loadData();
      } else {
        alert(data.message || 'Failed to publish product');
      }
    } catch (err) {
      console.error('Create product error:', err);
    }
  };

  const advanceFulfillment = async (orderId, itemId, nextStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error('Fulfillment update error:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product from the marketplace?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Merchant Top Bar */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container" style={{ maxWidth: 1400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-badge" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <Store size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>
                Seller Central <span style={{ color: '#34d399', fontSize: '0.85rem' }}>• {analytics?.storeName || 'Merchant Portal'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <ExternalLink size={16} /> View Public Storefront
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

      {/* Main Content Area */}
      <main className="main-wrapper" style={{ maxWidth: 1400, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 className="heading-display" style={{ fontSize: '2.2rem', marginBottom: 6 }}>
              {analytics?.storeName || 'Merchant Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Platform Commission Rate: <strong style={{ color: 'var(--accent-cyan)' }}>{analytics?.commissionRate || 10}%</strong> | Net Vendor Earnings: <strong style={{ color: '#34d399' }}>90%</strong>
            </p>
          </div>

          <button className="btn btn-emerald" onClick={() => setIsAddOpen(true)}>
            <Plus size={18} /> Publish New Product
          </button>
        </div>

        {/* Ledger Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 36 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Available Payout Balance</span>
              <DollarSign size={22} color="#34d399" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
              ₹{(analytics?.balance?.available || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Net earnings ready for simulated bank payout
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Gross Sales Volume</span>
              <ShoppingBag size={22} color="var(--primary-light)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
              ₹{(analytics?.totalVendorSales || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Across {analytics?.totalOrdersCount || 0} customer orders
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Active Catalog Listings</span>
              <Package size={22} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {products.length} Items Listed
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Synced with Elasticsearch cluster
            </div>
          </div>
        </div>

        {/* Incoming Orders Section */}
        <div style={{ marginBottom: 40 }}>
          <h2 className="heading-display" style={{ fontSize: '1.4rem', marginBottom: 16 }}>
            Incoming Orders to Fulfill & Split Payouts
          </h2>

          {orders.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No incoming orders yet. When customers purchase your items, they will appear here with split revenue!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((order) => (
                <div key={order._id} className="glass-card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                        Order #{order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginLeft: 12 }}>
                        Customer: {order.customer?.name} ({order.customer?.email})
                      </span>
                    </div>
                    <div className="badge badge-emerald">
                      Net Store Share: ₹{order.vendorTotalEarnings.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {order.vendorItems.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 8
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <img src={item.image} alt={item.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{item.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Qty: {item.quantity} | Unit Price: ₹{item.price} | Platform Cut (10%): -₹{item.platformCommissionAmount}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className={`badge ${item.vendorFulfillmentStatus === 'delivered' ? 'badge-emerald' : 'badge-amber'}`}>
                            {item.vendorFulfillmentStatus.toUpperCase()}
                          </span>

                          {item.vendorFulfillmentStatus === 'placed' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'packed')}
                            >
                              Mark Packed
                            </button>
                          )}

                          {item.vendorFulfillmentStatus === 'packed' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'shipped')}
                            >
                              <Truck size={14} /> Mark Shipped
                            </button>
                          )}

                          {item.vendorFulfillmentStatus === 'shipped' && (
                            <button
                              className="btn btn-emerald"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'delivered')}
                            >
                              <CheckCircle size={14} /> Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Catalog Management */}
        <div>
          <h2 className="heading-display" style={{ fontSize: '1.4rem', marginBottom: 16 }}>
            My Store Inventory ({products.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {products.map((p) => (
              <div key={p._id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span className="badge badge-indigo" style={{ marginBottom: 6, alignSelf: 'flex-start' }}>
                    {p.category}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, height: 42, overflow: 'hidden' }}>
                    {p.title}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10 }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>₹{p.price.toLocaleString()}</span>
                      <div style={{ fontSize: '0.78rem', color: '#34d399' }}>Stock: {p.stock} units</div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--accent-rose)', padding: '6px 10px' }}
                      onClick={() => handleDeleteProduct(p._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="heading-display" style={{ fontSize: '1.4rem' }}>Publish Product to Marketplace</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setIsAddOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Footwear">Footwear</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (S3 / CDN)</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-emerald" style={{ width: '100%', padding: '12px' }}>
                Publish Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
