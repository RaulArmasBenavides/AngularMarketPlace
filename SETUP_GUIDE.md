# 🔐 Autenticación y Pagos - Guía de Configuración

Esta guía te muestra cómo configurar la autenticación real y los pagos (Stripe/PayPal) en tu marketplace.

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Configuración de Autenticación](#configuración-de-autenticación)
3. [Configuración de Pagos](#configuración-de-pagos)
4. [Rutas y Componentes](#rutas-y-componentes)
5. [Variables de Entorno](#variables-de-entorno)
6. [Testing](#testing)

---

## Requisitos

- Node.js 16+
- Angular 21+
- Backend API (Node.js, Python, etc.)
- Stripe o PayPal account

---

## Configuración de Autenticación

### 1. Backend API Endpoints Requeridos

Tu backend debe implementar estos endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### 2. Backend Response Format (Login/Register)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatar": "https://...",
    "isVerified": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### 3. Usar AuthService en Componentes

```typescript
import { AuthService } from 'src/app/core/services/auth.service';

export class MyComponent {
  constructor(private authService: AuthService) {}

  login(): void {
    this.authService.login({ email, password }).subscribe(response => {
      console.log('Login successful!', response);
      // Redirigir a dashboard
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      // Redirigir a login
    });
  }

  getCurrentUser(): void {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
  }

  isAuthed(): boolean {
    return this.authService.isAuthenticated();
  }
}
```

### 4. Observables Disponibles

```typescript
// Escuchar cambios de usuario
this.authService.currentUser$.subscribe(user => {
  console.log('User changed:', user);
});

// Escuchar cambios de autenticación
this.authService.isAuthenticated$.subscribe(isAuth => {
  console.log('Auth status:', isAuth);
});
```

---

## Configuración de Pagos

### Opción 1: Stripe

#### 1.1 Obtener Claves de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Copia tu **Public Key** (empieza con `pk_`)
3. Copia tu **Secret Key** (empieza con `sk_`) - para backend

#### 1.2 Configurar en Frontend

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  marketPlaceUrl: 'http://localhost:3000/api',
  
  // CAMBIAR A 'stripe'
  paymentProvider: 'stripe',
  
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_KEY_HERE', // ← Reemplaza con tu key
  },

  paypal: {
    clientId: '',
    currency: 'USD',
  },
};
```

#### 1.3 Backend Stripe Endpoints

```
POST   /api/payments/create-intent
POST   /api/payments/process
GET    /api/payments/methods
POST   /api/payments/methods
DELETE /api/payments/methods/:id
```

**Ejemplo Response - create-intent:**
```json
{
  "id": "pi_123456",
  "clientSecret": "pi_123456_secret_abc123",
  "amount": 152000,
  "currency": "USD",
  "status": "requires_payment_method"
}
```

#### 1.4 Backend usando Node.js + Express + Stripe

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/payments/create-intent', async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centavos
      currency: 'usd',
      metadata: { orderId },
    });

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: 'USD',
      status: paymentIntent.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/payments/process', async (req, res) => {
  const { paymentIntentId, provider } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Crear orden en BD
      const order = await Order.create({
        userId: req.user.id,
        paymentId: paymentIntentId,
        status: 'completed',
        // ...
      });

      res.json({ success: true, message: 'Payment processed', order });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

### Opción 2: PayPal

#### 2.1 Obtener Credenciales PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com)
2. Crea una aplicación
3. Copia el **Client ID**
4. Copia el **Secret**

#### 2.2 Configurar en Frontend

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  marketPlaceUrl: 'http://localhost:3000/api',
  
  // CAMBIAR A 'paypal'
  paymentProvider: 'paypal',
  
  stripe: {
    publishableKey: '',
  },

  paypal: {
    clientId: 'YOUR_PAYPAL_CLIENT_ID_HERE', // ← Reemplaza
    currency: 'USD',
  },
};
```

#### 2.3 Backend PayPal Endpoints

```
POST   /api/payments/create-intent
POST   /api/payments/process
```

#### 2.4 Backend usando Node.js + Express + PayPal

```javascript
const paypal = require('paypal-rest-sdk');

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

app.post('/api/payments/create-intent', (req, res) => {
  const { amount, orderId } = req.body;

  // Con PayPal, se crea directamente en el cliente
  // Este endpoint puede ser para pre-validar
  res.json({
    id: `paypal-${orderId}`,
    clientSecret: `secret-${orderId}`,
    amount,
    currency: 'USD',
    status: 'requires_payment_method',
  });
});

app.post('/api/payments/process', (req, res) => {
  const { paypalDetails } = req.body;

  // Validar el pago con PayPal
  paypal.sale.find(paypalDetails.id, (error, sale) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (sale.state === 'approved') {
      // Crear orden
      Order.create({
        userId: req.user.id,
        paymentId: paypalDetails.id,
        status: 'completed',
      });

      res.json({ success: true, message: 'Payment processed' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not approved' });
    }
  });
});
```

---

## Rutas y Componentes

### Rutas Disponibles

Actualiza `app-routing.module.ts`:

```typescript
const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent, canActivate: [PublicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [PublicGuard] },

  // Protected routes
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'products',
    component: ProductsComponent,
  },

  // Fallback
  { path: '**', redirectTo: '/products' },
];
```

### Componentes

#### LoginComponent
- **Path**: `src/app/features/auth/login/`
- **Uso**: Formulario de login
- **Input**: email, password

#### RegisterComponent
- **Path**: `src/app/features/auth/register/`
- **Uso**: Formulario de registro
- **Input**: firstName, lastName, email, password

#### CheckoutComponent
- **Path**: `src/app/features/checkout/`
- **Uso**: Checkout con Stripe/PayPal
- **Requiere**: AuthGuard
- **Cambia automáticamente** según `paymentProvider` en environment

---

## Variables de Entorno

### Development (.env)

```bash
# Backend
BACKEND_URL=http://localhost:3000/api

# Stripe (opcional)
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY

# PayPal (opcional)
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
```

### Production (.env.prod)

```bash
# Backend
BACKEND_URL=https://api.marketplace.com

# Stripe
STRIPE_PUBLIC_KEY=pk_live_YOUR_KEY
PAYMENT_PROVIDER=stripe

# PayPal
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
PAYMENT_PROVIDER=paypal
```

### En Angular (environment.ts)

```typescript
export const environment = {
  // ...
  paymentProvider: process.env['PAYMENT_PROVIDER'] || 'stripe',
  stripe: {
    publishableKey: process.env['STRIPE_PUBLIC_KEY'] || 'pk_test_...',
  },
  paypal: {
    clientId: process.env['PAYPAL_CLIENT_ID'] || 'YOUR_CLIENT_ID',
    currency: 'USD',
  },
};
```

---

## Testing

### 1. Test Login

```bash
# Ir a http://localhost:4200/login
# Ingresar:
# Email: test@example.com
# Password: password123

# Si backend está corriendo correctamente, debe redirigir a /products
```

### 2. Test Checkout con Stripe

```bash
# Ir a http://localhost:4200/checkout
# Llenar dirección de envío
# Usar tarjeta de prueba:
# Número: 4242 4242 4242 4242
# Fecha: 12/25
# CVC: 123
```

### 3. Test Checkout con PayPal

```bash
# Usar cuenta sandbox de PayPal
# Ir a http://localhost:4200/checkout
# Click en PayPal button
# Login con sandbox account
```

---

## 🔄 Flujo Completo

```
1. Usuario accede a /login
   ↓
2. Ingresa credenciales
   ↓
3. AuthService.login() → Backend /auth/login
   ↓
4. Backend valida y devuelve tokens
   ↓
5. Tokens se guardan en localStorage
   ↓
6. Usuario redirigido a /products
   ↓
7. Usuario añade items al carrito
   ↓
8. Usuario va a /checkout (AuthGuard verifica)
   ↓
9. Llena formulario de envío
   ↓
10. Selecciona método de pago (Stripe o PayPal)
    ↓
11. PaymentFactory inyecta el provider correcto
    ↓
12. Procesa el pago
    ↓
13. Backend valida y crea orden
    ↓
14. Usuario ve confirmación
```

---

## 📦 Servicios Disponibles

### AuthService

```typescript
login(request: LoginRequest): Observable<AuthResponse>
register(request: RegisterRequest): Observable<AuthResponse>
logout(): Observable<{ success: boolean }>
refreshAccessToken(): Observable<AuthResponse>
verifyEmail(token: string): Observable<{ success: boolean }>
requestPasswordReset(email: string): Observable<...>
resetPassword(token: string, newPassword: string): Observable<...>
socialLogin(provider: string, token: string): Observable<AuthResponse>

// Getters
getCurrentUser(): User | null
isAuthenticated(): boolean
getAccessToken(): string | null
isTokenExpired(): boolean
```

### PaymentFactoryService

```typescript
getPaymentProvider(): IPaymentProvider
getProviderName(): string
initialize(): Promise<void>
```

### IPaymentProvider (Interface)

```typescript
initialize(): Promise<void>
createPaymentIntent(amount: number, orderId: string): Observable<PaymentIntent>
processPayment(paymentIntentId: string, paymentDetails: any): Observable<...>
getSavedPaymentMethods(): Observable<PaymentMethod[]>
savePaymentMethod(paymentDetails: any): Observable<PaymentMethod>
deletePaymentMethod(paymentMethodId: string): Observable<...>
getProviderName(): string
```

---

## ⚠️ Seguridad

### Mejores Prácticas

1. **Tokens**: Nunca exponga `sk_` keys en frontend
2. **HTTPS**: Siempre usa HTTPS en producción
3. **CORS**: Configura CORS correctamente en backend
4. **CSP**: Implementa Content Security Policy
5. **Validación**: Valida en backend, no solo frontend

### LocalStorage vs Cookies

- Tokens se guardan en `localStorage`
- En producción considera usar `httpOnly` cookies
- Implementa refresh token rotation

---

## 🚀 Próximos Pasos

1. Crea tu backend (Node.js, Python, etc.)
2. Implementa los endpoints de autenticación
3. Crea cuenta Stripe/PayPal
4. Configura environment.ts
5. Prueba en desarrollo
6. Deploy a producción

---

## 📚 Recursos

- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer](https://developer.paypal.com)
- [Angular Auth Best Practices](https://angular.io/guide/security)
- [JWT Tokens](https://jwt.io)

---

**¿Preguntas? Revisa los archivos de servicios en `src/app/core/services/`**
