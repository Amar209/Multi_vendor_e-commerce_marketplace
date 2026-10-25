import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
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
  AlertCircle,
  Tag,
  SlidersHorizontal,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Storefront() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Floating Toast Notifications System
  const [toasts, setToasts] = useState([]);
  const showToast = ({ type = 'success', title, message, icon }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Catalog & Search State with Debouncing & Auto-Suggest
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestResults, setSuggestResults] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [searchSource, setSearchSource] = useState('database-engine');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Optimistic UI State
  const [optimisticAddingId, setOptimisticAddingId] = useState(null);

  // Reviews State
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ text: '', type: '' });

  // Redis-backed Cart State
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Coupons / Promo State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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

  // 280ms Debounced Search Bar - avoids hitting the DB on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      fetchProducts(searchInput, selectedCategory, sortBy);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Real-time Auto-Suggest Dropdown Filter
  useEffect(() => {
    if (searchInput.trim().length > 0) {
      const q = searchInput.toLowerCase();
      const matches = products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.vendor?.storeName && p.vendor.storeName.toLowerCase().includes(q))
      ).slice(0, 5);
      setSuggestResults(matches);
      setIsSuggestOpen(matches.length > 0);
    } else {
      setSuggestResults([]);
      setIsSuggestOpen(false);
    }
  }, [searchInput, products]);

  const fetchProducts = async (query = searchQuery, category = selectedCategory, sort = sortBy) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);

      const res = await fetch(apiUrl(`/api/products?${params.toString()}`));
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

  const fetchProductReviews = async (productId) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(apiUrl(`/api/products/${productId}/reviews`));
      const data = await res.json();
      if (data.success) {
        setProductReviews(data.data || []);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenProductDetail = (product) => {
    setSelectedProduct(product);
    setReviewMessage({ text: '', type: '' });
    setReviewComment('');
    setReviewRating(5);
    fetchProductReviews(product._id);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewMessage({ text: 'Please write a brief comment.', type: 'error' });
      return;
    }
    setReviewSubmitting(true);
    setReviewMessage({ text: '', type: '' });
    try {
      const res = await fetch(apiUrl(`/api/products/${selectedProduct._id}/reviews`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (data.success) {
        setReviewMessage({ text: 'Review published successfully!', type: 'success' });
        setReviewComment('');
        fetchProductReviews(selectedProduct._id);
        fetchProducts(searchQuery, selectedCategory, sortBy);
        showToast({
          type: 'success',
          title: 'Review Published',
          message: 'Thank you! Your verified rating is now live.',
          icon: Star
        });
        setSelectedProduct(prev => ({
          ...prev,
          ratingAverage: data.data.ratingAverage,
          numReviews: data.data.numReviews
        }));
      } else {
        setReviewMessage({ text: data.message || 'Could not submit review.', type: 'error' });
      }
    } catch (err) {
      setReviewMessage({ text: 'Error submitting review.', type: 'error' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponError('');
    setIsApplyingCoupon(true);
    try {
      const res = await fetch(apiUrl('/api/coupons/validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cart.subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        setCouponInput('');
        setCouponError('');
        showToast({
          type: 'success',
          title: 'Coupon Applied',
          message: `Promo code ${data.data.code} applied: saved ₹${data.data.discountAmount}!`,
          icon: Tag
        });
      } else {
        setCouponError(data.message || 'Invalid coupon.');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    showToast({
      type: 'info',
      title: 'Coupon Removed',
      message: 'Promo discount was removed from your order.',
      icon: Tag
    });
  };

  const fetchCart = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(apiUrl('/api/cart'), { headers });
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

    const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    // 1. Optimistic UI Instant State
    setOptimisticAddingId(product._id);
    setTimeout(() => setOptimisticAddingId(null), 1200);

    const prevCart = { ...cart };
    setCart(prev => ({
      ...prev,
      itemCount: (prev.itemCount || 0) + 1,
      subtotal: (prev.subtotal || 0) + displayPrice
    }));

    showToast({
      type: 'success',
      title: 'Added to Bag',
      message: `${product.title} has been added to your shopping bag.`,
      icon: ShoppingBag
    });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/api/cart'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart();
      } else {
        // Rollback optimistic update
        setCart(prevCart);
        showToast({
          type: 'error',
          title: 'Bag Error',
          message: data.message || 'Could not add item to bag.',
          icon: AlertCircle
        });
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      setCart(prevCart);
      showToast({
        type: 'error',
        title: 'Connection Issue',
        message: 'Could not communicate with bag server.',
        icon: AlertCircle
      });
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(apiUrl(`/api/cart/${productId}`), {
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
      await fetch(apiUrl(`/api/cart/${productId}`), {
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
    showToast({
      type: 'info',
      title: 'Demo Card Loaded',
      message: 'Test card details populated. Ready for instant authorization.',
      icon: CreditCard
    });
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

      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: checkoutItems,
          paymentMethod,
          shippingAddress,
          couponCode: appliedCoupon?.code || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.data);
        setAppliedCoupon(null);
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        fetchCart();
        fetchProducts();
        showToast({
          type: 'success',
          title: 'Order Confirmed',
          message: `Order #${data.data.orderNumber} successfully processed!`,
          icon: CheckCircle
        });
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

          {/* Spotlight Search with Debouncing & Auto-Suggest */}
          <div className="search-wrapper" style={{ position: 'relative' }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search products, creators, categories..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => { if (searchInput.trim()) setIsSuggestOpen(true); }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setIsSuggestOpen(false);
                  fetchProducts('', selectedCategory, sortBy);
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--apple-secondary)',
                  cursor: 'pointer',
                  padding: 2
                }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}

            {/* Auto-Suggest Floating Dropdown */}
            {isSuggestOpen && suggestResults.length > 0 && (
              <div className="autosuggest-dropdown">
                <div style={{ padding: '8px 14px 4px', fontSize: '0.72rem', color: 'var(--apple-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Suggested Matches ({suggestResults.length})
                </div>
                {suggestResults.map((item) => (
                  <div
                    key={item._id}
                    className="autosuggest-item"
                    onClick={() => {
                      setIsSuggestOpen(false);
                      handleOpenProductDetail(item);
                    }}
                  >
                    <img src={item.images[0]} alt={item.title} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--apple-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--apple-secondary)' }}>
                        {item.category} • {item.vendor?.storeName || 'Merchant'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--apple-green)' }}>
                      ₹{(item.discountPrice > 0 ? item.discountPrice : item.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
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
                    background: 'var(--theme-accent)',
                    color: '#ffffff',
                    borderRadius: 980,
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(12, 150, 156, 0.5)'
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
          <div className="badge badge-blue" style={{ marginBottom: 16 }}>
            Curated Multi-Vendor Marketplace
          </div>
          <h1 className="apple-hero-title">
            Curated Creations.<br />Delivered Direct from Creators.
          </h1>
          <p className="apple-hero-sub">
            Discover verified merchant storefronts, instant multi-vendor split checkout, and direct artisanal delivery.
          </p>

          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ padding: '13px 34px', fontSize: '1rem', fontWeight: 700 }}
              onClick={() => {
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Collection <ArrowRight size={17} />
            </button>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Direct creator payouts • Instant split transfers • Buyer protection
            </span>
          </div>

          <div className="hero-pills">
            <div className="hero-pill-item">
              <CheckCircle size={15} color="var(--theme-accent)" /> Verified Independent Merchants
            </div>
            <div className="hero-pill-item">
              <Clock size={15} color="var(--theme-accent)" /> Seamless Cart Checkout
            </div>
            <div className="hero-pill-item">
              <CreditCard size={15} color="#f59e0b" /> Instant Multi-Vendor Split Transfers
            </div>
          </div>
        </section>

        {/* Category & Sorting Toolbar */}
        <div id="catalog-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div className="category-bar" style={{ margin: 0 }}>
            <button
              className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('');
                fetchProducts(searchQuery, '', sortBy);
              }}
            >
              All Products ({products.length})
            </button>
            {['Electronics', 'Fashion', 'Footwear', 'Home & Living', 'Accessories'].map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  fetchProducts(searchQuery, cat, sortBy);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort By Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--theme-surface)', padding: '7px 16px', borderRadius: 9999, border: '1px solid var(--theme-border)' }}>
            <SlidersHorizontal size={13} color="var(--theme-slate)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--apple-secondary)', fontWeight: 500 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchProducts(searchQuery, selectedCategory, e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--apple-text)',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Featured (Newest)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Product Gallery Grid */}
        <div className="product-grid">
          {isLoading ? (
            /* 1. Skeleton Loading States (Not Spinners!) */
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-box" style={{ width: '100%', height: 240 }} />
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="skeleton-box" style={{ width: '35%', height: 14 }} />
                  <div className="skeleton-box" style={{ width: '80%', height: 20 }} />
                  <div className="skeleton-box" style={{ width: '100%', height: 36 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div className="skeleton-box" style={{ width: '40%', height: 24 }} />
                    <div className="skeleton-box" style={{ width: '32%', height: 32, borderRadius: 980 }} />
                  </div>
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            /* 5. Thoughtful Catalog Empty State */
            <div className="apple-card" style={{ padding: 56, textAlign: 'center', color: 'var(--apple-secondary)', gridColumn: '1 / -1' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'rgba(0, 113, 227, 0.1)',
                border: '1px solid rgba(0, 113, 227, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: 'var(--apple-blue)',
                boxShadow: '0 0 32px rgba(0, 113, 227, 0.15)'
              }}>
                <Search size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--apple-text)', marginBottom: 8 }}>
                {searchQuery ? `No listings found matching "${searchQuery}"` : 'No products in this category'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--apple-secondary)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.55 }}>
                {searchQuery || selectedCategory
                  ? 'We couldn\'t find any matches. Try adjusting your search query, choosing a different category, or clearing your active filters.'
                  : 'Merchants can publish products in Seller Central to make them available to buyers.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(searchQuery || selectedCategory) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setSelectedCategory('');
                      fetchProducts('', '', sortBy);
                    }}
                  >
                    Clear Filters & Reset
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => navigate('/vendor')}>
                  Go to Seller Central
                </button>
              </div>
            </div>
          ) : (
            products.map((product) => {
              const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
              const isOptimisticAdded = optimisticAddingId === product._id;
              return (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => handleOpenProductDetail(product)}
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

                      {/* 2. Optimistic UI Updates on Add to Bag */}
                      <button
                        className="btn btn-primary"
                        style={{
                          padding: '7px 16px',
                          fontSize: '0.8rem',
                          background: isOptimisticAdded ? 'var(--apple-green)' : 'var(--apple-blue)',
                          transition: 'var(--transition-apple)'
                        }}
                        disabled={isOptimisticAdded}
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        {isOptimisticAdded ? (
                          <>
                            <Check size={14} /> Added!
                          </>
                        ) : (
                          'Add to Bag'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
                <div style={{ textAlign: 'center', margin: 'auto', padding: '32px 16px', color: 'var(--apple-secondary)' }}>
                  <div style={{
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    background: 'rgba(0, 113, 227, 0.08)',
                    border: '1px solid rgba(0, 113, 227, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                    color: 'var(--apple-blue)',
                    boxShadow: '0 0 32px rgba(0, 113, 227, 0.15)'
                  }}>
                    <ShoppingBag size={34} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--apple-text)', marginBottom: 8 }}>
                    Your Bag is Empty
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--apple-secondary)', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.55 }}>
                    You haven't added any products yet. Browse creator goods from independent verified merchants.
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                    onClick={() => {
                      setIsCartOpen(false);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                  >
                    Continue Shopping
                  </button>
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
              <div style={{ padding: 24, borderTop: '1px solid var(--apple-hairline)', background: '#f8fafc' }}>
                {/* Promo Code Input in Cart */}
                <div style={{ marginBottom: 16 }}>
                  {!appliedCoupon ? (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Tag size={14} color="var(--apple-secondary)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            placeholder="Enter promo (e.g. WELCOME10)"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                            className="form-input"
                            style={{ padding: '7px 10px 7px 30px', fontSize: '0.8rem', textTransform: 'uppercase' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                          disabled={isApplyingCoupon || !couponInput.trim()}
                          onClick={() => handleApplyCoupon()}
                        >
                          {isApplyingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>

                      {/* Quick Coupon Suggestions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { code: 'WELCOME10', label: '10% OFF' },
                          { code: 'FESTIVE20', label: '20% OFF' }
                        ].map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            style={{
                              background: 'rgba(48, 209, 88, 0.1)',
                              border: '1px solid rgba(48, 209, 88, 0.3)',
                              color: 'var(--apple-green)',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            🏷️ {c.code} ({c.label})
                          </button>
                        ))}
                      </div>

                      {couponError && (
                        <div style={{ color: '#ff453a', fontSize: '0.74rem', marginTop: 6 }}>{couponError}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(48, 209, 88, 0.12)',
                      border: '1px solid rgba(48, 209, 88, 0.3)',
                      padding: '8px 12px',
                      borderRadius: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={14} color="var(--apple-green)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-green)' }}>
                          {appliedCoupon.code} Applied (-₹{appliedCoupon.discountAmount.toLocaleString()})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{ background: 'none', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', color: 'var(--apple-secondary)' }}>
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', color: 'var(--apple-green)', fontWeight: 600 }}>
                    <span>Promo Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '1.25rem', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>₹{Math.max(0, cart.subtotal - (appliedCoupon ? appliedCoupon.discountAmount : 0)).toLocaleString()}</span>
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
                {(() => {
                  const discountVal = appliedCoupon ? appliedCoupon.discountAmount : 0;
                  const finalPayable = Math.max(0, cart.subtotal - discountVal);
                  return (
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 18, marginBottom: 24, border: '1px solid var(--apple-hairline)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--apple-secondary)' }}>Cart Subtotal</span>
                          <strong style={{ color: 'var(--apple-text)' }}>₹{cart.subtotal.toLocaleString()}</strong>
                        </div>
                        {appliedCoupon && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--apple-green)' }}>
                            <span>Promo Discount ({appliedCoupon.code})</span>
                            <strong>-₹{discountVal.toLocaleString()}</strong>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--apple-secondary)' }}>Platform Service Fee (10%)</span>
                          <strong style={{ color: 'var(--apple-green)' }}>₹{(finalPayable * 0.1).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--apple-hairline)' }}>
                          <span style={{ color: 'var(--apple-secondary)' }}>Net Vendor Remittance (90%)</span>
                          <strong style={{ color: '#2997ff' }}>₹{(finalPayable * 0.9).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--apple-hairline)', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 600 }}>Total Payable</span>
                          <strong style={{ color: 'var(--apple-text)' }}>₹{finalPayable.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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

                {(() => {
                  const discountVal = appliedCoupon ? appliedCoupon.discountAmount : 0;
                  const finalPayable = Math.max(0, cart.subtotal - discountVal);
                  return (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                      disabled={isProcessingPayment}
                      onClick={handleCheckout}
                    >
                      {isProcessingPayment
                        ? 'Processing Split Authorization...'
                        : paymentMethod === 'cod'
                        ? `Confirm Cash on Delivery (₹${finalPayable.toLocaleString()})`
                        : `Pay ₹${finalPayable.toLocaleString()}`}
                    </button>
                  );
                })()}
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
                    href={apiUrl(`/api/orders/${completedOrder._id}/invoice`)}
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
          APPLE PRODUCT DETAIL SHEET WITH REVIEWS & RATINGS
          ========================================================================= */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 36, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer' }}
                onClick={() => setSelectedProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 20 }}>
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

            <p style={{ color: 'var(--apple-secondary)', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: 20 }}>
              {selectedProduct.description}
            </p>

            {/* Customer Reviews & Ratings Section */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--apple-hairline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} color="var(--apple-blue)" />
                    Customer Reviews ({selectedProduct.numReviews || productReviews.length || 0})
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ display: 'flex', color: '#ffd60a' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={s <= Math.round(selectedProduct.ratingAverage || 5) ? '#ffd60a' : 'transparent'}
                          color="#ffd60a"
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text)' }}>
                      {selectedProduct.ratingAverage || 5.0} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 200, overflowY: 'auto' }}>
                {loadingReviews ? (
                  <div style={{ textAlign: 'center', padding: 14, color: 'var(--apple-secondary)', fontSize: '0.8rem' }}>
                    Loading reviews...
                  </div>
                ) : productReviews.length === 0 ? (
                  <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, textAlign: 'center', color: 'var(--apple-secondary)', fontSize: '0.82rem' }}>
                    No customer reviews yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev._id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 10,
                        border: '1px solid var(--apple-hairline)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{rev.customer?.name || 'Customer'}</span>
                          <span className="badge badge-green" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>Verified Buyer</span>
                        </div>
                        <div style={{ display: 'flex', color: '#ffd60a' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              fill={s <= rev.rating ? '#ffd60a' : 'transparent'}
                              color="#ffd60a"
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--apple-secondary)', lineHeight: 1.45, margin: 0 }}>
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Write a Review Form */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--apple-hairline)' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: 8 }}>Write a Verified Review</h4>
                <form onSubmit={handleSubmitReview}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--apple-secondary)' }}>Rating:</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setReviewRating(starVal)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Star
                            size={16}
                            fill={starVal <= reviewRating ? '#ffd60a' : 'transparent'}
                            color="#ffd60a"
                          />
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--apple-text)' }}>
                      {reviewRating} / 5 Stars
                    </span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Share your thoughts on build quality, design, and performance..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>

                  {reviewMessage.text && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        marginBottom: 10,
                        background: reviewMessage.type === 'success' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)',
                        color: reviewMessage.type === 'success' ? 'var(--apple-green)' : '#ff453a',
                        border: reviewMessage.type === 'success' ? '1px solid rgba(48, 209, 88, 0.3)' : '1px solid rgba(255, 69, 58, 0.3)'
                      }}
                    >
                      {reviewMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={reviewSubmitting}
                    style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={12} /> {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>
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

      {/* 4. Floating Glassmorphism Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((toast) => {
          const Icon = toast.icon || CheckCircle;
          return (
            <div key={toast.id} className="toast-item">
              <div style={{
                color: toast.type === 'error' ? 'var(--apple-red)' : toast.type === 'info' ? 'var(--apple-blue)' : 'var(--apple-green)',
                marginTop: 2,
                display: 'flex'
              }}>
                <Icon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--apple-text)', marginBottom: 2 }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--apple-secondary)', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', color: 'var(--apple-secondary)', cursor: 'pointer', padding: 2 }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
