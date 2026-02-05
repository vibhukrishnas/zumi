# Technology Stack Document
## Pet Services Subscription Mobile Application

**Version:** 1.0  
**Date:** February 4, 2026  
**Project:** Vibe Coding Internship - Mobile App Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Technology Stack](#2-core-technology-stack)
3. [Mobile Application Stack](#3-mobile-application-stack)
4. [Backend API Stack](#4-backend-api-stack)
5. [Database & Data Layer](#5-database--data-layer)
6. [External Services & Integrations](#6-external-services--integrations)
7. [Development Tools](#7-development-tools)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)
9. [DevOps & Deployment](#9-devops--deployment)
10. [Security & Authentication](#10-security--authentication)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Version Control & Package Management](#12-version-control--package-management)
13. [Alternative Considerations](#13-alternative-considerations)
14. [Learning Resources](#14-learning-resources)

---

## 1. Executive Summary

### 1.1 Stack Overview

This project uses a **modern JavaScript/TypeScript full-stack** approach with React Native for mobile development and Node.js for the backend. The stack is optimized for rapid development, maintainability, and scalability.

### 1.2 Technology Philosophy

- **JavaScript Everywhere**: Unified language across mobile and backend
- **Open Source First**: Leverage battle-tested, community-driven tools
- **Developer Experience**: Tools that enhance productivity and debugging
- **Production Ready**: Technologies used by major companies at scale

### 1.3 Stack at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  React Native 0.73+ • TypeScript • React Navigation         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  Node.js 18+ • Express.js 4.x • TypeScript                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
│  MySQL 8.0+ • Redis (optional)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technology Stack

### 2.1 Mandatory Technologies (Per Assignment)

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Mobile Framework** | React Native | 0.73+ | Cross-platform, single codebase, required |
| **Backend Runtime** | Node.js | 18 LTS+ | Non-blocking I/O, JavaScript ecosystem, required |
| **Database** | MySQL | 8.0+ | Relational model, ACID compliance, required |

### 2.2 Primary Language

| Language | Usage | Version | Why |
|----------|-------|---------|-----|
| **JavaScript** | Frontend & Backend | ES2022+ | Universal, async-friendly, huge ecosystem |
| **TypeScript** | Optional (Recommended) | 5.0+ | Type safety, better IDE support, catch errors early |

**Recommendation**: Start with JavaScript, migrate to TypeScript if comfortable.

---

## 3. Mobile Application Stack

### 3.1 Core Framework

#### React Native
```json
{
  "react-native": "^0.73.0",
  "react": "^18.2.0"
}
```

**Purpose**: Cross-platform mobile app framework  
**Why**: 
- Single codebase for iOS and Android
- Hot reload for fast development
- Native performance
- Large community and package ecosystem

**Key Features Used**:
- Component-based architecture
- Native modules access
- Platform-specific code when needed
- Hot module replacement (HMR)

**Official Docs**: https://reactnative.dev/

---

### 3.2 Navigation

#### React Navigation
```json
{
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11"
}
```

**Purpose**: Routing and navigation management  
**Why**:
- Most popular React Native navigation library
- Highly customizable
- Deep linking support
- TypeScript-friendly

**Navigation Types Used**:
- **Stack Navigator**: Screen transitions, headers
- **Bottom Tab Navigator**: Main app sections
- **Modal Stack**: Subscription gate, booking confirmation

**Example Usage**:
```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Alternatives Considered**:
- React Native Navigation (more native, steeper learning curve)
- Expo Router (file-based routing, requires Expo)

**Docs**: https://reactnavigation.org/

---

### 3.3 State Management

#### Option 1: React Context API (Recommended for this project)
```json
{
  "react": "^18.2.0"
}
```

**Purpose**: Global state management  
**Why**:
- Built into React (no extra dependency)
- Sufficient for app complexity
- Easy to understand and debug
- Good for auth state and user data

**Example Usage**:
```javascript
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (credentials) => {
    // API call
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
  };

  return (
    <AuthContext.Provider value={{ user, token, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### Option 2: Redux Toolkit (If state becomes complex)
```json
{
  "@reduxjs/toolkit": "^2.0.1",
  "react-redux": "^9.0.4"
}
```

**Purpose**: Predictable state container  
**Why**:
- Better for complex state
- Time-travel debugging
- Redux DevTools

**When to Use**: If you have >5 context providers or complex state logic

**Docs**: 
- Context API: https://react.dev/learn/passing-data-deeply-with-context
- Redux Toolkit: https://redux-toolkit.js.org/

---

### 3.4 HTTP Client

#### Axios
```json
{
  "axios": "^1.6.5"
}
```

**Purpose**: HTTP requests to backend API  
**Why**:
- Promise-based
- Request/response interceptors (for auth tokens)
- Automatic JSON transformation
- Better error handling than fetch
- Request/response transformation

**Example Setup**:
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://api.petservices.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Alternatives Considered**:
- Fetch API (built-in, but fewer features)
- React Query (adds caching layer)

**Docs**: https://axios-http.com/

---

### 3.5 UI Component Libraries

#### Option 1: React Native Paper (Recommended)
```json
{
  "react-native-paper": "^5.11.3"
}
```

**Purpose**: Material Design components  
**Why**:
- Beautiful, consistent design
- Theming support
- Accessibility built-in
- Well-documented

**Components Used**:
- Button, Card, TextInput
- Modal, Dialog
- Surface, Divider
- ProgressBar, ActivityIndicator

**Example**:
```javascript
import { Button, Card } from 'react-native-paper';

<Card>
  <Card.Title title="Dog Training Workshop" />
  <Card.Content>
    <Text>Learn basic obedience commands</Text>
  </Card.Content>
  <Card.Actions>
    <Button mode="contained">Book Now</Button>
  </Card.Actions>
</Card>
```

#### Option 2: React Native Elements
```json
{
  "react-native-elements": "^3.4.3"
}
```

**Purpose**: Cross-platform UI toolkit  
**Why**:
- Platform-agnostic design
- Highly customizable
- Large component library

#### Option 3: NativeBase
```json
{
  "native-base": "^3.4.28"
}
```

**Purpose**: Accessible component library  
**Why**:
- Accessibility-first
- Dark mode support
- Responsive utilities

**Recommendation**: Choose **ONE** library to maintain consistency.

**Docs**:
- Paper: https://callstack.github.io/react-native-paper/
- Elements: https://reactnativeelements.com/
- NativeBase: https://nativebase.io/

---

### 3.6 Form Handling

#### React Hook Form
```json
{
  "react-hook-form": "^7.49.2"
}
```

**Purpose**: Form validation and state management  
**Why**:
- Minimal re-renders
- Built-in validation
- Easy integration with UI libraries
- Small bundle size

**Example Usage**:
```javascript
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button } from 'react-native-paper';

function LoginForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <>
      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Email"
            value={value}
            onChangeText={onChange}
            error={!!errors.email}
          />
        )}
      />
      {errors.email && <Text>{errors.email.message}</Text>}
      
      <Button onPress={handleSubmit(onSubmit)}>Submit</Button>
    </>
  );
}
```

**Alternatives**:
- Formik (more features, larger bundle)
- Manual state management (more code)

**Docs**: https://react-hook-form.com/

---

### 3.7 Local Storage

#### AsyncStorage
```json
{
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

**Purpose**: Persist data locally on device  
**Why**:
- Official React Native solution
- Simple key-value store
- Async API (non-blocking)

**Use Cases**:
- Authentication tokens
- User preferences
- Cached API responses
- Offline data

**Example Usage**:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('authToken', token);

// Retrieve data
const token = await AsyncStorage.getItem('authToken');

// Remove data
await AsyncStorage.removeItem('authToken');

// Store objects
await AsyncStorage.setItem('user', JSON.stringify(userData));
const user = JSON.parse(await AsyncStorage.getItem('user'));
```

**Docs**: https://react-native-async-storage.github.io/async-storage/

---

### 3.8 Image Optimization

#### React Native Fast Image
```json
{
  "react-native-fast-image": "^8.6.3"
}
```

**Purpose**: Performant image loading and caching  
**Why**:
- Better performance than built-in Image
- Disk and memory caching
- Priority-based loading
- iOS and Android optimized

**Example Usage**:
```javascript
import FastImage from 'react-native-fast-image';

<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: 'https://example.com/event-image.jpg',
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**Docs**: https://github.com/DylanVann/react-native-fast-image

---

### 3.9 Payment Integration

#### Stripe React Native SDK
```json
{
  "@stripe/stripe-react-native": "^0.35.1"
}
```

**Purpose**: In-app subscription payments  
**Why**:
- Official Stripe SDK
- PCI-compliant (no raw card data handling)
- Pre-built UI components
- Test mode for development

**Example Usage**:
```javascript
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';

function PaymentScreen() {
  const { confirmPayment } = useStripe();

  const handlePayment = async () => {
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      console.error('Payment failed:', error);
    } else if (paymentIntent) {
      console.log('Payment successful:', paymentIntent);
    }
  };

  return (
    <StripeProvider publishableKey="pk_test_...">
      <CardField
        postalCodeEnabled={false}
        style={{ height: 50 }}
        onCardChange={(cardDetails) => {
          console.log('Card details:', cardDetails);
        }}
      />
      <Button title="Pay Now" onPress={handlePayment} />
    </StripeProvider>
  );
}
```

**Docs**: https://stripe.com/docs/payments/accept-a-payment?platform=react-native

---

### 3.10 Development & Debugging Tools

#### React Native Debugger
**Purpose**: Debug React Native apps  
**Features**:
- Redux DevTools integration
- React DevTools
- Network inspector
- Console logs

**Download**: https://github.com/jhen0409/react-native-debugger

#### Flipper
```json
{
  "react-native-flipper": "^0.212.0"
}
```

**Purpose**: Platform-native debugging  
**Features**:
- Network inspection
- Database inspection
- Layout inspector
- Crash reporter

**Docs**: https://fbflipper.com/

---

## 4. Backend API Stack

### 4.1 Runtime Environment

#### Node.js
**Version**: 18 LTS (18.19.0+) or 20 LTS (20.11.0+)  
**Purpose**: JavaScript runtime for backend  
**Why**:
- Non-blocking I/O (excellent for I/O-heavy apps)
- Same language as frontend (shared code potential)
- Massive package ecosystem (npm)
- Active LTS support

**Key Features**:
- Event-driven architecture
- Built-in async/await support
- CommonJS and ES modules
- Native Promise support

**Download**: https://nodejs.org/

---

### 4.2 Web Framework

#### Express.js
```json
{
  "express": "^4.18.2"
}
```

**Purpose**: Web application framework  
**Why**:
- Most popular Node.js framework (battle-tested)
- Minimalist and unopinionated
- Extensive middleware ecosystem
- Easy to learn and understand

**Core Concepts**:
- Middleware chain
- Route handlers
- Template engines (if needed)
- Static file serving

**Basic Setup**:
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/events', (req, res) => {
  res.json({ success: true, data: events });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Essential Middleware**:
```json
{
  "cors": "^2.8.5",           // Cross-Origin Resource Sharing
  "helmet": "^7.1.0",          // Security headers
  "morgan": "^1.10.0",         // Request logging
  "compression": "^1.7.4"      // Response compression
}
```

**Alternatives Considered**:
- Fastify (faster, more modern)
- Koa (smaller, more modular)
- NestJS (opinionated, TypeScript-first)

**Docs**: https://expressjs.com/

---

### 4.3 Database Driver

#### mysql2
```json
{
  "mysql2": "^3.7.0"
}
```

**Purpose**: MySQL client for Node.js  
**Why**:
- Promises support (async/await)
- Prepared statements (SQL injection prevention)
- Connection pooling
- Faster than original mysql package

**Example Usage**:
```javascript
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'pet_services',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Execute query
async function getEvents() {
  const [rows] = await pool.execute(
    'SELECT * FROM events WHERE event_date > ?',
    [new Date()]
  );
  return rows;
}

// Transactions
async function createBookingWithPayment() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [booking] = await connection.execute(
      'INSERT INTO bookings (...) VALUES (?)',
      [bookingData]
    );
    
    const [payment] = await connection.execute(
      'INSERT INTO payments (...) VALUES (?)',
      [paymentData]
    );
    
    await connection.commit();
    return booking;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**Docs**: https://github.com/sidorares/node-mysql2

---

### 4.4 Authentication & Security

#### jsonwebtoken
```json
{
  "jsonwebtoken": "^9.0.2"
}
```

**Purpose**: Create and verify JWT tokens  
**Why**:
- Stateless authentication
- Industry standard
- Customizable claims

**Example Usage**:
```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### bcrypt
```json
{
  "bcrypt": "^5.1.1"
}
```

**Purpose**: Password hashing  
**Why**:
- Industry standard
- Adjustable work factor
- Automatic salt generation

**Example Usage**:
```javascript
const bcrypt = require('bcrypt');

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Docs**:
- jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
- bcrypt: https://github.com/kelektiv/node.bcrypt.js

---

### 4.5 Validation

#### Joi
```json
{
  "joi": "^17.11.0"
}
```

**Purpose**: Request validation and sanitization  
**Why**:
- Schema-based validation
- Rich validation rules
- Custom error messages
- TypeScript support

**Example Usage**:
```javascript
const Joi = require('joi');

const bookingSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  itemType: Joi.string().valid('event', 'service').required(),
  couponCode: Joi.string().alphanum().max(50).optional()
});

// Middleware
function validateBooking(req, res, next) {
  const { error, value } = bookingSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  
  req.validatedData = value;
  next();
}

// Route
app.post('/api/bookings/initiate', validateBooking, bookingController.initiate);
```

**Alternatives**:
- express-validator (middleware-based)
- Yup (similar to Joi)
- Zod (TypeScript-first)

**Docs**: https://joi.dev/

---

### 4.6 Environment Configuration

#### dotenv
```json
{
  "dotenv": "^16.3.1"
}
```

**Purpose**: Load environment variables from .env file  
**Why**:
- Keep secrets out of code
- Different configs per environment
- Simple and standard

**Example Usage**:
```javascript
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '7d'
  }
};
```

**.env file**:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secretpassword
DB_NAME=pet_services
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
```

**Docs**: https://github.com/motdotla/dotenv

---

### 4.7 Logging

#### Winston
```json
{
  "winston": "^3.11.0"
}
```

**Purpose**: Flexible logging library  
**Why**:
- Multiple transports (console, file, remote)
- Log levels
- Structured logging (JSON)
- Production-ready

**Example Setup**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Development: also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User logged in', { userId: 123 });
logger.error('Database connection failed', { error: err.message });
```

**Alternative**: Morgan (for HTTP request logging)
```json
{
  "morgan": "^1.10.0"
}
```

```javascript
const morgan = require('morgan');
app.use(morgan('combined')); // Apache combined format
```

**Docs**:
- Winston: https://github.com/winstonjs/winston
- Morgan: https://github.com/expressjs/morgan

---

### 4.8 API Rate Limiting

#### express-rate-limit
```json
{
  "express-rate-limit": "^7.1.5"
}
```

**Purpose**: Prevent abuse and DOS attacks  
**Why**:
- Simple middleware
- Flexible configuration
- Memory or Redis store

**Example Usage**:
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to all routes
app.use('/api/', apiLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', authLimiter, authController.login);
```

**Docs**: https://github.com/express-rate-limit/express-rate-limit

---

### 4.9 Payment Gateway Integration

#### Stripe Node.js SDK
```json
{
  "stripe": "^14.10.0"
}
```

**Purpose**: Server-side payment processing  
**Why**:
- Official Stripe SDK
- Handle payment intents
- Webhook support
- Subscription management

**Example Usage**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
async function createPaymentIntent(amount, currency = 'usd') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });
  
  return paymentIntent.client_secret;
}

// Create subscription
async function createSubscription(customerId, priceId) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  return subscription;
}

// Handle webhook
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // Update database
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

**Docs**: https://stripe.com/docs/api?lang=node

---

### 4.10 Development Tools

#### Nodemon
```json
{
  "nodemon": "^3.0.2"
}
```

**Purpose**: Auto-restart server on file changes  
**Why**:
- Faster development
- Watch specific files/folders
- Custom restart logic

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

**nodemon.json**:
```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js"],
  "exec": "node src/index.js"
}
```

**Docs**: https://nodemon.io/

---

## 5. Database & Data Layer

### 5.1 Database Management System

#### MySQL
**Version**: 8.0+  
**Purpose**: Primary data storage  
**Why** (Required by Assignment):
- ACID compliance
- Mature and stable
- Strong consistency
- Rich query capabilities
- Transaction support

**Key Features Used**:
- Foreign keys and constraints
- Indexes for performance
- Transactions
- Stored procedures (optional)
- Full-text search

**Installation**:
- macOS: `brew install mysql`
- Windows: MySQL Installer
- Linux: `sudo apt-get install mysql-server`

**Docs**: https://dev.mysql.com/doc/

---

### 5.2 Database GUI Tools

#### Option 1: MySQL Workbench
**Purpose**: Visual database design and management  
**Features**:
- ER diagram designer
- Query editor with autocomplete
- Server administration
- Data modeling

**Download**: https://www.mysql.com/products/workbench/

#### Option 2: DBeaver
**Purpose**: Universal database tool  
**Features**:
- Multiple database support
- ER diagrams
- SQL editor
- Data export/import

**Download**: https://dbeaver.io/

#### Option 3: TablePlus
**Purpose**: Modern database GUI (paid, with free tier)  
**Features**:
- Beautiful interface
- Multiple databases
- Query builder
- Fast performance

**Download**: https://tableplus.com/

---

### 5.3 Migration Tools

#### Option 1: db-migrate
```json
{
  "db-migrate": "^0.11.14",
  "db-migrate-mysql": "^2.2.0"
}
```

**Purpose**: Database schema version control  
**Why**:
- Up/down migrations
- Version tracking
- Team collaboration

**Example Migration**:
```javascript
// migrations/20260204000001-create-users-table.js
exports.up = function(db) {
  return db.createTable('users', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    email: { type: 'string', length: 255, unique: true, notNull: true },
    password_hash: { type: 'string', length: 255, notNull: true },
    full_name: { type: 'string', length: 255, notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  });
};

exports.down = function(db) {
  return db.dropTable('users');
};
```

**Commands**:
```bash
db-migrate create create-users-table --sql-file
db-migrate up
db-migrate down
```

#### Option 2: Knex.js Migrations
```json
{
  "knex": "^3.1.0"
}
```

**Purpose**: SQL query builder with migrations  
**Why**:
- Query builder + migrations in one
- Promise-based
- Transaction support

**Docs**:
- db-migrate: https://db-migrate.readthedocs.io/
- Knex: https://knexjs.org/

---

### 5.4 Caching Layer (Optional Enhancement)

#### Redis
```json
{
  "redis": "^4.6.12"
}
```

**Purpose**: In-memory data store for caching  
**Why**:
- Extremely fast (microsecond latency)
- Reduce database load
- Session storage
- Rate limiting data

**Use Cases**:
- Cache subscription tiers (rarely change)
- Cache user subscription status (5 min TTL)
- Rate limiting counters
- Session data

**Example Usage**:
```javascript
const redis = require('redis');
const client = redis.createClient();

await client.connect();

// Set with expiration
await client.setEx('subscription_tiers', 3600, JSON.stringify(tiers));

// Get
const cached = await client.get('subscription_tiers');
if (cached) {
  return JSON.parse(cached);
}

// Delete
await client.del('subscription_tiers');
```

**Installation**:
- macOS: `brew install redis`
- Docker: `docker run -d -p 6379:6379 redis`

**Note**: Redis is optional for internship scope, but good to mention as scaling solution.

**Docs**: https://redis.io/docs/

---

## 6. External Services & Integrations

### 6.1 Payment Gateway

#### Stripe
**Purpose**: Payment processing for subscriptions  
**SDKs**:
- Mobile: `@stripe/stripe-react-native`
- Backend: `stripe` (Node.js)

**Test Mode Features**:
- Test card numbers
- No real money
- Webhook testing with Stripe CLI

**Test Cards**:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Any future expiry date, any CVC
```

**Webhook Testing**:
```bash
stripe listen --forward-to localhost:3000/webhook
```

**Pricing**: Free for test mode, transaction fees in production

**Docs**: https://stripe.com/docs

**Alternatives**:
- PayPal (widely recognized)
- Razorpay (popular in India)
- Square (simple integration)

---

### 6.2 Provider Payment Pages

**Purpose**: External checkout for events/services  
**Implementation**: 
- Not an actual integration
- App generates URL and redirects
- Simulated for internship purposes

**Example Flow**:
```javascript
// Backend generates provider payment URL
const providerPaymentUrl = `https://petpro-training.com/checkout?` +
  `booking_id=${booking.id}&` +
  `amount=${finalPrice}&` +
  `discount=${discountAmount}`;

// Mobile app opens URL
Linking.openURL(providerPaymentUrl);
```

---

## 7. Development Tools

### 7.1 Code Editor

#### Visual Studio Code (Recommended)
**Features**:
- IntelliSense
- Integrated terminal
- Git integration
- Extensions marketplace

**Essential Extensions**:
```
- ESLint
- Prettier
- ES7+ React/Redux/React-Native snippets
- React Native Tools
- MySQL (by Jun Han)
- REST Client
- GitLens
- Path Intellisense
- Auto Rename Tag
- Bracket Pair Colorizer 2
```

**Download**: https://code.visualstudio.com/

---

### 7.2 API Testing

#### Postman
**Purpose**: Test API endpoints  
**Features**:
- Request collections
- Environment variables
- Automated testing
- Mock servers
- API documentation

**Download**: https://www.postman.com/downloads/

#### Alternative: Insomnia
**Purpose**: Lightweight API client  
**Features**:
- GraphQL support
- Environment management
- Code generation

**Download**: https://insomnia.rest/

#### Alternative: REST Client (VS Code Extension)
**Purpose**: Test APIs within VS Code  
**Example**:
```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

### Get Events (with auth)
GET http://localhost:3000/api/events
Authorization: Bearer {{authToken}}
```

---

### 7.3 Version Control

#### Git
**Version**: 2.40+  
**Purpose**: Source code management  
**Why**:
- Industry standard
- Branching and merging
- Collaboration
- History tracking

**Essential Commands**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch feature/bookings
git checkout feature/bookings
git merge main
git push origin main
```

**Git GUI Tools**:
- GitHub Desktop (beginner-friendly)
- GitKraken (visual interface)
- SourceTree (Atlassian)

**Docs**: https://git-scm.com/doc

---

## 8. Testing & Quality Assurance

### 8.1 Testing Frameworks

#### Jest
```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.11"
}
```

**Purpose**: JavaScript testing framework  
**Why**:
- Zero config for most projects
- Fast parallel test execution
- Built-in mocking
- Code coverage reports

**Example Test**:
```javascript
// discountCalculator.test.js
const { calculateDiscount } = require('../services/discountCalculator');

describe('Discount Calculator', () => {
  test('applies provider discount correctly', () => {
    const result = calculateDiscount({
      originalPrice: 100,
      providerDiscount: 10,
      couponDiscount: 0,
      subscriptionDiscount: 0
    });
    
    expect(result.finalPrice).toBe(90);
  });

  test('stacks all discounts', () => {
    const result = calculateDiscount({
      originalPrice: 100,
      providerDiscount: 10,
      couponDiscount: 20,
      subscriptionDiscount: 10
    });
    
    // 100 * 0.9 * 0.8 * 0.9 = 64.8
    expect(result.finalPrice).toBeCloseTo(64.8);
  });
});
```

**Run Tests**:
```bash
npm test
npm test -- --coverage
npm test -- --watch
```

**Docs**: https://jestjs.io/

---

### 8.2 Code Quality

#### ESLint
```json
{
  "eslint": "^8.56.0",
  "eslint-config-airbnb": "^19.0.4",
  "eslint-plugin-react": "^7.33.2",
  "eslint-plugin-react-native": "^4.1.0"
}
```

**Purpose**: JavaScript linter  
**Why**:
- Catch bugs early
- Enforce code style
- Best practices

**.eslintrc.json**:
```json
{
  "extends": [
    "airbnb",
    "airbnb/hooks",
    "plugin:react-native/all"
  ],
  "rules": {
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
    "no-console": "warn",
    "react-native/no-unused-styles": "error"
  }
}
```

#### Prettier
```json
{
  "prettier": "^3.1.1"
}
```

**Purpose**: Code formatter  
**Why**:
- Consistent formatting
- Automatic formatting on save
- Works with ESLint

**.prettierrc**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

**VS Code Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**Docs**:
- ESLint: https://eslint.org/
- Prettier: https://prettier.io/

---

## 9. DevOps & Deployment

### 9.1 Process Manager

#### PM2 (Production)
```json
{
  "pm2": "^5.3.0"
}
```

**Purpose**: Production process manager  
**Why**:
- Keep app running
- Auto-restart on crash
- Load balancing
- Log management
- Zero-downtime reload

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'pet-services-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

**Commands**:
```bash
pm2 start ecosystem.config.js
pm2 restart pet-services-api
pm2 logs
pm2 monit
pm2 stop all
```

**Docs**: https://pm2.keymetrics.io/

---

### 9.2 Containerization (Optional)

#### Docker
**Purpose**: Container platform  
**Why**:
- Consistent environments
- Easy deployment
- Isolation

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=password
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=pet_services
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

**Commands**:
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

**Docs**: https://docs.docker.com/

---

## 10. Security & Authentication

### 10.1 Security Headers

#### Helmet
```json
{
  "helmet": "^7.1.0"
}
```

**Purpose**: Set security HTTP headers  
**Why**:
- XSS protection
- Clickjacking prevention
- HTTPS enforcement
- Content Security Policy

**Usage**:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

**Docs**: https://helmetjs.github.io/

---

### 10.2 CORS Management

#### cors
```json
{
  "cors": "^2.8.5"
}
```

**Purpose**: Enable Cross-Origin Resource Sharing  
**Why**:
- Control which origins can access API
- Security measure

**Configuration**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://petservices.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Docs**: https://github.com/expressjs/cors

---

## 11. Monitoring & Observability

### 11.1 Application Performance Monitoring (Optional)

#### Sentry (Error Tracking)
```json
{
  "@sentry/react-native": "^5.15.0",
  "@sentry/node": "^7.91.0"
}
```

**Purpose**: Error tracking and monitoring  
**Why**:
- Capture exceptions
- Performance monitoring
- Release tracking
- User feedback

**Setup (Mobile)**:
```javascript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
});
```

**Setup (Backend)**:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'YOUR_DSN',
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Docs**: https://docs.sentry.io/

---

## 12. Version Control & Package Management

### 12.1 Package Manager

#### npm (Default)
**Version**: Comes with Node.js  
**Purpose**: Package installation and management

**Essential Commands**:
```bash
npm init -y
npm install express
npm install --save-dev nodemon
npm install
npm update
npm run dev
```

#### Alternative: Yarn
```bash
yarn init
yarn add express
yarn add --dev nodemon
yarn
yarn dev
```

#### Alternative: pnpm (Fastest)
```bash
pnpm init
pnpm add express
pnpm add -D nodemon
pnpm install
```

---

### 12.2 Package.json Scripts

**Mobile (package.json)**:
```json
{
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write \"src/**/*.{js,jsx}\""
  }
}
```

**Backend (package.json)**:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "migrate": "db-migrate up",
    "migrate:down": "db-migrate down",
    "seed": "node scripts/seed.js",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.js\""
  }
}
```

---

## 13. Alternative Considerations

### 13.1 What Was NOT Chosen and Why

| Technology | Why NOT Chosen | When to Consider |
|-----------|----------------|------------------|
| **GraphQL** | More complex, overkill for this scope | Complex data requirements, mobile-first APIs |
| **PostgreSQL** | Assignment requires MySQL | Need JSON columns, advanced features |
| **MongoDB** | Assignment requires relational DB | Unstructured data, rapid schema changes |
| **Prisma ORM** | Adds abstraction layer, learning curve | Type safety priority, auto-migrations |
| **NestJS** | Opinionated, heavier framework | Large teams, enterprise patterns |
| **Expo** | Limits native module access | Rapid prototyping, no custom native code |
| **Redux** | Context API sufficient for this scope | Very complex state, time-travel debugging |
| **Socket.io** | Not needed for current features | Real-time notifications, chat |
| **Microservices** | Too complex for this scope | Large scale, team distribution |

---

## 14. Learning Resources

### 14.1 Official Documentation

- **React Native**: https://reactnative.dev/docs/getting-started
- **React**: https://react.dev/
- **Node.js**: https://nodejs.org/en/docs/
- **Express**: https://expressjs.com/
- **MySQL**: https://dev.mysql.com/doc/
- **Stripe**: https://stripe.com/docs

### 14.2 Tutorials & Courses

**Free Resources**:
- React Native Tutorial: https://reactnative.dev/docs/tutorial
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- MDN Web Docs: https://developer.mozilla.org/

**Video Courses**:
- Traversy Media (YouTube) - React Native & Node.js
- Academind (Udemy) - React Native: The Practical Guide
- The Net Ninja (YouTube) - Node.js Crash Course

### 14.3 Community & Support

- **Stack Overflow**: https://stackoverflow.com/
- **React Native Community**: https://github.com/react-native-community
- **Node.js Discord**: https://discord.gg/nodejs
- **Stripe Discord**: https://discord.gg/stripe

---

## 15. Quick Start Checklist

### 15.1 Prerequisites Installation

```bash
# Check versions
node --version          # Should be 18+
npm --version           # Should be 9+
git --version
mysql --version         # Should be 8.0+

# Install React Native CLI
npm install -g react-native-cli

# iOS only (macOS)
sudo gem install cocoapods
pod --version

# Android only
# Download Android Studio
# Set up Android SDK and emulator
```

### 15.2 Project Initialization

**Mobile App**:
```bash
npx react-native init PetServicesApp
cd PetServicesApp
npm install @react-navigation/native @react-navigation/stack
npm install axios react-native-paper
npm install @stripe/stripe-react-native
npm install @react-native-async-storage/async-storage
```

**Backend**:
```bash
mkdir pet-services-api
cd pet-services-api
npm init -y
npm install express mysql2 dotenv
npm install jsonwebtoken bcrypt joi
npm install cors helmet morgan
npm install stripe
npm install --save-dev nodemon
```

### 15.3 Essential Files

**Mobile: .gitignore**
```
node_modules/
.expo/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.env
ios/Pods/
```

**Backend: .gitignore**
```
node_modules/
.env
logs/
*.log
.DS_Store
```

**Backend: .env.example**
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pet_services
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
```

---

## 16. Technology Stack Summary

### 16.1 Complete Dependency List

**Mobile (React Native)**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "axios": "^1.6.5",
    "react-native-paper": "^5.11.3",
    "react-hook-form": "^7.49.2",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-fast-image": "^8.6.3",
    "@stripe/stripe-react-native": "^0.35.1"
  },
  "devDependencies": {
    "@babel/core": "^7.23.7",
    "@babel/preset-env": "^7.23.7",
    "@babel/runtime": "^7.23.7",
    "metro-react-native-babel-preset": "^0.77.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "jest": "^29.7.0"
  }
}
```

**Backend (Node.js + Express)**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.7.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5",
    "stripe": "^14.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

### 16.2 Technology Decision Matrix

| Category | Technology | Why Chosen | Confidence Level |
|----------|-----------|------------|------------------|
| Mobile Framework | React Native | Cross-platform, required | ⭐⭐⭐⭐⭐ |
| Backend Runtime | Node.js | JavaScript, async, required | ⭐⭐⭐⭐⭐ |
| Backend Framework | Express.js | Simple, popular, flexible | ⭐⭐⭐⭐⭐ |
| Database | MySQL | Relational, required | ⭐⭐⭐⭐⭐ |
| Navigation | React Navigation | Standard, feature-rich | ⭐⭐⭐⭐⭐ |
| HTTP Client | Axios | Interceptors, better DX | ⭐⭐⭐⭐ |
| State Management | Context API | Built-in, sufficient | ⭐⭐⭐⭐ |
| UI Library | React Native Paper | Material, consistent | ⭐⭐⭐⭐ |
| Authentication | JWT + bcrypt | Stateless, secure | ⭐⭐⭐⭐⭐ |
| Validation | Joi | Schema-based, clear | ⭐⭐⭐⭐ |
| Payment | Stripe | Best DX, test mode | ⭐⭐⭐⭐⭐ |

---

## 17. Next Steps

### 17.1 Immediate Actions

1. **Install Prerequisites**
   - Node.js, npm, Git
   - MySQL
   - React Native development environment
   - Code editor (VS Code)

2. **Initialize Projects**
   - Create React Native app
   - Create Express API
   - Set up MySQL database

3. **Install Core Dependencies**
   - Mobile: Navigation, HTTP client, UI library
   - Backend: Express, MySQL driver, auth packages

4. **Set Up Development Environment**
   - Configure ESLint and Prettier
   - Set up environment variables
   - Create basic folder structure

### 17.2 Development Phases

**Week 1**: Setup + Part 1-2
- Project initialization
- Navigation setup
- Basic API with database

**Week 2**: Part 3-4
- Booking flow
- Discount calculation
- Subscription gating

**Week 3**: Part 5-6
- Payment integration
- Testing and refinement
- Demo preparation

---

## Appendix

### A. Useful npm Commands

```bash
# View outdated packages
npm outdated

# Update packages
npm update

# Audit security
npm audit
npm audit fix

# Clean install
rm -rf node_modules package-lock.json
npm install

# List installed packages
npm list --depth=0

# Check package info
npm info express
```

### B. React Native Commands

```bash
# Run on specific device
react-native run-ios --simulator="iPhone 14"
react-native run-android --deviceId=emulator-5554

# Clear cache
npx react-native start --reset-cache

# Link assets
npx react-native-asset

# Check doctor
npx react-native doctor
```

### C. MySQL Commands

```bash
# Login
mysql -u root -p

# Create database
CREATE DATABASE pet_services;

# Use database
USE pet_services;

# Show tables
SHOW TABLES;

# Describe table
DESCRIBE users;

# Export database
mysqldump -u root -p pet_services > backup.sql

# Import database
mysql -u root -p pet_services < backup.sql
```

---

## Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 4, 2026 | Claude (AI) | Initial tech stack document |

---

**END OF TECHNOLOGY STACK DOCUMENT**

This document provides complete technology specifications, justifications, and practical examples for the Pet Services Subscription Mobile Application. Use it as a reference for technology decisions during development and demo preparation.
