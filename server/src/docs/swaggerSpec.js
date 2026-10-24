export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MarketPulse — Multi-Vendor E-Commerce Marketplace API',
    version: '1.0.0',
    description: 'Enterprise REST API Gateway featuring Role-Based Access Control (RBAC), Elasticsearch faceted search, Redis cart caching, and multi-vendor split transfer payments.',
    contact: {
      name: 'MarketPulse Engineering',
      email: 'api-support@marketplace.com'
    }
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local Development Server' },
    { url: 'https://api.marketplace.com', description: 'Production Gateway' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login'
      }
    }
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'System health check and services status',
        tags: ['System'],
        responses: {
          200: { description: 'Healthy and operational' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register new customer or vendor',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Alex Johnson' },
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['customer', 'vendor'], default: 'customer' },
                  phone: { type: 'string', example: '+91 9876543210' },
                  storeName: { type: 'string', example: 'Apex Gear Studio (for vendors)' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'User already exists or validation error' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user and obtain JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'customer@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authentication successful with JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current authenticated user profile and vendor store details',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile object' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/products': {
      get: {
        summary: 'Faceted catalog search and filter',
        tags: ['Products'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search keyword query' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category facet' },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Sort order: price_asc, price_desc, rating' },
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Pagination page number' }
        ],
        responses: {
          200: { description: 'List of matching catalog products with facets' }
        }
      },
      post: {
        summary: 'Create/Publish new product (Vendor only)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'price', 'images'],
                properties: {
                  title: { type: 'string' },
                  category: { type: 'string' },
                  brand: { type: 'string' },
                  price: { type: 'number' },
                  discountPrice: { type: 'number' },
                  stock: { type: 'integer' },
                  description: { type: 'string' },
                  images: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Product created successfully' },
          403: { description: 'Vendor authorization required' }
        }
      }
    },
    '/api/cart': {
      get: {
        summary: 'Get customer shopping bag from Redis cache',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Cart items with computed subtotal' }
        }
      },
      post: {
        summary: 'Add item to Redis cart or increment quantity',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer', default: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Updated cart object' }
        }
      }
    },
    '/api/orders': {
      post: {
        summary: 'Checkout with multi-vendor split payment calculation',
        tags: ['Orders & Checkout'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'shippingAddress'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer' }
                      }
                    }
                  },
                  shippingAddress: { type: 'object' },
                  couponCode: { type: 'string', example: 'WELCOME10' },
                  paymentMethod: { type: 'string', example: 'card' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Order created, inventory decremented, split payment transferred' },
          400: { description: 'Invalid items or coupon' }
        }
      }
    },
    '/api/orders/my-orders': {
      get: {
        summary: 'Get customer past order history',
        tags: ['Orders & Checkout'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of placed orders' }
        }
      }
    },
    '/api/orders/{id}/invoice': {
      get: {
        summary: 'Download automated PDF tax invoice',
        tags: ['Orders & Checkout'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'PDF stream with application/pdf Content-Type' }
        }
      }
    },
    '/api/coupons/apply': {
      post: {
        summary: 'Validate and calculate promo coupon discount',
        tags: ['Coupons'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'cartSubtotal'],
                properties: {
                  code: { type: 'string', example: 'WELCOME10' },
                  cartSubtotal: { type: 'number', example: 5000 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Discount amount and applied promo details' }
        }
      }
    },
    '/api/analytics/vendor': {
      get: {
        summary: 'Vendor sales volume, net remittances, and fulfillments',
        tags: ['Analytics'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Vendor analytics' }
        }
      }
    },
    '/api/analytics/admin': {
      get: {
        summary: 'Platform GMV, 10% commission fee audit, and merchant payouts',
        tags: ['Analytics'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Platform financial metrics' }
        }
      }
    }
  }
};
