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
  ArrowRight,
  Smartphone,
  Building2,
  Banknote,
  MapPin,
  AlertCircle
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

  // Interactive Payment & Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'cod'
  const [cardForm, setCardForm] = useState({
    name: 'Alex Johnson',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [shippingAddress, setShippingAddress] = useState({
    street: '12 Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India'
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

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

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardForm(prev => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardForm(prev => ({ ...prev, expiry: raw }));
  };

  const handleUseDemoCard = () => {
    setCardForm({
      name: user?.name || 'Alex Johnson',
      number: '4532 8920 1204 4242',
      expiry: '12/28',
      cvv: '888'
    });
    setCheckoutError('');
  };

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Interactive client validation
    if (paymentMethod === 'card') {
      if (!cardForm.name.trim()) {
        setCheckoutError('Please enter the name on the card.');
        return;
      }
      const rawNumber = cardForm.number.replace(/\s+/g, '');
      if (rawNumber.length < 15) {
        setCheckoutError('Please enter a valid card number (or click "Auto-fill Demo Card").');
        return;
      }
      if (!cardForm.expiry || cardForm.expiry.length < 5) {
        setCheckoutError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        setCheckoutError('Please enter a 3-digit CVV security code.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setCheckoutError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank).');
        return;
      }
    }

    setCheckoutError('');
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
          paymentMethod,
          shippingAddress
        })
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.data);
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        fetchCart();
        fetchProducts();
      } else {
        setCheckoutError(data.message || 'Payment processing declined. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('Network error connecting to payment gateway.');
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
            Discover verified independent merchant storefronts, fast checkout, and seamless order delivery direct from creators.
          </p>

          <div className="hero-pills">
            <div className="hero-pill-item">
              <CheckCircle size={14} color="var(--apple-green)" /> Verified Independent Merchants
            </div>
            <div className="hero-pill-item">
              <Clock size={14} color="#2997ff" /> Seamless Cart Checkout
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
          {products.length === 0 ? (
            <div className="apple-card" style={{ padding: 48, textAlign: 'center', color: 'var(--apple-secondary)', gridColumn: '1 / -1' }}>
              <Package size={38} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--apple-text)', marginBottom: 8 }}>
                No marketplace listings yet
              </h3>
              <p style={{ fontSize: '0.86rem', marginBottom: 20 }}>
                Merchants can publish products in Seller Central to make them available here.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/vendor')}>
                Go to Seller Central to Publish First Product
              </button>
            </div>
          ) : (
            products.map((product) => {
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
          }))}
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
                <span style={{ fontSize: '0.75rem', color: 'var(--apple-secondary)' }}>Ready for instant checkout</span>
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

                {/* Shipping Destination Strip */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--apple-hairline)', marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--apple-secondary)', fontWeight: 600 }}>
                      <MapPin size={13} color="var(--apple-blue)" />
                      <span>SHIPPING DESTINATION</span>
                    </div>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--apple-blue)', cursor: 'pointer', fontSize: '0.78rem' }}
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                    >
                      {isEditingAddress ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  {!isEditingAddress ? (
                    <div style={{ fontSize: '0.86rem', color: 'var(--apple-text)' }}>
                      {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Street"
                        style={{ gridColumn: 'span 2', padding: '6px 10px', fontSize: '0.82rem' }}
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City"
                        style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="PIN Code"
                        style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Interactive Payment Method Selector */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--apple-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Select Payment Method
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { id: 'card', label: 'Card', icon: CreditCard },
                      { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                      { id: 'netbanking', label: 'NetBanking', icon: Building2 },
                      { id: 'cod', label: 'Cash on Del.', icon: Banknote }
                    ].map(m => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setPaymentMethod(m.id); setCheckoutError(''); }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: active ? '1px solid var(--apple-blue)' : '1px solid var(--apple-hairline)',
                            background: active ? 'rgba(0, 113, 227, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            color: active ? 'var(--apple-blue)' : 'var(--apple-secondary)',
                            cursor: 'pointer',
                            transition: 'var(--transition-apple)'
                          }}
                        >
                          <Icon size={17} />
                          <span style={{ fontSize: '0.72rem', fontWeight: active ? 600 : 400 }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Payment Inputs */}
                {paymentMethod === 'card' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: 16, border: '1px solid var(--apple-hairline)', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Card Information</span>
                      <button
                        type="button"
                        onClick={handleUseDemoCard}
                        style={{
                          background: 'rgba(0, 113, 227, 0.15)',
                          border: '1px solid rgba(0, 113, 227, 0.3)',
                          color: 'var(--apple-blue)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        ⚡ Auto-fill Demo Card
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name on Card"
                        style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                        value={cardForm.name}
                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                        style={{ padding: '8px 12px', fontSize: '0.84rem', letterSpacing: '0.04em' }}
                        value={cardForm.number}
                        onChange={handleCardNumberChange}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="MM / YY"
                          style={{ padding: '8px 12px', fontSize: '0.84rem', textAlign: 'center' }}
                          value={cardForm.expiry}
                          onChange={handleExpiryChange}
                        />
                        <input
                          type="password"
                          maxLength={4}
                          className="form-input"
                          placeholder="CVV"
                          style={{ padding: '8px 12px', fontSize: '0.84rem', textAlign: 'center' }}
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Inputs */}
                {paymentMethod === 'upi' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: 16, border: '1px solid var(--apple-hairline)', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10 }}>Enter Virtual Payment Address (UPI ID)</div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. alex@okhdfcbank or 9876543210@paytm"
                      style={{ padding: '8px 12px', fontSize: '0.84rem', marginBottom: 12 }}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['@okhdfcbank', '@paytm', '@ybl', '@ibl'].map(handle => (
                        <button
                          key={handle}
                          type="button"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--apple-hairline)',
                            color: 'var(--apple-secondary)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => setUpiId((prev) => (prev ? prev.split('@')[0] : 'alex') + handle)}
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Banking Inputs */}
                {paymentMethod === 'netbanking' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: 16, border: '1px solid var(--apple-hairline)', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10 }}>Select Your Bank</div>
                    <select
                      className="form-select"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Cash on Delivery */}
                {paymentMethod === 'cod' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: 16, border: '1px solid var(--apple-hairline)', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--apple-text)', lineHeight: 1.5 }}>
                      💵 <strong>Pay on Delivery:</strong> Please keep exact cash or UPI QR payment ready at your doorstep when your shipment arrives.
                    </div>
                  </div>
                )}

                {checkoutError && (
                  <div style={{
                    background: 'rgba(255, 69, 58, 0.1)',
                    border: '1px solid rgba(255, 69, 58, 0.3)',
                    color: '#ff453a',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16
                  }}>
                    <AlertCircle size={14} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  disabled={isProcessingPayment}
                  onClick={handleCheckout}
                >
                  {isProcessingPayment
                    ? 'Processing Split Authorization...'
                    : paymentMethod === 'cod'
                    ? `Confirm Cash on Delivery (₹${cart.subtotal.toLocaleString()})`
                    : `Pay ₹${cart.subtotal.toLocaleString()}`}
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
          © 2026 MarketPulse Inc. All rights reserved. • Privacy Policy • Terms of Service • Trust & Security
        </p>
      </footer>
    </div>
  );
}
