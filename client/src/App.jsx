import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Store,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  Truck,
  Package,
  Clock,
  Sparkles,
  CreditCard,
  FileText,
  DollarSign,
  ChevronRight,
  X,
  Star,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Pre-seeded Demo Profiles for 1-Click Role Switching
const DEMO_USERS = {
  customer: {
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
    name: 'Alex Johnson',
    badge: 'Customer'
  },
  vendor: {
    email: 'tech@vendor.com',
    password: 'password123',
    role: 'vendor',
    name: 'TechHub Electronics',
    badge: 'Vendor'
  },
  admin: {
    email: 'admin@marketplace.com',
    password: 'password123',
    role: 'admin',
    name: 'Super Admin',
    badge: 'Platform Admin'
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'vendor' | 'admin' | 'my-orders'

  // Catalog & Search State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('database-engine');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cart State (Redis-backed)
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Checkout & Split-Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Vendor & Admin Dashboard States
  const [vendorProducts, setVendorProducts] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorAnalytics, setVendorAnalytics] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    title: '',
    category: 'Electronics',
    brand: '',
    price: '',
    discountPrice: '',
    stock: 10,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  });

  // Switch Role / Auto-login
  const switchRole = async (roleKey) => {
    try {
      const creds = DEMO_USERS[roleKey];
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: creds.email, password: creds.password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        if (creds.role === 'vendor') setActiveTab('vendor');
        else if (creds.role === 'admin') setActiveTab('admin');
        else setActiveTab('marketplace');
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  // Initial Load: Auto-login as customer and fetch products & cart
  useEffect(() => {
    switchRole('customer');
    fetchProducts();
    fetchCart();
  }, []);

  // Fetch products with search and category filters
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

  // Fetch Cart from Redis
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

  // Add to Cart
  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    setCartLoading(true);
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
    } finally {
      setCartLoading(false);
    }
  };

  // Update Cart Item Quantity
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

  // Remove from Cart
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

  // Execute Simulated Split-Payment Checkout
  const handleCheckout = async () => {
    if (!token) {
      alert('Please select a customer role to complete checkout.');
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
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        fetchCart();
        fetchProducts();
      } else {
        alert(data.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Payment processing error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Load Vendor Dashboard Data
  const loadVendorDashboard = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, orderRes, analyticsRes] = await Promise.all([
        fetch('/api/products/vendor/mine', { headers }),
        fetch('/api/orders/vendor/incoming', { headers }),
        fetch('/api/analytics/vendor', { headers })
      ]);

      const [prods, orders, analytics] = await Promise.all([
        prodRes.json(),
        orderRes.json(),
        analyticsRes.json()
      ]);

      if (prods.success) setVendorProducts(prods.data);
      if (orders.success) setVendorOrders(orders.data);
      if (analytics.success) setVendorAnalytics(analytics.data);
    } catch (err) {
      console.error('Vendor data error:', err);
    }
  };

  // Load Admin Analytics
  const loadAdminDashboard = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/analytics/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAdminAnalytics(data.data);
    } catch (err) {
      console.error('Admin data error:', err);
    }
  };

  // Load Customer Orders
  const loadMyOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMyOrders(data.data);
    } catch (err) {
      console.error('Customer orders error:', err);
    }
  };

  // Advance Order Fulfillment Status by Vendor
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
        loadVendorDashboard();
      }
    } catch (err) {
      console.error('Fulfillment update error:', err);
    }
  };

  // Create Product as Vendor
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
          title: newProductForm.title,
          category: newProductForm.category,
          brand: newProductForm.brand || 'Store Brand',
          price: Number(newProductForm.price),
          discountPrice: Number(newProductForm.discountPrice || 0),
          stock: Number(newProductForm.stock || 10),
          description: newProductForm.description,
          images: [newProductForm.imageUrl]
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddProductOpen(false);
        loadVendorDashboard();
        fetchProducts();
        alert('Product published and indexed into Elasticsearch successfully!');
      } else {
        alert(data.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Product creation error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'vendor') loadVendorDashboard();
    if (activeTab === 'admin') loadAdminDashboard();
    if (activeTab === 'my-orders') loadMyOrders();
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* =========================================================================
          NAVIGATION HEADER
          ========================================================================= */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          {/* Logo */}
          <div className="logo-wrap" onClick={() => setActiveTab('marketplace')}>
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
                {searchSource === 'elasticsearch' ? 'ElasticSearch' : 'Catalog Search'}
              </span>
            )}
          </div>

          {/* Navigation & Role Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Role Switcher Pill */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: 4,
                borderRadius: 10,
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 8,
                  background: currentUser?.role === 'customer' ? 'var(--primary)' : 'transparent',
                  color: currentUser?.role === 'customer' ? '#ffffff' : 'var(--text-muted)'
                }}
                onClick={() => switchRole('customer')}
              >
                <User size={14} /> Customer
              </button>
              <button
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 8,
                  background: currentUser?.role === 'vendor' ? 'var(--primary)' : 'transparent',
                  color: currentUser?.role === 'vendor' ? '#ffffff' : 'var(--text-muted)'
                }}
                onClick={() => switchRole('vendor')}
              >
                <Store size={14} /> Vendor
              </button>
              <button
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 8,
                  background: currentUser?.role === 'admin' ? 'var(--primary)' : 'transparent',
                  color: currentUser?.role === 'admin' ? '#ffffff' : 'var(--text-muted)'
                }}
                onClick={() => switchRole('admin')}
              >
                <ShieldCheck size={14} /> Admin
              </button>
            </div>

            {/* My Orders (for customers) */}
            {currentUser?.role === 'customer' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
                onClick={() => setActiveTab('my-orders')}
              >
                <Package size={16} /> My Orders
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

      {/* =========================================================================
          MAIN CONTENT AREA
          ========================================================================= */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        {/* =====================================================================
            VIEW 1: MARKETPLACE CATALOG (CUSTOMER BROWSE)
            ===================================================================== */}
        {activeTab === 'marketplace' && (
          <div>
            {/* Hero Section */}
            <section className="hero-banner">
              <div style={{ maxWidth: 650, position: 'relative', zIndex: 1 }}>
                <div className="badge badge-indigo" style={{ marginBottom: 14 }}>
                  <Sparkles size={14} /> Next-Gen Multi-Vendor Marketplace
                </div>
                <h1 className="heading-display gradient-text" style={{ fontSize: '2.6rem', lineHeight: 1.15, marginBottom: 14 }}>
                  Direct from verified vendors, split seamlessly at checkout.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: 24 }}>
                  Experience real-time Redis cart caching, Elasticsearch faceted search, and automated multi-vendor revenue splitting with 10% platform commission.
                </p>

                {/* Micro Metrics Strip */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: '0.88rem' }}>
                    <CheckCircle size={16} /> 100% Free Sandbox Payments
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontSize: '0.88rem' }}>
                    <Clock size={16} /> Sub-Millisecond Redis Cart
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontSize: '0.88rem' }}>
                    <Store size={16} /> Isolated Vendor Balances
                  </div>
                </div>
              </div>
            </section>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 999, padding: '8px 18px' }}
                onClick={() => {
                  setSelectedCategory('');
                  fetchProducts(searchQuery, '');
                }}
              >
                All Categories ({products.length})
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

            {/* Products Grid */}
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
                          {product.vendor?.storeName || 'Verified Vendor'}
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
          </div>
        )}

        {/* =====================================================================
            VIEW 2: VENDOR STOREFRONT & FULFILLMENT DASHBOARD
            ===================================================================== */}
        {activeTab === 'vendor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <div className="badge badge-emerald" style={{ marginBottom: 8 }}>
                  <Store size={14} /> Vendor Portal Active
                </div>
                <h1 className="heading-display" style={{ fontSize: '2rem' }}>
                  {vendorAnalytics?.storeName || 'TechHub Electronics'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Platform Commission Rate: <strong style={{ color: 'var(--accent-cyan)' }}>{vendorAnalytics?.commissionRate || 10}%</strong> | Net Vendor Share: <strong style={{ color: '#34d399' }}>90%</strong>
                </p>
              </div>

              <button
                className="btn btn-emerald"
                onClick={() => setIsAddProductOpen(true)}
              >
                <Plus size={18} /> Publish New Product
              </button>
            </div>

            {/* Financial Ledger Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 10 }}>
                  <span>Available Balance</span>
                  <DollarSign size={20} color="#34d399" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                  ₹{(vendorAnalytics?.balance?.available || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Eligible for 1-click test transfer
                </div>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 10 }}>
                  <span>Total Net Sales</span>
                  <ShoppingBag size={20} color="var(--primary-light)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                  ₹{(vendorAnalytics?.totalVendorSales || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Across {vendorAnalytics?.totalOrdersCount || 0} customer orders
                </div>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 10 }}>
                  <span>Live Catalog</span>
                  <Package size={20} color="var(--accent-cyan)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {vendorProducts.length} Products
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Synchronized with Elasticsearch
                </div>
              </div>
            </div>

            {/* Incoming Orders to Fulfill */}
            <h2 className="heading-display" style={{ fontSize: '1.35rem', marginBottom: 16 }}>
              Incoming Customer Orders & Multi-Vendor Split Settlements
            </h2>

            {vendorOrders.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 36 }}>
                <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No incoming orders yet. Switch to "Customer" role and purchase any items to see live split settlement here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                {vendorOrders.map((order) => (
                  <div key={order._id} className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
                          Order #{order.orderNumber}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 10 }}>
                          Placed by {order.customer?.name} ({order.customer?.email})
                        </span>
                      </div>
                      <div className="badge badge-emerald">
                        Net Vendor Share: ₹{order.vendorTotalEarnings.toLocaleString()}
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
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 8
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={item.image} alt={item.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Qty: {item.quantity} | Item: ₹{item.price} | Platform Comm (10%): -₹{item.platformCommissionAmount}
                              </div>
                            </div>
                          </div>

                          {/* Fulfillment Stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`badge ${item.vendorFulfillmentStatus === 'delivered' ? 'badge-emerald' : 'badge-amber'}`}>
                              {item.vendorFulfillmentStatus.toUpperCase()}
                            </span>

                            {item.vendorFulfillmentStatus === 'placed' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => advanceFulfillment(order._id, item._id, 'packed')}
                              >
                                Mark Packed
                              </button>
                            )}

                            {item.vendorFulfillmentStatus === 'packed' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => advanceFulfillment(order._id, item._id, 'shipped')}
                              >
                                <Truck size={14} /> Mark Shipped
                              </button>
                            )}

                            {item.vendorFulfillmentStatus === 'shipped' && (
                              <button
                                className="btn btn-emerald"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
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
        )}

        {/* =====================================================================
            VIEW 3: ADMIN ANALYTICS & PLATFORM CONTROLS
            ===================================================================== */}
        {activeTab === 'admin' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
                <ShieldCheck size={14} /> Master Platform Administration
              </div>
              <h1 className="heading-display" style={{ fontSize: '2rem' }}>
                Marketplace Analytics & Platform Revenue
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Real-time overview of Gross Merchandise Value (GMV), 10% platform commission cuts, and vendor activity.
              </p>
            </div>

            {/* Master Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 36 }}>
              <div className="glass-card" style={{ padding: 22 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Platform Commissions Earned</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '6px 0' }}>
                  ₹{(adminAnalytics?.summary?.platformCommissions || 0).toLocaleString()}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Net platform revenue from splits</span>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gross Merchandise Value (GMV)</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '6px 0' }}>
                  ₹{(adminAnalytics?.summary?.grossMerchandiseValue || 0).toLocaleString()}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total customer spending</span>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registered Vendors</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)', margin: '6px 0' }}>
                  {adminAnalytics?.summary?.totalVendors || 2}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Active multi-vendor storefronts</span>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Catalog Products</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '6px 0' }}>
                  {adminAnalytics?.summary?.totalProducts || products.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Indexed in search engine</span>
              </div>
            </div>

            {/* Recent Orders Log */}
            <h2 className="heading-display" style={{ fontSize: '1.35rem', marginBottom: 16 }}>
              Platform Transaction Audit Log
            </h2>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Order ID</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Customer</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Total Amount</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Platform Fee</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(adminAnalytics?.recentOrders || []).map((o) => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{o.orderNumber}</td>
                      <td style={{ padding: '14px 20px' }}>{o.customer?.name}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700 }}>₹{o.totalAmount}</td>
                      <td style={{ padding: '14px 20px', color: '#34d399', fontWeight: 600 }}>+₹{o.commissionTotal}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-indigo">{o.orderStatus.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <a
                          href={`/api/orders/${o._id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <FileText size={14} /> PDF Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 4: CUSTOMER ORDERS & PDF INVOICE DOWNLOADS
            ===================================================================== */}
        {activeTab === 'my-orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h1 className="heading-display" style={{ fontSize: '2rem' }}>My Orders & Purchase History</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track delivery lifecycle and download automated tax PDF invoices.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setActiveTab('marketplace')}>
                ← Back to Catalog
              </button>
            </div>

            {myOrders.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>You haven't placed any orders yet. Add items to your cart and test the split payment checkout!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {myOrders.map((order) => (
                  <div key={order._id} className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{order.orderNumber}</span>
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
                                Sold by: {item.vendor?.storeName || 'Vendor'} | Qty: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          REDIS-BACKED SHOPPING CART DRAWER
          ========================================================================= */}
      {isCartOpen && (
        <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
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

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>Your Redis shopping cart is empty.</p>
                  <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setIsCartOpen(false)}>
                    Browse Products
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>₹{item.lineTotal.toLocaleString()}</span>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                            onClick={() => handleRemoveFromCart(item.productId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.items.length > 0 && (
              <div style={{ padding: 24, borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
                {/* Multi-Vendor Split Preview */}
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>
                    Automated Multi-Vendor Revenue Split:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    • Platform Retains: 10% commission fee<br />
                    • Vendors Receive: 90% direct payout credit
                  </div>
                </div>

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

      {/* =========================================================================
          CHECKOUT & SPLIT PAYMENT MODAL (STRIPE / RAZORPAY TEST MODE)
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
            {!completedOrder ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div className="badge badge-emerald" style={{ marginBottom: 6 }}>
                      <CreditCard size={14} /> Stripe / Razorpay Test Mode
                    </div>
                    <h2 className="heading-display" style={{ fontSize: '1.5rem' }}>Split Payment Settlement</h2>
                  </div>
                  <button
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Split Calculation Table */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Real-time Payment Distribution:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gross Order Subtotal</span>
                      <strong style={{ color: '#ffffff' }}>₹{cart.subtotal.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                      <span>Platform Commission Cut (10%)</span>
                      <strong>₹{(cart.subtotal * 0.1).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-cyan)' }}>
                      <span>Vendor Net Payout Pool (90%)</span>
                      <strong>₹{(cart.subtotal * 0.9).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Simulated Dummy Payment Info */}
                <div style={{ background: '#0b101c', padding: 14, borderRadius: 8, border: '1px dashed var(--border-subtle)', marginBottom: 24 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                    Simulated Sandbox Payment Card (Zero-Cost):
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#ffffff' }}>
                    <CreditCard size={18} color="var(--primary-light)" />
                    <span>•••• •••• •••• 4242</span>
                    <span style={{ marginLeft: 'auto', color: '#34d399', fontSize: '0.78rem' }}>Authorized</span>
                  </div>
                </div>

                <button
                  className="btn btn-emerald"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  disabled={isProcessingPayment}
                  onClick={handleCheckout}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw size={18} className="spin-animate" /> Processing Multi-Vendor Split...
                    </>
                  ) : (
                    <>Pay ₹{cart.subtotal.toLocaleString()} & Transfer Funds</>
                  )}
                </button>
              </div>
            ) : (
              /* Success Order Confirmation */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <CheckCircle size={36} color="#34d399" />
                </div>
                <h2 className="heading-display" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
                  Payment & Split Complete!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 20 }}>
                  Order <strong>{completedOrder.orderNumber}</strong> was recorded. Platform commission was credited to Admin and remaining funds were transferred to vendor balances.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <a
                    href={`/api/orders/${completedOrder._id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '12px 20px' }}
                  >
                    <FileText size={18} /> Download PDF Invoice
                  </a>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px' }}
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setCompletedOrder(null);
                      setActiveTab('my-orders');
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

      {/* =========================================================================
          VENDOR: ADD NEW PRODUCT MODAL
          ========================================================================= */}
      {isAddProductOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProductOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="heading-display" style={{ fontSize: '1.4rem' }}>Publish Product to Marketplace</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setIsAddProductOpen(false)}
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
                  value={newProductForm.title}
                  onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
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
                    placeholder="Brand name"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
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
                    placeholder="1999"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="1499"
                    value={newProductForm.discountPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, discountPrice: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (S3 / Cloudinary)</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  value={newProductForm.imageUrl}
                  onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="Detailed product highlights..."
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Publish Listing & Index in Elasticsearch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRODUCT DETAILS MODAL
          ========================================================================= */}
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
                <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
                  {selectedProduct.category}
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                  {selectedProduct.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Store size={15} color="var(--primary-light)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Store: <strong>{selectedProduct.vendor?.storeName || 'Verified Store'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
                  ₹{(selectedProduct.discountPrice > 0 ? selectedProduct.discountPrice : selectedProduct.price).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#34d399', marginBottom: 16 }}>
                  In Stock ({selectedProduct.stock} units available)
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

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {selectedProduct.description}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          MarketPulse Multi-Vendor Capstone Platform • Built with React, Node.js, Express, MongoDB, Redis, Elasticsearch, and Stripe Connect.
        </p>
      </footer>
    </div>
  );
}
