# Production Deployment Guide
**MarketPulse — Multi-Vendor E-Commerce Marketplace**

This guide outlines step-by-step instructions to deploy the frontend and backend separately for production environments.

---

## 1. Architecture Split

| Tier | Recommended Platform | Build Output | Root Directory |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Static Vite bundle (`dist/`) | `/client` |
| **Backend** | [Render](https://render.com) or [Railway](https://railway.app) | Node.js Express API service | `/server` |

---

## 2. Deploying Backend (`/server`) to Render / Railway

### Step 2.1: Create Web Service
1. Link your GitHub repository to [Render](https://render.com).
2. Choose **New Web Service** and configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: Free / Standard

### Step 2.2: Environment Variables
Configure the following environment variables in your hosting dashboard:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port (assigned automatically by host) | `5000` |
| `JWT_SECRET` | 256-bit cryptographic signing secret | `your_secure_random_jwt_secret_key` |
| `CLIENT_URL` | Deployed frontend URL for CORS | `https://your-marketplace.vercel.app` |
| `MONGODB_URI` *(Optional)* | Cloud MongoDB connection string (leave empty for automatic In-Memory engine) | `mongodb+srv://user:pass@cluster.mongodb.net/marketpulse` |
| `REDIS_URL` *(Optional)* | Redis Cloud URL (leave empty for automatic In-Memory adapter) | `rediss://default:pass@redis-cloud.com:6379` |
| `ELASTICSEARCH_NODE` *(Optional)* | Elasticsearch host (leave empty for automatic In-Memory adapter) | `http://localhost:9200` |

---

## 3. Deploying Frontend (`/client`) to Vercel

### Step 3.1: Create Project on Vercel
1. Link your GitHub repository to [Vercel](https://vercel.com).
2. Choose **New Project** and set:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3.2: Environment Variables
Add the following in Vercel Project Settings ➔ Environment Variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Deployed backend service URL | `https://marketpulse-api.onrender.com` |

### Step 3.3: Client-Side Routing (`vercel.json`)
Vercel requires single-page application (SPA) rewrite rules to ensure routes like `/vendor`, `/admin`, and `/my-orders` load directly without 404s. Ensure `client/vercel.json` contains:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Verification & Health Check Checklist

After both tiers are deployed:
1. **Health Check**: Open `https://your-api.onrender.com/api/health` ➔ Confirm `{ status: "ok" }`.
2. **Catalog Fetch**: Verify products and category filters load on the public storefront.
3. **Authentication**: Sign in with seeded credentials (`alex@example.com` or `vendor@example.com`).
4. **Checkout**: Place a test order using Card, UPI, NetBanking, or COD.
5. **PDF Invoicing**: Click "Download Tax PDF" ➔ Verify official invoice generates and streams.
6. **Live Sync**: Open `/admin` and verify Gross Sales Volume and Commissions update in real-time.
