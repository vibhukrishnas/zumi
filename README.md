# 🐾 Zumi - Pet Services App

A subscription-based mobile application that enables pet owners to discover, browse, and book pet-related events and services with exclusive discounts.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql)
![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe)

## 📱 Features

- **🔍 Service Discovery** - Browse pet events, services, and local providers
- **💳 Subscription Plans** - Free, Basic ($9.99/mo), and Premium ($19.99/mo) tiers
- **🎟️ Random Promo Codes** - Get 10-30% discount codes on bookings
- **📅 Booking Management** - View and manage your pet service bookings
- **💬 Messaging** - Chat with service providers
- **🐕 Pet Profiles** - Manage multiple pets
- **👤 Provider Dashboard** - For service providers to manage availability

## 🛠️ Tech Stack

### Client (Mobile App)
- **React Native** with Expo SDK 54
- **React Navigation** for routing
- **React Native Paper** for UI components
- **Stripe React Native** for payments
- **Axios** for API calls
- **Expo Linear Gradient** for premium UI

### Server (Backend API)
- **Node.js** with Express 5
- **MySQL** with mysql2 driver
- **JWT** for authentication
- **Stripe** for payment processing
- **Multer** for file uploads
- **bcrypt** for password hashing

## 📁 Project Structure

```
project/
├── client/                 # React Native mobile app
│   ├── components/         # Reusable UI components
│   ├── screens/            # App screens
│   ├── services/           # API service layer
│   ├── context/            # React Context (Auth)
│   └── utils/              # Utility functions
│
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & upload middleware
│   ├── routes/             # API route definitions
│   ├── scripts/            # DB migrations & seeds
│   └── uploads/            # Uploaded files
│
└── documentation/          # PRD & design docs
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- Expo CLI (`npm install -g expo-cli`)
- Stripe account (for payments)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Pet Services App/project"
```

### 2. Setup Server
```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure your .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=pet_services
# JWT_SECRET=your_jwt_secret
# STRIPE_SECRET_KEY=sk_test_xxx

# Initialize database
node scripts/initDb.js

# Start server
node index.js
```

### 3. Setup Client
```bash
cd client

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on device/emulator
npm run android   # For Android
npm run ios       # For iOS (Mac only)
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/forgot-password` | Reset password |

### Services & Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all services |
| GET | `/api/events` | Get all events |
| GET | `/api/services/:id` | Get service details |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/initiate` | Create booking with promo |
| PUT | `/api/bookings/:id/confirm` | Confirm after payment |
| GET | `/api/bookings/user` | Get user's bookings |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-payment-intent` | Create Stripe intent |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/status` | Get subscription status |
| POST | `/api/subscriptions/subscribe` | Subscribe to plan |

## 💰 Subscription Tiers

| Tier | Price | Benefits |
|------|-------|----------|
| **Free** | $0 | Browse services, basic access |
| **Basic** | $9.99/mo | 10% discount on all bookings |
| **Premium** | $19.99/mo | 20% discount + priority support |

## 🎫 Promo Code System

When a user initiates a booking:
1. A random promo code is generated (e.g., `ZUMI20X4KM`)
2. Random discount between 10-30% is applied
3. User proceeds to Stripe payment with discounted price
4. On success, booking is confirmed

## 📸 Screenshots

*Coming soon*

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Test API endpoints
curl http://localhost:3000/api/services
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Vibe Coding Internship Team** - Mobile App Development

---

<p align="center">Made with ❤️ for pet lovers everywhere 🐾</p>
