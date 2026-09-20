# PayPal Integration Guide - Frontend

## 🎯 Objetivo
Integrar PayPal como método de pago en Angular Marketplace usando la nueva API backend mejorada.

---

## 📋 Requisitos Previos

1. Backend ejecutándose con las nuevas mejoras (v1.1.0+)
2. Credenciales PayPal real en `.env` del backend
3. Angular 21+
4. RxJS 7+

---

## 🔧 Instalación

### 1. Instalar el Servicio de Pago

El archivo `services/payment.service.ts` ya está incluido. Importarlo en tu módulo:

```typescript
// app.module.ts
import { PaymentService } from './services/payment.service';

@NgModule({
  providers: [PaymentService],
})
export class AppModule {}
```

### 2. Configurar Environment

Actualizar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## 🎨 Implementar Componente de Checkout

### Opción 1: Usar Componente de Ejemplo

El archivo `features/checkout/payment.component.example.ts` contiene un componente completo.

1. Copiar a `features/checkout/payment.component.ts`
2. Crear `payment.component.html` (usar HTML incluido en comentarios)
3. Crear `payment.component.css` con estilos

### Opción 2: Implementar Manualmente

```typescript
import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-checkout',
  template: `
    <button (click)="payWithPayPal()">Pagar con PayPal</button>
  `,
})
export class CheckoutComponent implements OnInit {
  constructor(private paymentService: PaymentService) {}

  payWithPayPal(): void {
    // Crear payment intent en PayPal
    this.paymentService
      .createPaymentIntent(99.99, 'ORD-123', 'paypal')
      .subscribe((response) => {
        if (response.approvalUrl) {
          // Redirigir a PayPal para autorizar
          window.location.href = response.approvalUrl;
        }
      });
  }
}
```

---

## 🔄 Flujo de Pago PayPal

### Paso 1: Usuario Inicia Pago
```
Usuario hace click en "Pagar con PayPal"
↓
Frontend llama: POST /api/payments/create-intent
{
  "amount": 99.99,
  "orderId": "ORD-123",
  "provider": "paypal"
}
```

### Paso 2: Backend Crea Pago
```
Backend → PayPal API: Crear payment
PayPal → Backend: Devolver approvalUrl
Backend → Frontend: Devolver {
  "id": "PAYID-123abc",
  "approvalUrl": "https://sandbox.paypal.com/..."
}
```

### Paso 3: Usuario Autoriza en PayPal
```
Frontend redirige a: response.approvalUrl
↓
Usuario inicia sesión en PayPal (si no lo está)
↓
Usuario revisa y aprueba el pago
↓
PayPal redirige de vuelta a: http://localhost:4200/checkout/success?payerId=PAYERID123
```

### Paso 4: Procesar Pago Aprobado
```typescript
// En componente de success
ngOnInit(): void {
  const payerId = this.route.snapshot.queryParams['payerId'];
  const transaction = JSON.parse(sessionStorage.getItem('paypalTransaction')!);
  
  this.paymentService.processPayment({
    paymentIntentId: transaction.paymentId,
    payerId: payerId,
    provider: 'paypal',
    shippingAddress: {...},
    items: [...],
    subtotal: 99.99,
    shipping: 10,
    tax: 8.99
  }).subscribe(response => {
    // Mostrar confirmación
  });
}
```

### Paso 5: Confirmación
```
Backend ejecuta pago en PayPal
↓
PayPal confirma
↓
Backend crea Orden en BD
↓
Frontend muestra: "¡Pago completado!"
```

---

## 📱 Componentes Necesarios

### 1. Componente de Checkout
**Ruta**: `src/app/features/checkout/checkout.component.ts`

Responsabilidades:
- Mostrar carrito
- Formulario de dirección de envío
- Selector de método de pago
- Botón para procesar pago

### 2. Componente de Éxito
**Ruta**: `src/app/features/checkout/success.component.ts`

Responsabilidades:
- Procesar payerId desde URL
- Llamar a `/api/payments/process`
- Mostrar confirmación de pago

### 3. Componente de Cancelación (opcional)
**Ruta**: `src/app/features/checkout/cancel.component.ts`

Responsabilidades:
- Mostrar mensaje de cancelación
- Permitir volver al carrito

