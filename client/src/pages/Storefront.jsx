import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Store,
  ShieldCheck,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  CreditCard,
  FileText,
  ChevronRight,
  X,
  Star,
  RefreshCw,
  LogOut,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Storefront() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Catalog & Search State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('database-engine');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Redis-backed Cart State
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Split Payment Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async (query = searchQuery, category = selectedCategory) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        if (data.categories) setCategories(data.categories);
        if (data.source) setSearchSource(data.source);
      }
    } catch (err) {
      console.error('Product fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/cart', { headers });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error('Cart fetch error:', err);
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart();
        setIsCartOpen(true);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity: newQuantity })
      });
      fetchCart();
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        headers
      });
      fetchCart();
    } catch (err) {
      console.error('Remove from cart failed:', err);
    }
  };

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const checkoutItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: checkoutItems,
          paymentMethod: 'stripe'
        })
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.data);
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        fetchCart();
        fetchProducts();
      } else {
        alert(data.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* =========================================================================
          STOREFRONT HEADER
          ========================================================================= */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          {/* Logo */}
          <div className="logo-wrap" onClick={() => navigate('/')}>
            <div className="logo-badge">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <span>Market<span style={{ color: 'var(--primary-light)' }}>Pulse</span></span>
          </div>

          {/* Search Bar (Elasticsearch Connected) */}
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search products, brands, tech, fashion..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchProducts(e.target.value, selectedCategory);
              }}
            />
            {searchQuery && (
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.75rem',
                  color: 'var(--primary-light)',
                  background: 'rgba(99, 102, 241, 0.2)',
                  padding: '2px 8px',
                  borderRadius: 4
                }}
              >
                {searchSource === 'elasticsearch' ? 'Elasticsearch' : 'Search API'}
              </span>
            )}
          </div>

          {/* Clean User Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={() => navigate('/vendor')}
            >
              <Store size={15} /> Sell on MarketPulse
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px' }}
                  onClick={() => navigate('/my-orders')}
                >
                  <Package size={15} /> Orders
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 10px', color: 'var(--accent-rose)' }}
                  onClick={logout}
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
                onClick={() => navigate('/login')}
              >
                <User size={15} /> Sign In
              </button>
            )}

            {/* Cart Trigger */}
            <button
              className="btn btn-primary"
              style={{ position: 'relative', padding: '10px 16px' }}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              {cart.itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(244, 63, 94, 0.5)'
                  }}
                >
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero-banner">
          <div style={{ maxWidth: 650, position: 'relative', zIndex: 1 }}>
            <div className="badge badge-indigo" style={{ marginBottom: 14 }}>
              <Sparkles size={14} /> Multi-Vendor Marketplace
            </div>
            <h1 className="heading-display gradient-text" style={{ fontSize: '2.6rem', lineHeight: 1.15, marginBottom: 14 }}>
              Direct from verified vendors, split seamlessly at checkout.
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: 24 }}>
              Discover handcrafted fashion, audio, and accessories with instant Redis cart caching, Elasticsearch search, and automated multi-vendor order fulfillment.
            </p>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: '0.88rem' }}>
                <CheckCircle size={16} /> Verified Multi-Vendor Stores
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontSize: '0.88rem' }}>
                <Clock size={16} /> Instant Redis Cart Cache
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontSize: '0.88rem' }}>
                <CreditCard size={16} /> Automated Split Payments
              </div>
            </div>
          </div>
        </section>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 999, padding: '8px 18px' }}
            onClick={() => {
              setSelectedCategory('');
              fetchProducts(searchQuery, '');
            }}
          >
            All Products ({products.length})
          </button>
          {['Electronics', 'Fashion', 'Footwear'].map((cat) => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 999, padding: '8px 18px' }}
              onClick={() => {
                setSelectedCategory(cat);
                fetchProducts(searchQuery, cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="product-grid">
          {products.map((product) => {
            const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
            return (
              <div
                key={product._id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-img-wrap">
                  <img src={product.images[0]} alt={product.title} className="product-img" />
                  {product.discountPrice > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: 'var(--accent-rose)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      SAVE ₹{product.price - product.discountPrice}
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(17, 23, 38, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <span>{product.ratingAverage}</span>
                  </div>
                </div>

                <div className="product-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Store size={14} color="var(--primary-light)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {product.vendor?.storeName || 'Verified Store'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, height: 42, overflow: 'hidden' }}>
                    {product.title}
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16, height: 38, overflow: 'hidden' }}>
                    {product.description}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                        ₹{displayPrice.toLocaleString()}
                      </div>
                      {product.discountPrice > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                          ₹{product.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 14px' }}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingBag size={15} /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Redis Cart Drawer */}
      {isCartOpen && (
        <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={20} color="var(--primary-light)" />
                <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>Your Cart</h3>
                <span className="badge badge-indigo">Redis Cache</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setIsCartOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>Your shopping cart is empty.</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: 14,
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 12,
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <img src={item.image} alt={item.title} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginBottom: 8 }}>
                        Vendor: {item.vendor.storeName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.8rem', height: 26 }}
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.quantity}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.8rem', height: 26 }}
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>₹{item.lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div style={{ padding: 24, borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '1.2rem', fontWeight: 800 }}>
                  <span>Total</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Proceed to Split Checkout <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split Payment Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
            {!completedOrder ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div className="badge badge-emerald" style={{ marginBottom: 6 }}>
                      <CreditCard size={14} /> Split Payment Engine
                    </div>
                    <h2 className="heading-display" style={{ fontSize: '1.5rem' }}>Checkout & Vendor Split</h2>
                  </div>
                  <button
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Automated Split Breakdown:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Order Subtotal</span>
                      <strong>₹{cart.subtotal.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                      <span>Platform Commission Cut (10%)</span>
                      <strong>₹{(cart.subtotal * 0.1).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-cyan)' }}>
                      <span>Vendor Payout Share (90%)</span>
                      <strong>₹{(cart.subtotal * 0.9).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-emerald"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  disabled={isProcessingPayment}
                  onClick={handleCheckout}
                >
                  {isProcessingPayment ? 'Processing Split Payment...' : `Authorize ₹${cart.subtotal.toLocaleString()} & Transfer Funds`}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={44} color="#34d399" style={{ margin: '0 auto 16px' }} />
                <h2 className="heading-display" style={{ fontSize: '1.6rem', marginBottom: 8 }}>Order Confirmed!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 20 }}>
                  Order <strong>{completedOrder.orderNumber}</strong> was placed. Platform commission was collected and vendor balances credited.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <a
                    href={`/api/orders/${completedOrder._id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '12px 20px' }}
                  >
                    <FileText size={18} /> Download Tax PDF Invoice
                  </a>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px' }}
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setCompletedOrder(null);
                      navigate('/my-orders');
                    }}
                  >
                    View My Orders
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSelectedProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.title}
                style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12 }}
              />
              <div>
                <div className="badge badge-indigo" style={{ marginBottom: 8 }}>{selectedProduct.category}</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8 }}>{selectedProduct.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Store size={15} color="var(--primary-light)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Store: <strong>{selectedProduct.vendor?.storeName || 'Verified Store'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 16 }}>
                  ₹{(selectedProduct.discountPrice > 0 ? selectedProduct.discountPrice : selectedProduct.price).toLocaleString()}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{selectedProduct.description}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12, fontSize: '0.85rem' }}>
          <a href="/vendor" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Seller Portal</a>
          <a href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Admin Console</a>
          <a href="/my-orders" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Order Tracking</a>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
          MarketPulse Multi-Vendor Marketplace • Node.js, Express, MongoDB, Redis, Elasticsearch & Stripe Connect.
        </p>
      </footer>
    </div>
  );
}
