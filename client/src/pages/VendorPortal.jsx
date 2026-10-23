import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  CheckCircle,
  LogOut,
  ExternalLink,
  X,
  Trash2,
  Layers
} from 'lucide-react';

export default function VendorPortal() {
  const { token, logout } = useAuth();
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
    if (!window.confirm('Remove this product listing?')) return;
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--apple-bg)' }}>
      {/* Apple macOS style Navbar */}
      <header className="apple-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container" style={{ maxWidth: 1240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon">
              <Store size={15} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
              Seller Central <span style={{ color: 'var(--apple-secondary)', fontWeight: 400 }}>• {analytics?.storeName || 'Merchant'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => navigate('/')}>
              <ExternalLink size={14} /> Storefront
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 4 }}>
              {analytics?.storeName || 'Merchant Operations'}
            </h1>
            <p style={{ color: 'var(--apple-secondary)', fontSize: '0.86rem' }}>
              Platform Commission: <strong style={{ color: 'var(--apple-text)' }}>{analytics?.commissionRate || 10}%</strong> • Net Merchant Share: <strong style={{ color: 'var(--apple-green)' }}>90%</strong>
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> Publish Listing
          </button>
        </div>

        {/* Apple macOS Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Available Remittance</span>
              <IndianRupee size={18} color="var(--apple-green)" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-green)' }}>
              ₹{(analytics?.balance?.available || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Cleared for simulated direct transfer
            </div>
          </div>

          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Gross Sales Volume</span>
              <ShoppingBag size={18} color="#2997ff" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              ₹{(analytics?.totalVendorSales || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              From {analytics?.totalOrdersCount || 0} customer transactions
            </div>
          </div>

          <div className="apple-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-secondary)', marginBottom: 8, fontSize: '0.82rem' }}>
              <span>Active Catalog Listings</span>
              <Package size={18} color="var(--apple-amber)" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text)' }}>
              {products.length} Products
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)', marginTop: 4 }}>
              Active in live marketplace catalog
            </div>
          </div>
        </div>

        {/* Fulfillment Pipeline */}
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Fulfillment & Multi-Vendor Payouts
          </h2>

          {orders.length === 0 ? (
            <div className="apple-card" style={{ padding: 40, textAlign: 'center', color: 'var(--apple-secondary)' }}>
              <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.88rem' }}>No orders currently requiring fulfillment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.map((order) => (
                <div key={order._id} className="apple-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                        Order {order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--apple-secondary)', marginLeft: 12 }}>
                        Customer: {order.customer?.name}
                      </span>
                    </div>
                    <span className="badge badge-green">
                      Net Payout: ₹{order.vendorTotalEarnings.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {order.vendorItems.map((item) => (
                      <div
                        key={item._id}
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
                              Qty: {item.quantity} • Price: ₹{item.price} • Fee (10%): -₹{item.platformCommissionAmount}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${item.vendorFulfillmentStatus === 'delivered' ? 'badge-green' : 'badge-amber'}`}>
                            {item.vendorFulfillmentStatus.toUpperCase()}
                          </span>

                          {item.vendorFulfillmentStatus === 'placed' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'packed')}
                            >
                              Pack
                            </button>
                          )}

                          {item.vendorFulfillmentStatus === 'packed' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'shipped')}
                            >
                              <Truck size={12} /> Ship
                            </button>
                          )}

                          {item.vendorFulfillmentStatus === 'shipped' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => advanceFulfillment(order._id, item._id, 'delivered')}
                            >
                              <CheckCircle size={12} /> Deliver
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

        {/* Store Catalog */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Active Inventory ({products.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {products.map((p) => (
              <div key={p._id} className="apple-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span className="badge badge-gray" style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
                    {p.category}
                  </span>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: 8, height: 42, overflow: 'hidden' }}>
                    {p.title}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12 }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>₹{p.price.toLocaleString()}</span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--apple-green)' }}>Stock: {p.stock} units</div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', color: 'var(--apple-secondary)' }}
                      onClick={() => handleDeleteProduct(p._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Product Upload Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Create Product Listing</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer' }}
                onClick={() => setIsAddOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Studio Pro Wireless Headphones"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
                  <label className="form-label">Stock Units</label>
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
                <label className="form-label">Product Image URL</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specifications & Description</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Publish Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
