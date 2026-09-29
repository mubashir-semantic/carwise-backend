# CarWise Backend

REST API for CarWise, a vehicle management platform for authentication, user profiles, vehicles, service history, and expense tracking.

Built with NestJS, TypeScript, MongoDB, and Mongoose. The API includes JWT authentication, OTP-based email verification and password recovery, request validation, centralized error handling, and Swagger documentation.

## Features

- User signup, login, email OTP verification, and OTP resend
- Forgot-password, reset-password, change-password, refresh-token, and logout flows
- JWT-protected user profile read and update endpoints
- Vehicle creation and vehicle listing
- Service history and expense history management
- MongoDB persistence through Mongoose schemas
- Global validation with `class-validator` and `class-transformer`
- Swagger UI for interactive API exploration

## Tech Stack

- Node.js and TypeScript
- NestJS 10
- MongoDB and Mongoose
- Passport JWT and bcrypt
- Nodemailer for OTP emails
- Jest and Supertest for testing

## Getting Started

### Prerequisites

- Node.js 20 or newer recommended
- npm
- A running MongoDB instance or MongoDB Atlas database
- SMTP credentials for email-based OTP flows

### Installation

```bash
cd carwise-backend
npm install
```

Create a `.env` file in this directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carwise
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=15m
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password-or-app-password
```

Do not commit `.env` or real credentials to source control. For Gmail, use an app password when required by the account security settings.

### Run Locally

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API runs on `http://localhost:5000` by default.

## API Documentation

All versioned endpoints use the following base URL:

```text
http://localhost:5000/api/v1
```

Swagger UI is available at [http://localhost:5000/api/docs](http://localhost:5000/api/docs) while the server is running.

### Endpoint Overview

| Area | Method | Endpoint | Auth |
| --- | --- | --- | --- |
| Health | `GET` | `/health` | Public |
| Authentication | `POST` | `/auth/signup` | Public |
| Authentication | `POST` | `/auth/login` | Public |
| Authentication | `POST` | `/auth/verify-otp` | Public |
| Authentication | `POST` | `/auth/resend-otp` | Public |
| Authentication | `POST` | `/auth/forgot-password` | Public |
| Authentication | `POST` | `/auth/reset-password` | Public |
| Authentication | `POST` | `/auth/change-password` | Bearer token |
| Authentication | `POST` | `/auth/refresh-token` | Refresh token |
| Authentication | `POST` | `/auth/logout` | Bearer token |
| Profile | `GET` | `/users/profile` | Bearer token |
| Profile | `PUT` | `/users/profile` | Bearer token |
| Vehicles | `POST` | `/vehicles` | Public* |
| Vehicles | `GET` | `/vehicles` | Public* |
| Service history | `POST` | `/service-history` | Public* |
| Service history | `GET` | `/service-history` | Public* |
| Expense history | `POST` | `/expense-history` | Public* |
| Expense history | `GET` | `/expense-history` | Public* |

`*` Vehicle, service-history, and expense-history controllers are currently not guarded by JWT in the implementation. Review authorization and user ownership before production deployment.

## Useful Scripts

```bash
npm run lint       # Lint source and test files
npm run format     # Format TypeScript files
npm test           # Run unit tests
npm run test:cov   # Run tests with coverage
npm run test:e2e   # Run end-to-end tests
```

## Project Structure

```text
src/
├── auth/             # Authentication, JWT, OTP, and email services
├── users/            # Protected user profile APIs
├── vehicles/         # Vehicle APIs and schemas
├── service-history/  # Service record APIs and schemas
├── expense-history/  # Expense record APIs and schemas
├── health/           # Health check endpoint
├── common/           # Shared middleware and utilities
├── app.module.ts     # Root module and database configuration
└── main.ts           # Application bootstrap and global API configuration
```

## Security Notes

- Passwords are hashed with bcrypt before persistence.
- Access and refresh tokens should be kept secret and rotated appropriately.
- Use HTTPS, a strong `JWT_SECRET`, restricted CORS, and a production-grade SMTP provider in deployed environments.
- Protect vehicle and history resources with authenticated user ownership before exposing the API publicly.

## Related Project

The Next.js client is in [`../carwise-frontend`](../carwise-frontend).
