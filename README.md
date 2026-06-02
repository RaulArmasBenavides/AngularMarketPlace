# Angular MarketPlace

A modern Angular 21 e-commerce application built with Angular CLI and Material Design.

## Project Overview

**Angular MarketPlace** is a feature-rich marketplace frontend application built with Angular 21, providing a responsive and interactive user experience for buying and selling products.

- **Framework**: Angular 21.1.3
- **Language**: TypeScript 5.9
- **UI Components**: Swiper, RxJS for reactive programming
- **Package Manager**: NPM

## Prerequisites

- Node.js 12.22.12 or higher
- NPM 6.0 or higher
- Angular CLI 21.1.3

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd AngularMarketPlace

# Install dependencies
npm install

# Use the correct Node version
nvm use 12.22.12
```

## Development Server

Run the development server with:

```bash
npm start
```

The application will automatically open in your default browser at `http://localhost:4200/`. The app will automatically reload when you modify source files.

## Build

Build the project for production:

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## Code Generation

Generate Angular components, services, directives, and more using Angular CLI:

```bash
# Generate a component
ng generate component component-name

# Generate a service
ng generate service service-name

# Generate other elements
ng generate directive|pipe|class|guard|interface|enum|module
```

## Testing

### Unit Tests

Run unit tests via Karma:

```bash
npm test
```

### End-to-End Tests

Run E2E tests via Protractor:

```bash
npm run e2e
```

## Bundle Analysis

Analyze your bundle size:

```bash
npm run analyze
```

This generates a visual representation of your bundle composition using source-map-explorer.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run lint` - Run linting checks
- `npm run e2e` - Run end-to-end tests
- `npm run analyze` - Analyze bundle size

## Technologies Used

- **Angular** - 21.1.3
- **RxJS** - Reactive programming library
- **Swiper** - Modern touch slider
- **TypeScript** - Type-safe JavaScript
- **Karma & Jasmine** - Testing frameworks
- **Prettier** - Code formatter

## Project Structure

```
src/
├── app/
│   ├── components/
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── app.component.ts
├── assets/
├── environments/
└── styles/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For help with Angular, visit the official [Angular Documentation](https://angular.io/docs) or check the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

---

Preview Demo  
![image](https://github.com/user-attachments/assets/29197d9c-595e-43b2-9da8-930c798cc88f)
