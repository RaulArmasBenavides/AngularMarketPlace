# 🚀 Running the Complete Marketplace Application

Complete guide to run both Frontend (Angular) and Backend (Node.js) locally.

## 📋 Prerequisites

- **Node.js 16+** installed
- **MongoDB** running locally or MongoDB Atlas connection string
- **Terminal/CMD** with 2 windows (one for frontend, one for backend)

## 🎯 Quick Start (3 Steps)

### Step 1: Setup Backend

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev
```

Expected output:
```
✅ MongoDB connected
🚀 Backend running at http://localhost:3000
```

### Step 2: Setup Frontend

```bash
# Terminal 2 - Frontend
npm install
npm start
```

Expected output:
```
✅ Angular running at http://localhost:4200
```

### Step 3: Test the Application

1. Open browser: http://localhost:4200
2. Click **Register** → Create account
3. Click **Login** → Log in with your credentials
4. Add items to cart → Click **Checkout**
5. See **Order Confirmation**

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│     Angular Frontend (Port 4200)        │
├─────────────────────────────────────────┤
│  ✓ Login/Register Components            │
│  ✓ Product Browsing                     │
│  ✓ Shopping Cart                        │
│  ✓ Checkout (Stripe/PayPal)             │
│  ✓ User Dashboard                       │
│  ✓ Order History                        │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
               ↓
┌─────────────────────────────────────────┐
│    Node.js Express Backend (Port 3000)  │
├─────────────────────────────────────────┤
│  ✓ JWT Authentication                   │
│  ✓ User Management                      │
│  ✓ Order Processing                     │
│  ✓ Payment Integration (Stripe/PayPal)  │
│  ✓ Address Management                   │
└──────────────┬──────────────────────────┘
               │ MongoDB Driver
               ↓
┌─────────────────────────────────────────┐
│    MongoDB Database (Port 27017)        │
├─────────────────────────────────────────┤
│  ✓ Users Collection                     │
│  ✓ Orders Collection                    │
│  ✓ Payment Methods                      │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Backend (.env)

```bash
# backend/.env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=your-secret-key-123
CORS_ORIGIN=http://localhost:4200
STRIPE_SECRET_KEY=sk_test_demo
PAYPAL_CLIENT_ID=demo-paypal-id
```

### Frontend (environment.ts)

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  marketPlaceUrl: 'http://localhost:3000/api',
  paymentProvider: 'stripe',
  // ... other config
};
```

---

## 📱 Testing the Flows

### 1. User Registration & Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Testing Stripe Payment

1. Go to checkout
2. Fill shipping address
3. Click "Continue to Payment"
4. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date (12/25)
   - CVC: Any 3 digits (123)
5. Click "Complete Purchase"

### 3. Testing PayPal Payment

Change `environment.ts`:
```typescript
paymentProvider: 'paypal'
```

Restart frontend. PayPal buttons appear automatically.

---

## 📁 Project Structure

```
AngularMarketPlace/
├── backend/                    # Node.js Express API
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth, error handling
│   ├── server.js              # Main server
│   ├── .env                   # Environment config
│   └── package.json
│
├── src/                       # Angular Frontend
│   ├── app/
│   │   ├── core/              # Services, Guards, Interceptors
│   │   ├── features/          # Page components
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── checkout/      # Checkout, Confirmation
│   │   │   └── user/          # Dashboard
│   │   ├── models/            # TypeScript interfaces
│   │   └── services/          # Cart, Products, etc
│   ├── environments/          # Environment config
│   └── styles/
│
├── SETUP_GUIDE.md             # Backend setup guide
├── RUN_PROJECT.md             # This file
└── package.json
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `MongoError: connect ECONNREFUSED`

**Solution**:
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env with your Atlas connection string
```

**Error**: `Address already in use :::3000`

**Solution**:
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -i :3000  # macOS/Linux
taskkill /PID <pid> /F  # Windows
```

### Frontend Won't Connect to Backend

**Error**: `CORS error` or `Cannot POST /api/auth/login`

**Solution**:
1. Check backend is running: http://localhost:3000/api/health
2. Verify `CORS_ORIGIN` in `.env` matches frontend URL
3. Check `marketPlaceUrl` in `environment.ts` matches backend

### MongoDB Connection Issues

**Error**: `connection refused`

**Solution**:
- Local MongoDB:
  ```bash
  # macOS
  brew services start mongodb-community
  
  # Windows (run as admin)
  net start MongoDB
  
  # Linux
  sudo systemctl start mongod
  ```

- MongoDB Atlas:
  ```bash
  # Update .env
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketplace
  ```

---

## 🎨 Available Routes

### Frontend Routes

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | Home | No |
| `/login` | Login | No (PublicGuard) |
| `/register` | Register | No (PublicGuard) |
| `/products` | Product Listing | No |
| `/checkout` | Checkout | Yes (AuthGuard) |
| `/order-confirmation` | Order Confirmation | Yes |
| `/dashboard` | User Dashboard | Yes (AuthGuard) |
| `/order-history` | Order History | Yes (AuthGuard) |

### Backend Routes

**Auth Endpoints**:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Payment Endpoints**:
- `POST /api/payments/create-intent`
- `POST /api/payments/process`
- `GET /api/payments/methods`
- `POST /api/payments/methods`
- `DELETE /api/payments/methods/:id`
- `GET /api/payments/orders`
- `GET /api/payments/orders/:id`

---

## 🔐 Security Notes

### Local Development

⚠️ Current setup uses **demo/test credentials**. For production:

1. **JWT Secrets**
   ```bash
   # Generate strong secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Database**
   - Use MongoDB Atlas with strong password
   - Enable IP whitelist

3. **Payment Keys**
   - Get real Stripe/PayPal keys
   - Store in environment variables ONLY
   - Never commit `.env` to git

4. **HTTPS**
   - Required for production
   - Use Let's Encrypt for free SSL

---

## 📊 Monitoring

### Backend Logs

```bash
# Watch logs in real-time
npm run dev

# Expected logs:
# ✅ MongoDB connected
# 🚀 Backend running at http://localhost:3000
```

### Frontend Console

```bash
# Check browser console (F12)
# Look for network requests in DevTools > Network tab
# All requests to http://localhost:3000/api should show
```

---

## ✅ Verification Checklist

- [ ] Backend running at `http://localhost:3000`
- [ ] Frontend running at `http://localhost:4200`
- [ ] MongoDB connected
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can browse products
- [ ] Can add items to cart
- [ ] Can complete checkout
- [ ] See order confirmation
- [ ] Can access dashboard

---

## 🚀 Next Steps

### Development

1. **Add real Stripe/PayPal keys** to `.env`
2. **Connect to MongoDB Atlas** for cloud database
3. **Deploy backend** to Heroku/AWS/GCP
4. **Deploy frontend** to Netlify/Vercel
5. **Setup CI/CD** with GitHub Actions

### Features to Add

- [ ] Email notifications
- [ ] Product filtering & search
- [ ] Wishlist functionality
- [ ] Product reviews & ratings
- [ ] Admin dashboard
- [ ] Vendor management
- [ ] Real-time notifications
- [ ] Social media integration

---

## 💡 Tips

- **Hot Reload**: Frontend auto-refreshes on file changes
- **MongoDB Shell**: Use `mongosh` to inspect database
- **API Testing**: Use Postman or Insomnia for API testing
- **Git Commits**: Remember to commit your changes!

---

**🎉 Ready to build an amazing marketplace!**

Need help? Check:
- `SETUP_GUIDE.md` - Detailed configuration guide
- `backend/README.md` - Backend API documentation
- Browser DevTools for debugging
- Terminal logs for errors

