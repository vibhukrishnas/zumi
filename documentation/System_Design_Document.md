# System Design Document (SDD)
## Pet Services Subscription Mobile Application

**Version:** 1.0  
**Date:** February 4, 2026  
**Project:** Vibe Coding Internship - Mobile App Development  
**Tech Stack:** React Native, Node.js, MySQL

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Design](#3-architecture-design)
4. [Component Design](#4-component-design)
5. [Data Architecture](#5-data-architecture)
6. [API Design](#6-api-design)
7. [Security Architecture](#7-security-architecture)
8. [Performance & Scalability](#8-performance--scalability)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [Disaster Recovery](#11-disaster-recovery)
12. [Technology Decisions](#12-technology-decisions)

---

## 1. Executive Summary

### 1.1 Document Purpose
This System Design Document outlines the technical architecture, component interactions, data flows, and infrastructure design for the Pet Services Subscription mobile application. It serves as the technical blueprint for implementation and evaluation during the Vibe Coding Internship.

### 1.2 System Goals
- Provide a scalable mobile application for pet service discovery
- Implement secure subscription and payment processing
- Enable seamless booking workflows with discount application
- Ensure high availability and performance
- Support future feature expansion

### 1.3 Key Architectural Decisions
1. **Three-tier architecture**: Mobile client, API server, database layer
2. **RESTful API design**: Stateless, resource-oriented endpoints
3. **JWT-based authentication**: Secure, scalable session management
4. **Relational database**: MySQL for ACID compliance and complex queries
5. **Sandbox payment gateway**: Stripe test mode for development

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          React Native Mobile Application                   │  │
│  │  • iOS & Android Support                                   │  │
│  │  • Component-based UI                                      │  │
│  │  • Local state management (Context API / Redux)           │  │
│  │  • Offline-first caching strategy                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/TLS
                                  │ REST API Calls
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Node.js Express API Server                    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Controllers (Route Handlers)                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Business Logic Services                             │  │  │
│  │  │  • Authentication Service                            │  │  │
│  │  │  • Booking Service                                   │  │  │
│  │  │  • Discount Calculation Engine                       │  │  │
│  │  │  • Payment Service                                   │  │  │
│  │  │  • Subscription Service                              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Middleware Layer                                    │  │  │
│  │  │  • JWT Authentication                                │  │  │
│  │  │  • Request Validation                                │  │  │
│  │  │  • Error Handling                                    │  │  │
│  │  │  • Rate Limiting                                     │  │  │
│  │  │  • Logging                                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ MySQL Protocol
                                  │ Connection Pool
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   MySQL Database                           │  │
│  │  • Users & Authentication                                  │  │
│  │  • Events & Services Catalog                              │  │
│  │  • Bookings & Transactions                                │  │
│  │  • Subscriptions & Payments                               │  │
│  │  • Coupons & Discounts                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  Stripe Payment  │  │  Provider Payment│                     │
│  │  Gateway (Test)  │  │  Pages (External)│                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 System Context

```
┌────────────────┐
│   Pet Owner    │
│   (End User)   │
└───────┬────────┘
        │
        │ Uses mobile app
        │ on iOS/Android
        ▼
┌────────────────────────────────────────┐
│                                        │
│    Pet Services Mobile Application    │
│                                        │
│  • Browse events/services              │
│  • Subscribe to tiers                  │
│  • Initiate bookings                   │
│  • Apply discounts                     │
│                                        │
└───────────┬────────────────────────────┘
            │
            │ Communicates via
            │ REST APIs
            ▼
┌────────────────────────────────────────┐
│                                        │
│      Backend API Server                │
│      (Node.js + MySQL)                 │
│                                        │
│  • Authentication                      │
│  • Business logic                      │
│  • Data persistence                    │
│  • Payment orchestration               │
│                                        │
└───┬──────────────────┬─────────────────┘
    │                  │
    │ Integrates       │ Redirects to
    │                  │
    ▼                  ▼
┌──────────────┐  ┌──────────────────┐
│   Stripe     │  │  Service Provider│
│   Payment    │  │  Payment Pages   │
│   Gateway    │  │  (External)      │
└──────────────┘  └──────────────────┘
```

### 2.3 User Interaction Flow

```
[User Opens App]
       │
       ▼
[View Events/Services] ────────► [API: GET /api/events]
       │                              │
       │                              ▼
       │                         [MySQL Query]
       │                              │
       ▼                              │
[Select Event/Service] ◄───────────────┘
       │
       ▼
[Tap "Book Now"]
       │
       ▼
[Check Subscription Status] ───► [API: GET /api/subscriptions/status]
       │                              │
       ├─ Not Subscribed ─────►  [Show Subscription Gate]
       │                              │
       │                              ▼
       │                         [Subscribe Flow]
       │                              │
       │                              ▼
       │                    [Payment Integration]
       │                              │
       │◄─────────────────────────────┘
       │
       └─ Active Subscription
       │
       ▼
[Enter Booking Details]
       │
       ├─ Apply Coupon Code (optional)
       │
       ▼
[Calculate Discounts] ──────────► [API: POST /api/bookings/initiate]
       │                              │
       │                              ▼
       │                    [Discount Calculation Engine]
       │                    • Provider discount
       │                    • Coupon discount
       │                    • Subscription discount
       │                              │
       ▼                              │
[Show Final Price] ◄──────────────────┘
       │
       ▼
[Confirm Booking]
       │
       ▼
[Redirect to Provider Payment Page]
```

---

## 3. Architecture Design

### 3.1 Architectural Style: Three-Tier Architecture

**Justification:**
- **Separation of Concerns**: UI, business logic, and data layers are independent
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Each tier can be scaled independently
- **Testability**: Layers can be tested in isolation

### 3.2 Communication Patterns

#### 3.2.1 Client-Server Communication
- **Protocol**: HTTPS (TLS 1.2+)
- **Format**: JSON for request/response payloads
- **Architecture**: RESTful API design
- **Authentication**: JWT Bearer tokens in Authorization header

#### 3.2.2 Request Flow
```
Mobile App
    │
    │ 1. User action triggers API call
    │
    ▼
API Client Layer (axios)
    │
    │ 2. Adds authentication headers
    │    Serializes request data to JSON
    │
    ▼
HTTPS Network
    │
    │ 3. Encrypted transmission
    │
    ▼
API Gateway / Load Balancer (future)
    │
    │ 4. Routes to appropriate server
    │
    ▼
Express Server
    │
    │ 5. Middleware chain:
    │    • Request logging
    │    • JWT verification
    │    • Request validation
    │    • Rate limiting
    │
    ▼
Controller
    │
    │ 6. Extracts parameters
    │    Calls appropriate service
    │
    ▼
Business Logic Service
    │
    │ 7. Executes business rules
    │    Performs calculations
    │    Orchestrates operations
    │
    ▼
Data Access Layer
    │
    │ 8. Builds SQL queries
    │    Executes via connection pool
    │
    ▼
MySQL Database
    │
    │ 9. CRUD operations
    │    Transaction management
    │
    └──────► [Response flows back up the chain]
```

### 3.3 Design Patterns

#### 3.3.1 Mobile App Patterns
1. **Container/Presentational Components**
   - Smart containers handle logic and state
   - Dumb presentational components handle UI

2. **Context API / Redux for State Management**
   - Global state: authentication, user profile, subscription status
   - Local state: form inputs, UI toggles

3. **Repository Pattern for API Calls**
   - Centralized API client
   - Consistent error handling
   - Request/response interceptors

#### 3.3.2 Backend Patterns
1. **MVC Pattern (Modified)**
   - Controllers: Handle HTTP requests/responses
   - Services: Business logic implementation
   - Models: Database interaction layer

2. **Middleware Chain**
   - Request preprocessing
   - Authentication
   - Validation
   - Error handling

3. **Dependency Injection**
   - Services receive dependencies (db connection, config)
   - Easier testing and flexibility

4. **Factory Pattern**
   - Payment service factory (Stripe, PayPal, etc.)
   - Discount calculator factory

---

## 4. Component Design

### 4.1 Mobile Application Architecture

```
src/
├── app/
│   ├── App.tsx                 # Root component
│   └── navigation/
│       ├── RootNavigator.tsx   # Main navigation setup
│       └── navigationTypes.ts  # Type definitions
│
├── features/                   # Feature-based organization
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── components/
│   │   │   └── AuthForm.tsx
│   │   ├── services/
│   │   │   └── authService.ts
│   │   └── hooks/
│   │       └── useAuth.ts
│   │
│   ├── events/
│   │   ├── screens/
│   │   │   ├── EventListScreen.tsx
│   │   │   └── EventDetailScreen.tsx
│   │   ├── components/
│   │   │   ├── EventCard.tsx
│   │   │   └── EventFilter.tsx
│   │   └── services/
│   │       └── eventService.ts
│   │
│   ├── services/
│   │   ├── screens/
│   │   │   ├── ServiceListScreen.tsx
│   │   │   └── ServiceDetailScreen.tsx
│   │   ├── components/
│   │   │   └── ServiceCard.tsx
│   │   └── services/
│   │       └── serviceService.ts
│   │
│   ├── bookings/
│   │   ├── screens/
│   │   │   └── BookingScreen.tsx
│   │   ├── components/
│   │   │   ├── DiscountCalculator.tsx
│   │   │   └── CouponInput.tsx
│   │   └── services/
│   │       └── bookingService.ts
│   │
│   ├── subscriptions/
│   │   ├── screens/
│   │   │   ├── SubscriptionScreen.tsx
│   │   │   └── PaymentScreen.tsx
│   │   ├── components/
│   │   │   ├── SubscriptionGate.tsx
│   │   │   ├── TierCard.tsx
│   │   │   └── PaymentForm.tsx
│   │   └── services/
│   │       └── subscriptionService.ts
│   │
│   └── profile/
│       ├── screens/
│       │   └── ProfileScreen.tsx
│       └── components/
│           └── SubscriptionBadge.tsx
│
├── shared/                     # Shared utilities
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAPI.ts
│   │   └── useSubscription.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts
│
├── api/                        # API client layer
│   ├── client.ts              # Axios instance configuration
│   ├── interceptors.ts        # Request/response interceptors
│   └── endpoints.ts           # API endpoint definitions
│
└── store/                      # State management
    ├── context/
    │   ├── AuthContext.tsx
    │   └── SubscriptionContext.tsx
    └── reducers/
        └── userReducer.ts
```

### 4.2 Backend API Architecture

```
backend/
├── src/
│   ├── index.ts                    # Application entry point
│   │
│   ├── config/
│   │   ├── database.ts             # Database connection setup
│   │   ├── environment.ts          # Environment variables
│   │   └── payment.ts              # Payment gateway config
│   │
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication
│   │   ├── validation.ts           # Request validation
│   │   ├── errorHandler.ts         # Global error handler
│   │   ├── rateLimit.ts            # Rate limiting
│   │   └── logger.ts               # Request logging
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── eventController.ts
│   │   ├── serviceController.ts
│   │   ├── bookingController.ts
│   │   ├── subscriptionController.ts
│   │   ├── couponController.ts
│   │   └── paymentController.ts
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── eventService.ts
│   │   ├── serviceService.ts
│   │   ├── bookingService.ts
│   │   ├── subscriptionService.ts
│   │   ├── couponService.ts
│   │   ├── paymentService.ts
│   │   └── discountCalculator.ts  # Core discount logic
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Event.ts
│   │   ├── Service.ts
│   │   ├── Booking.ts
│   │   ├── Subscription.ts
│   │   ├── Coupon.ts
│   │   └── Payment.ts
│   │
│   ├── routes/
│   │   ├── index.ts               # Route aggregator
│   │   ├── authRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── serviceRoutes.ts
│   │   ├── bookingRoutes.ts
│   │   ├── subscriptionRoutes.ts
│   │   ├── couponRoutes.ts
│   │   └── paymentRoutes.ts
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_create_users_table.sql
│   │   │   ├── 002_create_subscriptions_table.sql
│   │   │   ├── 003_create_events_table.sql
│   │   │   ├── 004_create_services_table.sql
│   │   │   ├── 005_create_bookings_table.sql
│   │   │   ├── 006_create_coupons_table.sql
│   │   │   └── 007_create_payments_table.sql
│   │   └── seeds/
│   │       ├── events.sql
│   │       ├── services.sql
│   │       └── coupons.sql
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── validators.ts
│   │   └── errors.ts
│   │
│   └── types/
│       ├── express.d.ts           # Express type extensions
│       └── index.ts
│
├── tests/
│   ├── unit/
│   │   ├── discountCalculator.test.ts
│   │   └── couponService.test.ts
│   └── integration/
│       ├── auth.test.ts
│       └── booking.test.ts
│
├── .env.example
├── package.json
└── tsconfig.json
```

### 4.3 Key Component Interactions

#### 4.3.1 Authentication Flow

```
┌─────────────┐
│ LoginScreen │
└──────┬──────┘
       │ User submits credentials
       ▼
┌──────────────┐
│ AuthService  │
└──────┬───────┘
       │ POST /api/auth/login
       ▼
┌───────────────────┐
│ Auth Controller   │
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ Auth Service      │
│ (Backend)         │
│ • Validate creds  │
│ • Generate JWT    │
│ • Get user data   │
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ Response with JWT │
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ Store in Context  │
│ & AsyncStorage    │
└───────────────────┘
```

#### 4.3.2 Booking Flow with Discounts

```
┌──────────────────┐
│ EventDetailScreen│
└────────┬─────────┘
         │ User taps "Book Now"
         ▼
┌──────────────────────┐
│ Check Subscription   │ ──► GET /api/subscriptions/status
└────────┬─────────────┘
         │
         ├── Not Subscribed ──► Show SubscriptionGate
         │
         └── Active Subscription
         │
         ▼
┌──────────────────┐
│ BookingScreen    │
│ • Shows price    │
│ • Coupon input   │
└────────┬─────────┘
         │ User enters coupon
         ▼
┌──────────────────────┐
│ Validate Coupon      │ ──► POST /api/coupons/validate
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Calculate Discounts  │
│ (Frontend Preview)   │
└────────┬─────────────┘
         │ User confirms
         ▼
┌──────────────────────┐
│ Initiate Booking     │ ──► POST /api/bookings/initiate
└────────┬─────────────┘
         │
         ▼
┌────────────────────────────┐
│ Discount Calculator        │
│ (Backend - Authoritative)  │
│ 1. Get provider discount   │
│ 2. Validate coupon         │
│ 3. Get subscription tier   │
│ 4. Apply calculation logic │
│ 5. Generate payment URL    │
└────────┬───────────────────┘
         │
         ▼
┌──────────────────────┐
│ Create Booking Record│
│ in Database          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Return Final Price & │
│ Provider Payment URL │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Redirect to Provider │
│ Payment Page         │
└──────────────────────┘
```

---

## 5. Data Architecture

### 5.1 Database Schema Design

#### 5.1.1 Entity-Relationship Diagram

```
┌─────────────────────┐
│       USERS         │
│─────────────────────│
│ PK: id              │
│     email           │
│     password_hash   │
│     full_name       │
│     phone           │
│     created_at      │
│     updated_at      │
└──────────┬──────────┘
           │
           │ 1:N
           │
    ┌──────┴───────┬──────────────┬──────────────┐
    │              │              │              │
    ▼              ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│SUBSCRIPTIONS│ │ BOOKINGS │ │ PAYMENTS │ │  (etc)   │
└─────────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────┐         ┌─────────────────────┐
│      EVENTS         │         │     SERVICES        │
│─────────────────────│         │─────────────────────│
│ PK: id              │         │ PK: id              │
│     title           │         │     title           │
│     description     │         │     description     │
│     provider        │         │     provider        │
│     event_date      │         │     service_type    │
│     location        │         │     price           │
│     price           │         │     image_url       │
│     image_url       │         │     discount_...    │
│     category        │         │     provider_...    │
│     discount_...    │         │     created_at      │
│     provider_...    │         │     updated_at      │
│     created_at      │         └─────────────────────┘
│     updated_at      │
└──────────┬──────────┘
           │
           │ Referenced by
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────┐  ┌──────────┐
│ BOOKINGS │  │ (future) │
└──────────┘  └──────────┘

┌─────────────────────┐
│      COUPONS        │
│─────────────────────│
│ PK: id              │
│     code            │
│     discount_%      │
│     valid_from      │
│     valid_until     │
│     usage_limit     │
│     used_count      │
│     applicable_types│
│     created_at      │
│     updated_at      │
└─────────────────────┘
           │
           │ Referenced by
           │
           ▼
      ┌──────────┐
      │ BOOKINGS │
      └──────────┘
```

#### 5.1.2 Detailed Schema with Indexes

**Users Table**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Subscriptions Table**
```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tier ENUM('free', 'basic', 'premium') DEFAULT 'free',
  status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Events Table**
```sql
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(255) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100),
  discount_eligible BOOLEAN DEFAULT TRUE,
  provider_discount DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_event_date (event_date),
  INDEX idx_category (category),
  INDEX idx_price (price),
  FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Services Table**
```sql
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(255) NOT NULL,
  service_type VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  discount_eligible BOOLEAN DEFAULT TRUE,
  provider_discount DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_service_type (service_type),
  INDEX idx_price (price),
  FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Bookings Table**
```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  item_type ENUM('event', 'service') NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  provider_discount DECIMAL(5, 2) DEFAULT 0,
  coupon_code VARCHAR(50),
  coupon_discount DECIMAL(5, 2) DEFAULT 0,
  subscription_discount DECIMAL(5, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  status ENUM('initiated', 'completed', 'cancelled') DEFAULT 'initiated',
  provider_payment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_item_type_id (item_type, item_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Coupons Table**
```sql
CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INT DEFAULT 0,
  used_count INT DEFAULT 0,
  applicable_types ENUM('event', 'service', 'all') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Payments Table**
```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_status (status),
  INDEX idx_gateway_transaction_id (gateway_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2 Data Access Patterns

#### 5.2.1 Common Queries and Optimization

**Query 1: Get Active Subscription for User**
```sql
SELECT s.*, u.email, u.full_name
FROM subscriptions s
INNER JOIN users u ON s.user_id = u.id
WHERE s.user_id = ? 
  AND s.status = 'active'
  AND s.end_date > NOW()
ORDER BY s.created_at DESC
LIMIT 1;

-- Optimized by: idx_user_id, idx_status, idx_end_date
```

**Query 2: List Events with Filters**
```sql
SELECT *
FROM events
WHERE event_date > NOW()
  AND (category = ? OR ? IS NULL)
  AND price BETWEEN ? AND ?
ORDER BY event_date ASC
LIMIT ? OFFSET ?;

-- Optimized by: idx_event_date, idx_category, idx_price
```

**Query 3: Validate Coupon**
```sql
SELECT *
FROM coupons
WHERE code = ?
  AND valid_from <= NOW()
  AND valid_until >= NOW()
  AND (usage_limit = 0 OR used_count < usage_limit);

-- Optimized by: idx_code, idx_valid_dates
```

**Query 4: User Booking History**
```sql
SELECT 
  b.*,
  CASE 
    WHEN b.item_type = 'event' THEN e.title
    WHEN b.item_type = 'service' THEN s.title
  END AS item_title
FROM bookings b
LEFT JOIN events e ON b.item_type = 'event' AND b.item_id = e.id
LEFT JOIN services s ON b.item_type = 'service' AND b.item_id = s.id
WHERE b.user_id = ?
ORDER BY b.created_at DESC
LIMIT ?;

-- Optimized by: idx_user_id, idx_created_at
```

### 5.3 Data Integrity & Constraints

#### 5.3.1 Business Rules Enforced at Database Level
1. **Email uniqueness**: UNIQUE constraint on users.email
2. **Coupon code uniqueness**: UNIQUE constraint on coupons.code
3. **Referential integrity**: FOREIGN KEY constraints
4. **Valid discount percentages**: CHECK constraints (0-100)
5. **Valid date ranges**: Application-level validation

#### 5.3.2 Application-Level Constraints
1. **Subscription overlap prevention**: One active subscription per user
2. **Coupon usage tracking**: Increment used_count atomically
3. **Booking duplicate prevention**: Check existing bookings before creation
4. **Price calculation accuracy**: Server-side validation

---

## 6. API Design

### 6.1 RESTful API Principles

**Resource-Oriented Design:**
- Collections: `/api/events`, `/api/services`
- Individual resources: `/api/events/:id`, `/api/services/:id`
- Actions: POST to `/api/bookings/initiate`, not `/api/createBooking`

**HTTP Methods:**
- GET: Retrieve resources
- POST: Create new resources
- PUT/PATCH: Update resources
- DELETE: Remove resources

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

### 6.2 API Endpoint Structure

```
Base URL: https://api.petservices.com/v1

Authentication: Bearer Token in Authorization header
Content-Type: application/json
```

#### 6.2.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Authenticate and get token | No |
| POST | `/api/auth/logout` | Invalidate token | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

#### 6.2.2 Events Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | List all events (with filters) | No |
| GET | `/api/events/:id` | Get event details | No |
| GET | `/api/events/search` | Full-text search | No |

#### 6.2.3 Services Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/services` | List all services (with filters) | No |
| GET | `/api/services/:id` | Get service details | No |
| GET | `/api/services/search` | Full-text search | No |

#### 6.2.4 Bookings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bookings/initiate` | Start booking process | Yes |
| GET | `/api/bookings/:id` | Get booking details | Yes |
| GET | `/api/bookings/history` | User's booking history | Yes |
| PUT | `/api/bookings/:id/cancel` | Cancel a booking | Yes |

#### 6.2.5 Coupons Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/coupons/validate` | Validate coupon code | Yes |
| GET | `/api/coupons/available` | Get user's available coupons | Yes |

#### 6.2.6 Subscriptions Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscriptions/status` | Get current subscription | Yes |
| GET | `/api/subscriptions/tiers` | List available tiers | No |
| POST | `/api/subscriptions/subscribe` | Subscribe to a tier | Yes |
| PUT | `/api/subscriptions/cancel` | Cancel subscription | Yes |

#### 6.2.7 Payments Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/initiate` | Start payment process | Yes |
| POST | `/api/payments/confirm` | Confirm payment success | Yes |
| GET | `/api/payments/history` | Payment transaction history | Yes |

### 6.3 Request/Response Standards

#### 6.3.1 Success Response Format
```json
{
  "success": true,
  "data": {
    // Resource or result data
  },
  "meta": {
    "timestamp": "2026-02-04T10:30:00Z",
    "version": "1.0"
  }
}
```

#### 6.3.2 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COUPON",
    "message": "The coupon code has expired",
    "details": {
      "field": "couponCode",
      "validUntil": "2026-01-31T23:59:59Z"
    }
  },
  "meta": {
    "timestamp": "2026-02-04T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### 6.3.3 Pagination Format
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6.4 Authentication & Authorization

#### 6.4.1 JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 123,
    "email": "user@example.com",
    "role": "user",
    "iat": 1707043800,
    "exp": 1707648600
  }
}
```

#### 6.4.2 Auth Middleware Flow
```javascript
// Request comes in with Authorization header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Middleware extracts and verifies
1. Check if token exists
2. Verify token signature
3. Check expiration
4. Extract user info
5. Attach to request object: req.user
6. Continue to controller

// Controller can access
const userId = req.user.userId;
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    TRANSPORT SECURITY                    │
│  • HTTPS/TLS 1.2+                                       │
│  • Certificate pinning (mobile app)                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 AUTHENTICATION SECURITY                  │
│  • JWT with expiration                                  │
│  • Secure password hashing (bcrypt, 12 rounds)         │
│  • Token refresh mechanism                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 AUTHORIZATION SECURITY                   │
│  • Role-based access control                            │
│  • Resource ownership validation                        │
│  • Subscription tier verification                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA SECURITY                         │
│  • Input validation & sanitization                      │
│  • SQL injection prevention (parameterized queries)    │
│  • XSS protection                                       │
│  • CSRF protection                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   PAYMENT SECURITY                       │
│  • Never store full card details                        │
│  • Use payment gateway tokenization                     │
│  • PCI DSS compliance (handled by Stripe)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  OPERATIONAL SECURITY                    │
│  • Rate limiting                                        │
│  • Request logging                                      │
│  • Environment variable protection                      │
│  • Secrets management                                   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Implementation

#### 7.2.1 Password Hashing
```javascript
// Registration
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);

// Login verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### 7.2.2 JWT Generation
```javascript
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: 'user'
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '7d',
    issuer: 'pet-services-api',
    audience: 'pet-services-app'
  }
);
```

#### 7.2.3 JWT Verification
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET, {
  issuer: 'pet-services-api',
  audience: 'pet-services-app'
});
```

### 7.3 Input Validation & Sanitization

#### 7.3.1 Validation Schema Example (using Joi)
```javascript
const bookingSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  itemType: Joi.string().valid('event', 'service').required(),
  couponCode: Joi.string().alphanum().max(50).optional()
});
```

#### 7.3.2 SQL Injection Prevention
```javascript
// NEVER do this
const query = `SELECT * FROM users WHERE email = '${email}'`; // ❌ UNSAFE

// ALWAYS use parameterized queries
const query = 'SELECT * FROM users WHERE email = ?'; // ✅ SAFE
db.execute(query, [email]);
```

### 7.4 Rate Limiting Strategy

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Stricter limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true
});

// Payment endpoint protection
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // 10 payment attempts
});
```

### 7.5 CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://petservices.com',
    'http://localhost:3000' // Development only
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

### 7.6 Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 8. Performance & Scalability

### 8.1 Performance Targets

| Metric | Target | Measurement Point |
|--------|--------|-------------------|
| API Response Time | < 500ms (avg) | 95th percentile |
| App Launch Time | < 3 seconds | Cold start |
| Screen Transition | < 100ms | User perception |
| Database Query | < 100ms | Complex queries |
| Image Load Time | < 2 seconds | High-quality images |

### 8.2 Optimization Strategies

#### 8.2.1 Database Optimization

**Connection Pooling**
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

**Query Optimization**
- Use indexes on frequently queried columns
- Avoid SELECT * (specify needed columns)
- Use LIMIT for pagination
- Cache frequently accessed data
- Use EXPLAIN to analyze query performance

**Index Strategy**
```sql
-- Composite index for common queries
CREATE INDEX idx_events_date_category ON events(event_date, category);

-- Covering index to avoid table lookup
CREATE INDEX idx_events_list ON events(id, title, price, event_date);
```

#### 8.2.2 Application-Level Caching

**In-Memory Cache (Simple Implementation)**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default

// Cache subscription tiers (rarely changes)
app.get('/api/subscriptions/tiers', async (req, res) => {
  const cacheKey = 'subscription_tiers';
  
  let tiers = cache.get(cacheKey);
  if (!tiers) {
    tiers = await subscriptionService.getTiers();
    cache.set(cacheKey, tiers, 3600); // Cache for 1 hour
  }
  
  res.json({ success: true, data: { tiers } });
});
```

**Redis Cache (Production)**
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// Cache user subscription status
const cacheKey = `subscription:${userId}`;
const cached = await client.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const subscription = await db.getSubscription(userId);
await client.setex(cacheKey, 300, JSON.stringify(subscription)); // 5 min cache
```

#### 8.2.3 Mobile App Optimization

**Image Optimization**
```javascript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**List Rendering Optimization**
```javascript
import { FlatList } from 'react-native';

<FlatList
  data={events}
  renderItem={({ item }) => <EventCard event={item} />}
  keyExtractor={item => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

**Code Splitting & Lazy Loading**
```javascript
import React, { lazy, Suspense } from 'react';

const PaymentScreen = lazy(() => import('./PaymentScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentScreen />
    </Suspense>
  );
}
```

### 8.3 Scalability Considerations

#### 8.3.1 Horizontal Scaling Architecture

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │  (nginx)     │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐
  │  API       │    │  API       │    │  API       │
  │  Server 1  │    │  Server 2  │    │  Server N  │
  └────────────┘    └────────────┘    └────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Database Cluster│
                  │  (Primary +     │
                  │   Read Replicas)│
                  └─────────────────┘
```

#### 8.3.2 Database Scaling Strategy

**Read-Write Splitting**
```javascript
// Write to primary
const writePool = mysql.createPool({
  host: process.env.DB_PRIMARY_HOST,
  // ... config
});

// Read from replicas
const readPool = mysql.createPool({
  host: process.env.DB_REPLICA_HOST,
  // ... config
});

// Service layer decides
async function getEvents() {
  return await readPool.query('SELECT * FROM events'); // Read replica
}

async function createBooking(data) {
  return await writePool.query('INSERT INTO bookings ...', data); // Primary
}
```

**Sharding Strategy (Future)**
- Shard by user_id for user-related data
- Shard by geography for events (location-based)

#### 8.3.3 CDN for Static Assets

```
User Request for Image
        │
        ▼
┌──────────────────┐
│   CDN (CloudFront │
│   or Cloudflare) │
└────────┬─────────┘
         │
         ├─── Cache Hit ──────► Return cached image
         │
         └─── Cache Miss
                  │
                  ▼
          ┌──────────────┐
          │ Origin Server│
          │  (S3 Bucket) │
          └──────────────┘
```

---

## 9. Deployment Architecture

### 9.1 Development Environment

```
┌─────────────────────────────────────────────────────┐
│              Developer Workstation                   │
│                                                      │
│  ┌────────────────┐      ┌──────────────────┐      │
│  │  React Native  │      │   Node.js API    │      │
│  │  Metro Bundler │      │   (nodemon)      │      │
│  │  Port: 8081    │      │   Port: 3000     │      │
│  └────────────────┘      └──────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │        MySQL Database (Local)            │      │
│  │        Port: 3306                        │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │        Stripe Test Mode                  │      │
│  │        (Sandbox)                         │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### 9.2 Production Environment (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                       CDN Layer                              │
│  • Static assets (images, fonts)                            │
│  • Mobile app bundles (OTA updates)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
│  • SSL/TLS termination                                      │
│  • Request routing                                          │
│  • Health checks                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────┐      ┌──────────────────────┐
│   API Server 1       │      │   API Server 2       │
│   (Node.js + PM2)    │      │   (Node.js + PM2)    │
│   Port: 3000         │      │   Port: 3000         │
└──────────────────────┘      └──────────────────────┘
                │                           │
                └───────────┬───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Cluster                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Primary    │  │  Read Replica│  │  Read Replica│      │
│  │   (Master)   │  │       1      │  │       2      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis Cache Cluster                       │
│  • Session storage                                          │
│  • API response caching                                     │
│  • Rate limiting data                                       │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 CI/CD Pipeline (Conceptual)

```
┌──────────────┐
│  Git Push    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  GitHub Actions  │
│  or GitLab CI    │
└──────┬───────────┘
       │
       ├───► Run Tests
       │       ├─ Unit Tests
       │       ├─ Integration Tests
       │       └─ Linting
       │
       ├───► Build
       │       ├─ Mobile App (Android/iOS)
       │       └─ Backend API (Docker image)
       │
       ├───► Deploy to Staging
       │       └─ Run smoke tests
       │
       └───► Deploy to Production
               └─ Zero-downtime deployment
```

### 9.4 Environment Configuration

#### 9.4.1 Development (.env.development)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=dev_password
DB_NAME=pet_services_dev

JWT_SECRET=dev_jwt_secret_key
JWT_EXPIRATION=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

LOG_LEVEL=debug
ENABLE_CORS=true
```

#### 9.4.2 Production (.env.production)
```env
NODE_ENV=production
PORT=3000
DB_HOST=prod-db-cluster.example.com
DB_PORT=3306
DB_USER=api_user
DB_PASSWORD=${SECRETS_MANAGER_DB_PASSWORD}
DB_NAME=pet_services_prod

JWT_SECRET=${SECRETS_MANAGER_JWT_SECRET}
JWT_EXPIRATION=7d

STRIPE_SECRET_KEY=${SECRETS_MANAGER_STRIPE_KEY}
STRIPE_PUBLISHABLE_KEY=pk_live_...

REDIS_HOST=redis-cluster.example.com
REDIS_PORT=6379
REDIS_PASSWORD=${SECRETS_MANAGER_REDIS_PASSWORD}

LOG_LEVEL=info
ENABLE_CORS=false
```

### 9.5 Mobile App Distribution

#### 9.5.1 iOS Distribution
```
Development → TestFlight → App Store

1. Build with Xcode
2. Archive & upload to App Store Connect
3. TestFlight beta testing
4. App Review submission
5. Release to App Store
```

#### 9.5.2 Android Distribution
```
Development → Internal Testing → Production

1. Build APK/AAB with Gradle
2. Upload to Google Play Console
3. Internal/Closed testing tracks
4. Open testing/Production release
```

---

## 10. Monitoring & Logging

### 10.1 Logging Strategy

#### 10.1.1 Log Levels
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

// Development: also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### 10.1.2 What to Log

**Application Logs**
- User authentication events (login, logout, failed attempts)
- API request/response (method, path, status, duration)
- Business logic execution (booking created, payment initiated)
- Errors and exceptions (with stack traces)

**Security Logs**
- Failed authentication attempts
- Rate limit violations
- Suspicious activity patterns
- Authorization failures

**Performance Logs**
- Slow queries (> 1 second)
- API response times
- Cache hit/miss rates

**Example Log Entry**
```json
{
  "timestamp": "2026-02-04T10:30:45.123Z",
  "level": "info",
  "message": "Booking initiated successfully",
  "userId": 123,
  "bookingId": 456,
  "itemType": "event",
  "itemId": 789,
  "finalPrice": 36.00,
  "duration": 145,
  "requestId": "req_abc123"
}
```

### 10.2 Monitoring Metrics

#### 10.2.1 Application Metrics
- Request rate (requests/second)
- Error rate (errors/total requests)
- Response time (p50, p95, p99)
- Active users (concurrent sessions)
- API endpoint usage distribution

#### 10.2.2 Infrastructure Metrics
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput
- Database connection pool status

#### 10.2.3 Business Metrics
- New user registrations
- Active subscriptions count
- Booking conversion rate
- Revenue (daily, weekly, monthly)
- Coupon usage statistics

### 10.3 Health Checks

```javascript
// Basic health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK'
  };
  
  try {
    // Check database connection
    await db.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'DEGRADED';
  }
  
  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

// Readiness check (for load balancer)
app.get('/ready', async (req, res) => {
  // Check if all dependencies are ready
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs()
  ]);
  
  const allReady = checks.every(c => c.status === 'fulfilled');
  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks: checks.map(c => c.status)
  });
});
```

### 10.4 Error Tracking

**Structured Error Information**
```javascript
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Usage
throw new AppError(
  'Coupon has expired',
  400,
  'COUPON_EXPIRED',
  { couponCode: 'PETS20', validUntil: '2026-01-31' }
);
```

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

#### 11.1.1 Database Backups
```bash
# Automated daily backups
0 2 * * * mysqldump -u backup_user -p$DB_PASSWORD \
  pet_services_prod > /backups/db_$(date +\%Y\%m\%d).sql

# Retention policy
- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks
- Monthly backups: Keep for 12 months
```

#### 11.1.2 Point-in-Time Recovery
- Enable MySQL binary logging
- Incremental backups every hour
- Test restoration process monthly

### 11.2 Failover Strategy

```
Primary Database Failure:
1. Promote read replica to primary
2. Update DNS/connection strings
3. Restart API servers
4. Monitor for data consistency

Expected RTO (Recovery Time Objective): < 15 minutes
Expected RPO (Recovery Point Objective): < 5 minutes
```

### 11.3 Data Consistency

#### 11.3.1 Transaction Management
```javascript
async function createBookingWithPayment(bookingData, paymentData) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create booking
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (...) VALUES (?)', 
      [bookingData]
    );
    
    // Create payment record
    const [paymentResult] = await connection.execute(
      'INSERT INTO payments (...) VALUES (?)', 
      [paymentData]
    );
    
    await connection.commit();
    return { bookingId: bookingResult.insertId };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

## 12. Technology Decisions

### 12.1 Technology Justification Matrix

| Technology | Alternatives Considered | Decision Rationale |
|-----------|------------------------|-------------------|
| **React Native** | Flutter, Native (Swift/Kotlin) | Single codebase, JS ecosystem, faster development, required by assignment |
| **Node.js** | Python (FastAPI), Java (Spring Boot) | JavaScript full-stack, async I/O, large ecosystem, required by assignment |
| **MySQL** | PostgreSQL, MongoDB | Relational data model, ACID compliance, complex queries, required by assignment |
| **Express** | Fastify, Koa, NestJS | Mature, extensive middleware, community support |
| **JWT** | Session cookies, OAuth | Stateless, scalable, mobile-friendly |
| **Stripe** | PayPal, Razorpay, Square | Developer-friendly API, test mode, extensive docs |
| **bcrypt** | argon2, scrypt | Industry standard, adjustable work factor |
| **axios** | fetch, ky | Interceptors, timeout handling, promise-based |

### 12.2 Key Architectural Decisions

#### Decision 1: Three-Tier Architecture
**Context**: Need separation between UI, business logic, and data  
**Decision**: Implement three-tier architecture  
**Consequences**: 
- ✅ Clear separation of concerns
- ✅ Easier to test and maintain
- ✅ Can scale layers independently
- ❌ More complex than monolithic
- ❌ Network overhead between layers

#### Decision 2: RESTful API over GraphQL
**Context**: Need API for mobile app communication  
**Decision**: Use REST instead of GraphQL  
**Consequences**:
- ✅ Simpler to implement
- ✅ Better caching with HTTP
- ✅ Easier for internship evaluation
- ❌ Over-fetching on some endpoints
- ❌ Multiple requests for related data

#### Decision 3: JWT for Authentication
**Context**: Need stateless authentication for scalability  
**Decision**: Use JWT tokens over server-side sessions  
**Consequences**:
- ✅ Stateless (no session storage)
- ✅ Works well with mobile apps
- ✅ Can include user data in token
- ❌ Can't invalidate before expiration (unless blacklist)
- ❌ Larger payload than session ID

#### Decision 4: Client-Side State Management
**Context**: Need to manage app state across screens  
**Decision**: Use Context API (or Redux if complex)  
**Consequences**:
- ✅ Built-in to React (no extra dependency for Context)
- ✅ Sufficient for this app's complexity
- ❌ Redux would provide better debugging tools
- ❌ May need refactor if state grows complex

#### Decision 5: Discount Calculation Server-Side
**Context**: Apply discounts before provider redirect  
**Decision**: Calculate discounts on backend (authoritative)  
**Consequences**:
- ✅ Prevents client-side manipulation
- ✅ Single source of truth
- ✅ Easier to audit and log
- ❌ Frontend must preview then validate
- ❌ Network round-trip required

### 12.3 Design Trade-offs

#### Trade-off 1: Normalization vs Performance
**Choice**: Normalized schema with joins  
**Alternative**: Denormalized with redundant data  
**Justification**: Data consistency is more important than marginal performance gains at current scale

#### Trade-off 2: Real-time vs Polling
**Choice**: Polling for subscription status  
**Alternative**: WebSockets for real-time updates  
**Justification**: Simpler implementation, subscription status changes are infrequent

#### Trade-off 3: Native Features vs Consistency
**Choice**: Cross-platform consistency  
**Alternative**: Platform-specific optimizations  
**Justification**: Faster development, easier maintenance for internship scope

---

## 13. Future Enhancements

### 13.1 Technical Debt & Improvements

**Phase 2 Enhancements:**
1. Implement Redis caching layer
2. Add full-text search (Elasticsearch)
3. Implement WebSockets for real-time notifications
4. Add comprehensive test coverage (>80%)
5. Implement API versioning
6. Add GraphQL endpoint option
7. Implement soft deletes
8. Add audit logging
9. Implement CQRS pattern for complex queries
10. Add database migrations framework

### 13.2 Feature Roadmap

**Short-term (1-3 months):**
- Push notifications
- In-app chat with providers
- Advanced filters and search
- User reviews and ratings
- Favorites/Wishlist

**Medium-term (3-6 months):**
- Provider dashboard
- Calendar integration
- Recurring subscriptions
- Family/Multi-pet accounts
- Referral program

**Long-term (6-12 months):**
- AI-powered recommendations
- Pet health tracking integration
- Video consultations
- Social features
- International expansion

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **JWT** | JSON Web Token - A compact, URL-safe means of representing claims to be transferred between two parties |
| **ACID** | Atomicity, Consistency, Isolation, Durability - Database transaction properties |
| **ORM** | Object-Relational Mapping - Technique for converting data between type systems |
| **CDN** | Content Delivery Network - Distributed server network for delivering web content |
| **RTO** | Recovery Time Objective - Maximum acceptable downtime |
| **RPO** | Recovery Point Objective - Maximum acceptable data loss |

### 14.2 Reference Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MOBILE APPLICATION                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  UI Layer (React Native Components)                           │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  State Management (Context API / Redux)                       │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Business Logic Layer (Services, Hooks)                       │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  API Client Layer (Axios, Interceptors)                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                          API GATEWAY LAYER                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Load Balancer (nginx/AWS ALB)                                │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Rate Limiting, SSL Termination                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                       APPLICATION SERVERS                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Express.js Framework                                         │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Middleware: Auth, Validation, Error Handling, Logging        │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Controllers (Route Handlers)                                 │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Business Logic Services                                      │  │
│  │  • Authentication    • Subscriptions   • Payments             │  │
│  │  • Bookings         • Discounts        • Events/Services     │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Data Access Layer (Models)                                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   MySQL Database         │   │   Redis Cache            │
│   • Users                │   │   • Sessions             │
│   • Events/Services      │   │   • API Cache            │
│   • Bookings            │   │   • Rate Limits          │
│   • Subscriptions       │   └──────────────────────────┘
│   • Payments            │
└──────────────────────────┘

     External Services
┌──────────────────────────┐
│   Stripe Payment         │
│   Gateway                │
└──────────────────────────┘
```

### 14.3 Code Review Checklist

**Before Demo:**
- [ ] All environment variables documented
- [ ] No sensitive data in code
- [ ] Error handling on all API calls
- [ ] Input validation on all endpoints
- [ ] Database indexes on queried columns
- [ ] Meaningful variable/function names
- [ ] Comments on complex logic
- [ ] No console.log in production code
- [ ] All API endpoints tested manually
- [ ] Discount calculation tested with edge cases
- [ ] Subscription gating works correctly
- [ ] Payment flow completes successfully
- [ ] Mobile app navigates smoothly
- [ ] README.md is complete and accurate

---

## Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 4, 2026 | Claude (AI) | Initial system design document |

---

**END OF SYSTEM DESIGN DOCUMENT**

This document provides the complete technical architecture and implementation guidance for the Pet Services Subscription Mobile Application. Use it in conjunction with the PRD for comprehensive development planning.