---

## 🛡️ Manejo de Errores

### Validación en Frontend
```typescript
if (!this.isAddressValid()) {
  this.errorMessage = 'Por favor completa la dirección';
  return;
}
```

### Capturar Errores del Backend
```typescript
this.paymentService.createPaymentIntent(...)
  .subscribe(
    (response) => { /* éxito */ },
    (error) => {
      if (error.status === 429) {
        this.errorMessage = 'Demasiados intentos. Intenta más tarde.';
      } else if (error.status === 400) {
        this.errorMessage = error.error.details?.join(', ');
      } else {
        this.errorMessage = 'Error al procesar pago';
      }
    }
  );
```

### Manejar Cancelación en PayPal
```typescript
// Si usuario cancela en PayPal, es redirigido a:
// http://localhost:4200/checkout/cancel

// En cancel.component.ts:
ngOnInit(): void {
  sessionStorage.removeItem('paypalTransaction');
  // Mostrar opción de volver al carrito
}
```

---

## 💳 Integración Stripe (Alternativa)

Para aceptar tarjetas de crédito, usar Stripe:

```typescript
// 1. Instalar Stripe SDK
npm install @stripe/stripe-js

// 2. Importar y usar
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(environment.stripePublicKey);

// 3. Crear payment intent
this.paymentService.createPaymentIntent(99.99, 'ORD-123', 'stripe')
  .subscribe(async (response) => {
    const result = await stripe.confirmCardPayment(response.clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });
  });
```

---

## 🧪 Testing

### Test PayPal en Sandbox

**Cuentas de prueba**: https://developer.paypal.com/dashboard/accounts

**Cuenta vendedor (Business)**:
- Email: sb-seller@example.com
- Password: 123456

**Cuenta comprador (Personal)**:
- Email: sb-buyer@example.com
- Password: 123456

### Simular Pago

1. Ir a http://localhost:4200/checkout
2. Llenar formulario
3. Seleccionar PayPal
4. Click "Procesar Pago"
5. Redirigir a PayPal sandbox
6. Iniciar sesión con cuenta de prueba
7. Revisar y aprobar pago
8. Ser redirigido a success page

### Verificar en Backend

```bash
# Ver órdenes creadas
curl http://localhost:3000/api/payments/orders \
  -H "Authorization: Bearer <token>"

# Ver detalles de orden
curl http://localhost:3000/api/payments/orders/<orderId> \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 Seguridad

### ✅ Implementado
- Validación de datos en backend
- Rate limiting en endpoints de pago
- JWT authentication requerido
- Verificación de pago con PayPal
- Protección CORS

### ⚠️ Todavía Necesario
- HTTPS en producción
- Webhook validation de PayPal
- Logging auditado
- Monitoreo de fraude

---

## 📚 Recursos

- **PayPal Developer**: https://developer.paypal.com
- **PayPal REST API Docs**: https://developer.paypal.com/docs/api/overview/
- **Stripe Documentation**: https://stripe.com/docs
- **Angular HttpClient**: https://angular.io/guide/http

---

## 🐛 Troubleshooting

### "approvalUrl es undefined"
- Verificar credenciales PayPal en .env
- Verificar PAYPAL_MODE=sandbox
- Revisar logs del backend

### "Demasiados intentos"
- Rate limiting está activo (máximo 10 por 5 minutos)
- Esperar 5 minutos o resetear después

### "Email invalid"
- Validación Joi rechaza emails inválidos
- Usar formato: user@example.com

### "Token expirará en 1 hora"
- Usar endpoint `/api/auth/refresh` antes de expirar
- Implementar refresh automático en interceptor

---

## 📝 Checklist de Implementación

- [ ] Backend instalado con nuevas dependencias
- [ ] .env actualizado con credenciales reales
- [ ] PaymentService importado en módulo
- [ ] Componente de checkout implementado
- [ ] Componente de success implementado
- [ ] Rutas configuradas (/checkout, /checkout/success)
- [ ] Servicios de carrito disponibles
- [ ] Estilos CSS implementados
- [ ] Testing manual completado
- [ ] Manejo de errores implementado
- [ ] Documentación actualizada

---

**Última actualización**: 2026-09-18  
**Version**: 1.1.0
