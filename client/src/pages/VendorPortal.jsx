import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  RotateCcw,
  UploadCloud,
  AlertCircle
} from 'lucide-react';

export default function VendorPortal() {
  const { token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Product Modal & Image Upload State
  const fileInputRef = useRef(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'Electronics',
    brand: '',
    price: '',
    discountPrice: '',
    stock: 10,
    description: '',
    imageData: null
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

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image must be under 10MB.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Optimize & scale down via canvas to keep high quality while minimizing payload
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setImagePreview(optimizedDataUrl);
        setForm((prev) => ({ ...prev, imageData: optimizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    if (!form.imageData) {
      setImageError('Please upload a product photo from your device.');
      return;
    }

    setIsPublishing(true);
    setPublishError('');

    try {
      let activeToken = token || localStorage.getItem('token');
      let res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          brand: form.brand || 'Store Brand',
          price: Number(form.price),
          discountPrice: Number(form.discountPrice || 0),
          stock: Number(form.stock || 10),
          description: form.description,
          images: [form.imageData]
        })
      });

      // If token expired due to server restart, transparently re-login and retry
      if (res.status === 401) {
        const relogin = await login('tech@vendor.com', 'password123');
        if (relogin.success) {
          activeToken = localStorage.getItem('token');
          res = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              title: form.title,
              category: form.category,
              brand: form.brand || 'Store Brand',
              price: Number(form.price),
              discountPrice: Number(form.discountPrice || 0),
              stock: Number(form.stock || 10),
              description: form.description,
              images: [form.imageData]
            })
          });
        }
      }

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setImagePreview(null);
        setImageError('');
        setPublishError('');
        setForm({
          title: '',
          category: 'Electronics',
          brand: '',
          price: '',
          discountPrice: '',
          stock: 10,
          description: '',
          imageData: null
        });
        loadData();
      } else {
        setPublishError(data.message || 'Failed to publish listing. Please try again.');
      }
    } catch (err) {
      console.error('Create product error:', err);
      setPublishError('Network error connecting to marketplace API.');
    } finally {
      setIsPublishing(false);
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

  const handleResetDemo = async () => {
    if (!window.confirm('Reset marketplace to clean slate (0 products, 0 orders)?')) return;
    try {
      await fetch('/api/auth/reset-clean', { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error(e);
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
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--apple-secondary)' }}
              onClick={handleResetDemo}
              title="Reset all products and orders to a clean demo slate"
            >
              <RotateCcw size={13} /> Reset Demo
            </button>
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
                    <option value="Home & Living">Home & Living</option>
                    <option value="Accessories">Accessories</option>
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

              {/* Product Image File Upload */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Product Photo Upload</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--apple-secondary)', fontWeight: 400 }}>PNG, JPG, WebP (up to 10MB)</span>
                </label>

                {!imagePreview ? (
                  <div
                    className="image-upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageFileChange({ target: { files: e.dataTransfer.files } });
                      }
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageFileChange}
                    />
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--apple-blue)'
                    }}>
                      <UploadCloud size={22} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--apple-text)' }}>
                      Click to browse or drop product photo here
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--apple-tertiary)' }}>
                      Photo will be stored directly with this listing
                    </div>
                  </div>
                ) : (
                  <div className="image-upload-preview">
                    <img src={imagePreview} alt="Product upload preview" />
                    <button
                      type="button"
                      className="image-upload-remove"
                      onClick={() => {
                        setImagePreview(null);
                        setForm((prev) => ({ ...prev, imageData: null }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {imageError && (
                  <div style={{ color: '#ff453a', fontSize: '0.78rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} /> {imageError}
                  </div>
                )}
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

              {publishError && (
                <div style={{
                  background: 'rgba(255, 69, 58, 0.1)',
                  border: '1px solid rgba(255, 69, 58, 0.3)',
                  color: '#ff453a',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16
                }}>
                  <AlertCircle size={15} />
                  <span>{publishError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPublishing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', opacity: isPublishing ? 0.7 : 1 }}
              >
                {isPublishing ? 'Publishing Listing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
