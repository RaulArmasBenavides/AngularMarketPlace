# 🎯 Mock Data Service Guide

## Overview

El proyecto ahora tiene un **servicio de datos mock** que devuelve JSON desde la carpeta `assets/data/`. Esto te permite **trabajar sin backend** mientras desarrollas, y cambiar fácilmente al backend real cuando esté listo.

---

## 📁 Estructura de Mock Data

```
src/assets/data/
├── products.json        ← Datos de productos
├── categories.json      ← Datos de categorías
└── subcategories.json   ← Datos de subcategorías
```

---

## 🔄 Cómo Funciona

### Sin Backend (Desarrollo):
```
1. ProductsService → Backend HTTP request FALLA
2. Automáticamente → Fallback a MockDataService
3. MockDataService → Lee products.json desde assets
4. ✅ App funciona perfectamente
```

### Con Backend (Producción):
```
1. ProductsService → Backend HTTP request EXITOSA
2. ✅ Devuelve datos del backend
3. MockDataService → No se usa
```

**¡No necesitas cambiar código! Automático fallback.**

---

## 📋 Servicios Actualizados

### ProductsService
```typescript
// Automáticamente intenta backend primero
getData(): Observable<Product[]> {
  return this.http.get(...).pipe(
    catchError(error => {
      console.warn('Usando mock data:', error.message);
      return this.mockDataService.getProducts();
    })
  );
}
```

### CategoriesService
```typescript
// Mismo patrón automático
getData(): Observable<Category[]> {
  return this.http.get(...).pipe(
    catchError(error => {
      console.warn('Usando mock data:', error.message);
      return this.mockDataService.getCategories();
    })
  );
}
```

### SubCategoriesService
```typescript
// Filtrado automático con mock data
getFilterData(orderBy, equalTo): Observable<SubCategory[]> {
  return this.http.get(...).pipe(
    catchError(error => {
      return this.mockDataService.getFilteredSubCategories(orderBy, equalTo);
    })
  );
}
```

---

## 📊 Datos Disponibles

### Products (products.json)
```json
[
  {
    "id": 1,
    "name": "Laptop Dell XPS 13",
    "title": "Premium Laptop for Developers",
    "price": 1299,
    "category": "Electronics",
    "image": "https://via.placeholder.com/300x300?text=Laptop",
    "description": "Ultra-portable laptop with 13-inch display"
  },
  ...
]
```

**Incluye:** 8 productos de ejemplo (Laptops, Mice, Keyboards, Monitors, etc.)

### Categories (categories.json)
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "parentId": null,
    "title_list": "[\"Computers\", \"Accessories\", \"Audio\"]"
  },
  ...
]
```

**Incluye:** 5 categorías (Electronics, Office, Software, Books, Services)

### SubCategories (subcategories.json)
```json
[
  {
    "id": 1,
    "name": "Laptops",
    "categoryId": 1,
    "title_list": "Computers",
    "url": "/products?category=computers&sub=laptops"
  },
  ...
]
```

**Incluye:** 16 subcategorías organizadas por categoría

---

## 🎨 Personalizar Mock Data

### Editar Productos
```bash
# Abre y edita:
src/assets/data/products.json
```

Ejemplo - Agregar nuevo producto:
```json
{
  "id": 9,
  "name": "Nuevo Producto",
  "price": 99,
  "category": "Mi Categoría",
  "image": "https://...",
  "description": "Descripción aquí"
}
```

### Editar Categorías
```bash
# Abre y edita:
src/assets/data/categories.json
```

### Editar Subcategorías
```bash
# Abre y edita:
src/assets/data/subcategories.json
```

**Sin necesidad de reiniciar - los cambios se aplican automáticamente.**

---

## 🚀 Pasar al Backend Real

Cuando tu backend esté listo, **solamente necesitas cambiar la URL base**:

### 1. Actualiza `environment.ts`:
```typescript
// ANTES (Mock Data):
export const environment = {
  marketPlaceUrl: 'https://placeholder.firebaseio.com/'
};

// DESPUÉS (Backend Real):
export const environment = {
  marketPlaceUrl: 'https://tu-servidor.com/api/'
};
```

### 2. El backend automáticamente:
- Devuelve datos en lugar del error
- Saltea el fallback a mock data
- ¡Listo! Sin cambios en el código de servicios

---

## 🔍 MockDataService API

```typescript
// Obtener todos los productos
mockDataService.getProducts(): Observable<Product[]>

// Obtener todas las categorías
mockDataService.getCategories(): Observable<Category[]>

// Obtener todas las subcategorías
mockDataService.getSubCategories(): Observable<SubCategory[]>

// Filtrar subcategorías (simula Firebase query)
mockDataService.getFilteredSubCategories(key, value): Observable<SubCategory[]>
```

---

## 🔧 Debugging

### Ver en Console:
```
// Cuando fallback a mock data, verás:
⚠️ "Backend unavailable, using mock data: Http failure response..."
```

### Simular Error de Backend:
Si quieres testear el fallback, cambia la URL temporalmente:
```typescript
// En environment.ts:
marketPlaceUrl: 'https://wrong-url.com/'
// → Automáticamente usa mock data
```

---

## 📌 Checklist de Desarrollo

- [x] Mock data service creado
- [x] JSON files con datos de ejemplo
- [x] ProductsService con fallback
- [x] CategoriesService con fallback
- [x] SubCategoriesService con fallback
- [x] Auto-switching backend ↔ mock

**Listo para:** Desarrollo sin backend ✅

---

## 🎯 Ventajas

✅ **Desarrollo sin backend**  
✅ **Cambio automático (no hay if/else en componentes)**  
✅ **Fácil de personalizar**  
✅ **Testing sin dependencias HTTP reales**  
✅ **Mismo código para backend y mock**  

---

## 📝 Ejemplo Real

```typescript
// En tu componente - EXACTAMENTE IGUAL para mock o backend:
export class ProductsComponent implements OnInit {
  ngOnInit() {
    this.productsService.getData().subscribe(
      products => {
        this.products = products; // Funciona con mock o backend
      }
    );
  }
}
```

**No necesitas saber si estás usando mock o backend - ¡funciona igual!**

---

## 🆘 Troubleshooting

### Los datos no se cargan
1. Verifica que los archivos JSON existan en `src/assets/data/`
2. Revisa la consola de errores
3. Verifica que `MockDataService` esté inyectado

### Cambios en JSON no se ven
1. Recarga el navegador (Ctrl+F5 / Cmd+Shift+R)
2. Limpia caché: Abre DevTools → Network → Disable cache

### Backend no funciona
- Verifica la URL en `environment.ts`
- Verifica que el servidor esté corriendo
- Revisa CORS settings si es cross-origin

---

## 📌 Resumen

```
1. ✅ Desarrollo: Mock data desde assets/data/*.json
2. ✅ Fallback automático: Si backend falla → usa mock
3. ✅ Cambiar al backend: Solo cambiar URL en environment.ts
4. ✅ Código igual: Componentes no saben si es mock o backend
```

**¡Listo para desarrollar sin backend! 🚀**
