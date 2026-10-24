import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

test('MarketPulse E-Commerce API Integration Test Suite', async (t) => {
  let customerToken = '';
  let vendorToken = '';
  let sampleProductId = '';

  await t.test('1. System Healthcheck & Service Status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'online');
    assert.equal(body.services.api, 'healthy');
    assert.equal(body.services.database, 'connected');
    assert.equal(body.services.cache, 'operational');
  });

  await t.test('2. OpenAPI Specification Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/docs/spec.json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.0');
    assert.ok(spec.paths['/api/products']);
    assert.ok(spec.paths['/api/orders']);
  });

  await t.test('3. Customer Authentication (JWT)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token, 'Token must be returned');
    assert.equal(body.user.role, 'customer');
    customerToken = body.token;
  });

  await t.test('4. Vendor Authentication (JWT)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tech@vendor.com',
        password: 'password123'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'vendor');
    vendorToken = body.token;
  });

  await t.test('5. Catalog Search & Filter Querying', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length > 0, 'Catalog should contain products');
    sampleProductId = body.data[0]._id;

    // Test category filter
    const catRes = await fetch(`${BASE_URL}/api/products?category=Electronics`);
    assert.equal(catRes.status, 200);
    const catBody = await catRes.json();
    assert.ok(catBody.data.every(p => p.category === 'Electronics'));
  });

  await t.test('6. Coupon Application & Discount Math', async () => {
    const res = await fetch(`${BASE_URL}/api/coupons/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'WELCOME10',
        cartSubtotal: 10000
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.discount, 1000); // 10% of 10,000 = 1000
    assert.equal(body.code, 'WELCOME10');
  });

  await t.test('7. Multi-Vendor Order Creation & Payout Split', async () => {
    assert.ok(sampleProductId, 'Sample product ID must exist');
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [{ productId: sampleProductId, quantity: 1 }],
        shippingAddress: {
          street: '12 Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India'
        },
        couponCode: 'WELCOME10',
        paymentMethod: 'card'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.orderNumber.startsWith('ORD-'));
    assert.equal(body.data.orderStatus, 'placed');
    assert.ok(body.data.commissionTotal >= 0);
  });

  await t.test('8. Rate Limiter Headers Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.has('ratelimit-limit'), 'RateLimit header should be present');
  });
});
