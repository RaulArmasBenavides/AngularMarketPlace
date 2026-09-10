# 🚀 Marketplace Backend API

Node.js + Express + MongoDB backend for the Angular Marketplace application.

## 📋 Features

- ✅ JWT Authentication (Login, Register, Refresh)
- ✅ User Management
- ✅ Payment Processing (Stripe & PayPal ready)
- ✅ Order Management
- ✅ Address Management
- ✅ Payment Methods Storage
- ✅ Error Handling & Validation
- ✅ CORS Support

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Security**: bcryptjs
- **Payments**: Stripe SDK (ready for integration)

## 📦 Installation

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**
   ```bash
   npm start      # Production
   npm run dev    # Development
   ```

Server will run at `http://localhost:3000`

## 🔑 Environment Variables

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_xxx
PAYPAL_CLIENT_ID=xxx
CORS_ORIGIN=http://localhost:4200
```

## 📚 API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout (frontend-side)
GET    /api/auth/me                - Get current user
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
```

### Payments

```
POST   /api/payments/create-intent - Create payment intent
POST   /api/payments/process       - Process payment
GET    /api/payments/methods       - Get saved payment methods
POST   /api/payments/methods       - Save payment method
DELETE /api/payments/methods/:id   - Delete payment method
GET    /api/payments/orders        - Get user's orders
GET    /api/payments/orders/:id    - Get order details
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

The token is obtained from the login endpoint and should be renewed using the refresh endpoint before expiry.

## 📊 Database Models

### User
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  avatar: String,
  isVerified: Boolean,
  role: 'customer' | 'vendor' | 'admin',
  addresses: [Address],
  paymentMethods: [PaymentMethod],
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  userId: ObjectId (ref: User),
  orderNumber: String (unique),
  items: [OrderItem],
  subtotal: Number,
  shipping: Number,
  tax: Number,
  totalAmount: Number,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  paymentStatus: 'pending' | 'completed' | 'failed',
  paymentMethod: {provider, type, last4},
  paymentId: String,
  shippingAddress: Address,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing Endpoints

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Protected Endpoint (with token)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment

### To Heroku
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

### To AWS/GCP
Follow standard Node.js deployment guides with:
- Set environment variables
- Configure MongoDB connection
- Enable CORS for frontend domain

## 📝 Project Structure

```
backend/
├── models/          # MongoDB schemas (User, Order)
├── routes/          # API endpoints (auth, payments)
├── middleware/      # Auth, error handling
├── server.js        # Main server file
├── .env             # Environment variables
└── package.json     # Dependencies
```

## 🐛 Error Handling

All errors return JSON format:
```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🔗 Integration with Frontend

The Angular frontend connects to this API at the `CORS_ORIGIN` URL.

Frontend → Backend flow:
1. Frontend calls `/api/auth/login`
2. Backend returns JWT tokens
3. Frontend stores tokens in localStorage
4. Frontend sends Authorization header with token for all requests
5. Backend validates token via middleware

## 📞 Support

For issues or questions, check:
- MongoDB connection string
- JWT secrets configuration
- CORS origin setting
- API endpoint paths

---

**Ready to integrate with the Angular frontend!** 🎉
