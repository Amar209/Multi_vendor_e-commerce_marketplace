import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Store,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  CreditCard,
  FileText,
  ChevronRight,
  X,
  Star,
  LogOut,
  Package,
  Layers,
  ArrowRight
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
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
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
          APPLE SLIM FROSTED NAVBAR
          ========================================================================= */}
      <header className="apple-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          {/* Brand Logo */}
          <div className="logo-wrap" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Layers size={16} />
            </div>
            <span>MarketPulse</span>
          </div>

          {/* Spotlight Search */}
          <div className="search-wrapper">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search products, categories, creators..."
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
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.72rem',
                  color: 'var(--apple-secondary)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: 980
                }}
              >
                {searchSource === 'elasticsearch' ? 'Elasticsearch' : 'Instant Search'}
              </span>
            )}
          </div>

          {/* Cupertino Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '7px 14px' }}
              onClick={() => navigate('/vendor')}
            >
              <Store size={14} /> Sell
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '7px 14px' }}
                  onClick={() => navigate('/my-orders')}
                >
                  <Package size={14} /> Orders
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '7px 10px', color: 'var(--apple-secondary)' }}
                  onClick={logout}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ padding: '7px 14px' }}
                onClick={() => navigate('/login')}
              >
                <User size={14} /> Sign In
              </button>
            )}

            {/* Cart Trigger */}
            <button
              className="btn btn-primary"
              style={{ position: 'relative', padding: '7px 16px' }}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={15} />
              <span>Cart</span>
              {cart.itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#ffffff',
                    color: '#000000',
                    borderRadius: 980,
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          KEYNOTE STOREFRONT HERO
          ========================================================================= */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        <section className="apple-hero">
          <div className="badge badge-gray" style={{ marginBottom: 16 }}>
            Curated Multi-Vendor Marketplace
          </div>
          <h1 className="apple-hero-title">
            Engineered for craft.<br />Delivered direct from creators.
          </h1>
          <p className="apple-hero-sub">
            Discover verified merchant storefronts, sub-millisecond Redis cart caching, and automated split payments with zero platform markup.
          </p>

          <div className="hero-pills">
            <div className="hero-pill-item">
              <CheckCircle size={14} color="var(--apple-green)" /> Verified Independent Merchants
            </div>
            <div className="hero-pill-item">
              <Clock size={14} color="#2997ff" /> Real-Time Redis Cart Store
            </div>
            <div className="hero-pill-item">
              <CreditCard size={14} color="var(--apple-amber)" /> Instant Multi-Vendor Split Transfers
            </div>
          </div>
        </section>

        {/* Apple Segmented Category Control */}
        <div className="category-bar">
          <button
            className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
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
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                fetchProducts(searchQuery, cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Gallery Grid */}
        <div className="product-grid">
          {products.map((product) => {
            const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
            return (
              <div
                key={product._id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="product-img-wrap">
                  <img src={product.images[0]} alt={product.title} className="product-img" />
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(10px)',
                      padding: '4px 8px',
                      borderRadius: 980,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#ffffff'
                    }}
                  >
                    <Star size={11} fill="#ffd60a" color="#ffd60a" />
                    <span>{product.ratingAverage}</span>
                  </div>
                </div>

                <div className="product-body">
                  <div className="product-vendor">
                    <Store size={13} />
                    <span>{product.vendor?.storeName || 'Verified Store'}</span>
                  </div>

                  <h3 className="product-title">{product.title}</h3>

                  <p className="product-desc">{product.description}</p>

                  <div className="product-footer">
                    <div>
                      <span className="price-main">₹{displayPrice.toLocaleString()}</span>
                      {product.discountPrice > 0 && (
                        <span className="price-strike">₹{product.price.toLocaleString()}</span>
                      )}
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* =========================================================================
          APPLE SHEET CART DRAWER
          ========================================================================= */}
      {isCartOpen && (
        <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--apple-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Your Bag</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--apple-secondary)' }}>Redis Fast In-Memory Cache</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer' }}
                onClick={() => setIsCartOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--apple-secondary)' }}>
                  <ShoppingBag size={42} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.9rem' }}>Your bag is empty.</p>
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
                      border: '1px solid var(--apple-hairline)'
                    }}
                  >
                    <img src={item.image} alt={item.title} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--apple-secondary)', marginBottom: 8 }}>
                        By {item.vendor.storeName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: 24, borderRadius: 6 }}
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.quantity}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: 24, borderRadius: 6 }}
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>₹{item.lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div style={{ padding: 24, borderTop: '1px solid var(--apple-hairline)', background: 'rgba(0, 0, 0, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', color: 'var(--apple-secondary)' }}>
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '1.25rem', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Checkout with Split Transfer <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          APPLE PAY / WALLET SPLIT CHECKOUT MODAL
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 36 }}>
            {!completedOrder ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                      Complete Order
                    </h2>
                    <p style={{ color: 'var(--apple-secondary)', fontSize: '0.82rem' }}>
                      Automated multi-vendor split settlement
                    </p>
                  </div>
                  <button
                    style={{ background: 'transparent', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer' }}
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Ledger Breakdown Card */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 18, marginBottom: 24, border: '1px solid var(--apple-hairline)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-secondary)' }}>Cart Subtotal</span>
                      <strong style={{ color: 'var(--apple-text)' }}>₹{cart.subtotal.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-secondary)' }}>Platform Service Fee (10%)</span>
                      <strong style={{ color: 'var(--apple-green)' }}>₹{(cart.subtotal * 0.1).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--apple-hairline)' }}>
                      <span style={{ color: 'var(--apple-secondary)' }}>Net Vendor Remittance (90%)</span>
                      <strong style={{ color: '#2997ff' }}>₹{(cart.subtotal * 0.9).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Apple Pay Test Card Strip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, border: '1px solid var(--apple-hairline)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                    <CreditCard size={18} color="var(--apple-secondary)" />
                    <span>Apple Pay Sandbox Card</span>
                  </div>
                  <span style={{ color: 'var(--apple-green)', fontSize: '0.78rem', fontWeight: 600 }}>•••• 4242</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  disabled={isProcessingPayment}
                  onClick={handleCheckout}
                >
                  {isProcessingPayment ? 'Processing Split Authorization...' : `Pay ₹${cart.subtotal.toLocaleString()}`}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={44} color="var(--apple-green)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Order Complete</h2>
                <p style={{ color: 'var(--apple-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
                  Order <strong>{completedOrder.orderNumber}</strong> processed. Platform fee was retained and funds credited to merchant accounts.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <a
                    href={`/api/orders/${completedOrder._id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px' }}
                  >
                    <FileText size={15} /> Download Tax PDF
                  </a>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 18px' }}
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setCompletedOrder(null);
                      navigate('/my-orders');
                    }}
                  >
                    View Orders
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          APPLE PRODUCT DETAIL SHEET
          ========================================================================= */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer' }}
                onClick={() => setSelectedProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 24 }}>
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.title}
                style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12 }}
              />
              <div>
                <span className="badge badge-gray" style={{ marginBottom: 10 }}>
                  {selectedProduct.category}
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {selectedProduct.title}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--apple-secondary)', marginBottom: 14 }}>
                  Sold & fulfilled by <strong>{selectedProduct.vendor?.storeName || 'Verified Merchant'}</strong>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>
                  ₹{(selectedProduct.discountPrice > 0 ? selectedProduct.discountPrice : selectedProduct.price).toLocaleString()}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Add to Bag
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--apple-secondary)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {selectedProduct.description}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--apple-hairline)', padding: '24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 10, fontSize: '0.82rem' }}>
          <a href="/vendor" style={{ color: 'var(--apple-secondary)', textDecoration: 'none' }}>Merchant Central</a>
          <a href="/admin" style={{ color: 'var(--apple-secondary)', textDecoration: 'none' }}>Platform Console</a>
          <a href="/my-orders" style={{ color: 'var(--apple-secondary)', textDecoration: 'none' }}>My Bag & Orders</a>
        </div>
        <p style={{ color: 'var(--apple-tertiary)', fontSize: '0.78rem' }}>
          MarketPulse Platform • Powered by Express, MongoDB, Redis, and Stripe Connect.
        </p>
      </footer>
    </div>
  );
}
