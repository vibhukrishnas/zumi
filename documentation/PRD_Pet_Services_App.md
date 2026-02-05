# Product Requirements Document (PRD)
## Pet Services Subscription Mobile Application

**Version:** 1.0  
**Date:** February 4, 2026  
**Project:** Vibe Coding Internship - Mobile App Development  
**Tech Stack:** React Native, Node.js, MySQL

---

## 1. Executive Summary

### 1.1 Product Overview
A subscription-based mobile application that enables pet owners to discover, browse, and book pet-related events and services. The app provides value through curated listings, discount benefits for subscribers, and streamlined booking workflows that redirect to provider payment pages.

### 1.2 Target Users
- Pet owners seeking events and services for their pets
- Users willing to subscribe for premium benefits and discounts

### 1.3 Core Value Proposition
- Centralized discovery of pet events and services
- Subscription-based access with exclusive discounts
- Simplified booking initiation with automatic discount application

---

## 2. Product Scope

### 2.1 In Scope
- Event and service discovery interface
- Subscription management with in-app payments
- Booking initiation with discount application
- User authentication and profile management
- Provider discount and coupon code system

### 2.2 Out of Scope
- Direct payment processing for events/services (handled by providers)
- Provider onboarding and management portal
- User reviews and ratings
- Social features (sharing, following)
- Push notifications (optional enhancement)
- Advanced analytics dashboard

### 2.3 Payment Architecture Clarity
**Critical Distinction:**
- **In-App Payments:** Subscription purchases only (processed within app)
- **External Payments:** Events/services (redirected to provider payment pages)
- **Discount Flow:** App calculates and applies discounts before redirect

---

## 3. Technical Requirements

### 3.1 Technology Stack (Mandatory)
| Layer | Technology | Justification Required |
|-------|-----------|------------------------|
| Mobile | React Native | Cross-platform development |
| Backend | Node.js | REST API implementation |
| Database | MySQL | Relational data structure |

### 3.2 Architecture Overview
```
[React Native App] 
    ↓ REST API calls
[Node.js Backend]
    ↓ SQL queries
[MySQL Database]
```

### 3.3 System Components
1. **Mobile Application** (React Native)
   - Navigation system
   - UI components
   - State management
   - API client
   - Payment integration (subscriptions only)

2. **Backend Services** (Node.js)
   - RESTful API endpoints
   - Authentication middleware
   - Business logic layer
   - Database connection pool
   - Discount calculation engine

3. **Database** (MySQL)
   - User accounts
   - Subscription records
   - Events and services catalog
   - Booking records
   - Discount/coupon codes

---

## 4. Feature Specifications (Incremental Development)

### Part 1: App Setup & Navigation

#### 4.1.1 Requirements
- Initialize React Native project with proper structure
- Implement navigation system (screen transitions)
- Create basic screen layouts

#### 4.1.2 Screens
1. **Splash/Loading Screen**
2. **Home Screen** (dashboard)
3. **Events Listing Screen**
4. **Services Listing Screen**
5. **Event/Service Detail Screen**
6. **Profile Screen**
7. **Subscription Screen**

#### 4.1.3 Navigation Flow
```
Home
├── Events List → Event Detail
├── Services List → Service Detail
├── Profile
└── Subscription
```

#### 4.1.4 Deliverables
- Explain project structure (folders, files)
- Explain navigation library choice
- Demonstrate screen transitions

---

### Part 2: Events & Services Listing

#### 4.2.1 Requirements
- Display static event/service cards initially
- Evolve to API-driven dynamic data
- Implement loading states
- Implement error handling
- Add search/filter functionality (optional enhancement)

#### 4.2.2 Data Model - Events
```json
{
  "id": "string/number",
  "title": "string",
  "description": "string",
  "provider": "string",
  "date": "datetime",
  "location": "string",
  "price": "decimal",
  "imageUrl": "string",
  "category": "string",
  "discountEligible": "boolean"
}
```

#### 4.2.3 Data Model - Services
```json
{
  "id": "string/number",
  "title": "string",
  "description": "string",
  "provider": "string",
  "serviceType": "string",
  "price": "decimal",
  "imageUrl": "string",
  "discountEligible": "boolean"
}
```

#### 4.2.4 API Endpoints
```
GET /api/events
GET /api/events/:id
GET /api/services
GET /api/services/:id
```

#### 4.2.5 UI States
- **Loading:** Skeleton screens or spinners
- **Success:** Display cards with data
- **Error:** Friendly error message with retry option
- **Empty:** No events/services available message

#### 4.2.6 Deliverables
- Explain API integration approach
- Demonstrate error handling
- Explain state management choice

---

### Part 3: Booking & Discounts

#### 4.3.1 Requirements
- Initiate booking for events/services
- Apply coupon codes entered by user
- Apply provider-specific discounts automatically
- Calculate final discounted price
- Redirect to provider payment page with discount applied

#### 4.3.2 Booking Flow
```
User selects event/service
    ↓
[Check subscription status]
    ↓ (if subscribed)
Show booking screen
    ↓
User enters coupon code (optional)
    ↓
Apply discounts (coupon + provider + subscription)
    ↓
Display final price
    ↓
User confirms
    ↓
Redirect to provider payment page
```

#### 4.3.3 Discount Types
1. **Subscription Discount:** Fixed % off for active subscribers
2. **Provider Discount:** Event/service-specific discounts
3. **Coupon Code Discount:** User-entered promotional codes

#### 4.3.4 Discount Calculation Logic
```
originalPrice = event/service base price
providerDiscount = provider-specific % (if applicable)
couponDiscount = coupon code % (if valid)
subscriptionDiscount = subscription tier % (if active)

Step 1: Apply provider discount
  price_after_provider = originalPrice * (1 - providerDiscount)

Step 2: Apply best additional discount (coupon OR subscription)
  additional_discount = max(couponDiscount, subscriptionDiscount)
  finalPrice = price_after_provider * (1 - additional_discount)

OR stack all discounts (business decision):
  finalPrice = originalPrice * (1 - providerDiscount) 
                             * (1 - couponDiscount) 
                             * (1 - subscriptionDiscount)
```

#### 4.3.5 Data Model - Booking
```json
{
  "id": "string/number",
  "userId": "string/number",
  "itemId": "string/number",
  "itemType": "event|service",
  "originalPrice": "decimal",
  "discountsApplied": {
    "provider": "decimal",
    "coupon": "string|null",
    "subscription": "decimal"
  },
  "finalPrice": "decimal",
  "status": "initiated|completed|cancelled",
  "providerPaymentUrl": "string",
  "createdAt": "datetime"
}
```

#### 4.3.6 Data Model - Coupon Codes
```json
{
  "id": "string/number",
  "code": "string",
  "discountPercentage": "decimal",
  "validFrom": "datetime",
  "validUntil": "datetime",
  "usageLimit": "number",
  "usedCount": "number",
  "applicableTypes": ["event", "service", "all"]
}
```

#### 4.3.7 API Endpoints
```
POST /api/bookings/initiate
  Body: { itemId, itemType, couponCode? }
  
POST /api/coupons/validate
  Body: { code, itemId, itemType }
  
GET /api/bookings/:id
```

#### 4.3.8 Validation Rules
- Coupon code must be valid and not expired
- Coupon usage limit not exceeded
- Coupon applicable to item type
- User must be authenticated
- Item must exist and be available

#### 4.3.9 Deliverables
- Explain discount calculation logic
- Demonstrate coupon validation
- Explain redirect mechanism to provider payment page
- Handle edge cases (invalid coupon, expired discount)

---

### Part 4: Subscription Gating

#### 4.4.1 Requirements
- Restrict booking features to active subscribers
- Display subscription prompts for non-subscribers
- Show subscription benefits and pricing
- Graceful degradation for non-subscribers

#### 4.4.2 Access Control Logic
```
User attempts to book
    ↓
Check subscription status
    ↓
If NOT subscribed:
  - Show subscription prompt modal
  - Display benefits
  - Offer "Subscribe Now" button
    ↓
If subscribed:
  - Proceed to booking
```

#### 4.4.3 Subscription Tiers (Example)
| Tier | Price | Benefits |
|------|-------|----------|
| Free | $0/month | Browse only |
| Basic | $9.99/month | 10% booking discount |
| Premium | $19.99/month | 20% booking discount + priority support |

#### 4.4.4 Data Model - Subscription
```json
{
  "id": "string/number",
  "userId": "string/number",
  "tier": "free|basic|premium",
  "status": "active|cancelled|expired",
  "startDate": "datetime",
  "endDate": "datetime",
  "autoRenew": "boolean",
  "paymentMethod": "string"
}
```

#### 4.4.5 API Endpoints
```
GET /api/subscriptions/status
GET /api/subscriptions/tiers
POST /api/subscriptions/subscribe
PUT /api/subscriptions/cancel
```

#### 4.4.6 UI Components
- **Subscription Gate Modal:** Shown when non-subscriber attempts booking
- **Subscription Badge:** Display tier on profile
- **Feature Lock Icons:** Visual indicators on restricted features

#### 4.4.7 Deliverables
- Explain subscription check implementation
- Demonstrate gating mechanism
- Handle subscription expiration edge cases

---

### Part 5: Subscription Payments

#### 4.5.1 Requirements
- Implement in-app payment for subscription purchases
- Use sandbox/test payment gateway
- Handle payment success/failure
- Update subscription status after payment
- Store payment records

#### 4.5.2 Payment Flow
```
User selects subscription tier
    ↓
Display payment screen
    ↓
User enters payment details
    ↓
Submit to payment gateway
    ↓
Handle response (success/failure)
    ↓
Update subscription status in database
    ↓
Show confirmation screen
```

#### 4.5.3 Payment Gateway Options (Choose One)
- **Stripe Test Mode** (Recommended)
- **PayPal Sandbox**
- **Razorpay Test Mode**
- **Mock Payment Service** (custom implementation)

#### 4.5.4 Data Model - Payment
```json
{
  "id": "string/number",
  "userId": "string/number",
  "subscriptionId": "string/number",
  "amount": "decimal",
  "currency": "string",
  "paymentMethod": "card|upi|wallet",
  "gatewayTransactionId": "string",
  "status": "pending|completed|failed",
  "createdAt": "datetime",
  "completedAt": "datetime"
}
```

#### 4.5.5 API Endpoints
```
POST /api/payments/initiate
  Body: { subscriptionTier, paymentMethod }
  
POST /api/payments/confirm
  Body: { paymentId, gatewayResponse }
  
GET /api/payments/history
```

#### 4.5.6 Security Considerations
- Never store full card details
- Use tokenization from payment gateway
- Implement HTTPS for all payment requests
- Validate payment amounts server-side
- Log all payment attempts

#### 4.5.7 Test Cards (Stripe Example)
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

#### 4.5.8 Deliverables
- Explain payment gateway integration
- Demonstrate successful payment flow
- Handle payment failures gracefully
- Explain security measures implemented

---

### Part 6: Live Change Requests

#### 4.6.1 Purpose
Test ability to modify existing code based on new requirements or fix introduced issues during demo.

#### 4.6.2 Example Scenarios (Potential)
1. **Change discount calculation:** Stack all discounts instead of choosing maximum
2. **Add new field:** Include pet type in booking
3. **Fix bug:** Handle expired subscription edge case
4. **Modify UI:** Change navigation structure
5. **Add validation:** Prevent booking same event twice
6. **Performance:** Optimize list rendering for 1000+ items

#### 4.6.3 Evaluation Criteria
- Speed of understanding the request
- Ability to locate relevant code
- Quality of the modification
- Testing the change
- Explaining the approach

#### 4.6.4 Preparation Strategy
- Write modular, well-organized code
- Add meaningful comments
- Use consistent naming conventions
- Implement proper error handling
- Keep functions small and focused

---

## 5. Data Models & Database Schema

### 5.1 Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.2 Subscriptions Table
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.3 Events Table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.4 Services Table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.5 Bookings Table
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.6 Coupons Table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.7 Payments Table
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
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);
```

---

## 6. API Specifications

### 6.1 Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "token": "jwt_token_here",
    "subscription": {
      "tier": "basic",
      "status": "active"
    }
  }
}
```

### 6.2 Events Endpoints

#### GET /api/events
**Query Parameters:**
- `category` (optional)
- `page` (default: 1)
- `limit` (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Dog Training Workshop",
        "description": "Learn basic obedience",
        "provider": "PetPro Training",
        "eventDate": "2026-03-15T10:00:00Z",
        "location": "Central Park",
        "price": 50.00,
        "imageUrl": "https://example.com/image.jpg",
        "category": "training",
        "discountEligible": true,
        "providerDiscount": 10
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

#### GET /api/events/:id
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Dog Training Workshop",
    "description": "Learn basic obedience commands...",
    "provider": "PetPro Training",
    "eventDate": "2026-03-15T10:00:00Z",
    "location": "Central Park",
    "price": 50.00,
    "imageUrl": "https://example.com/image.jpg",
    "category": "training",
    "discountEligible": true,
    "providerDiscount": 10
  }
}
```

### 6.3 Services Endpoints

#### GET /api/services
**Query Parameters:**
- `serviceType` (optional)
- `page` (default: 1)
- `limit` (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": 1,
        "title": "Mobile Pet Grooming",
        "description": "Professional grooming at your door",
        "provider": "Paws & Claws",
        "serviceType": "grooming",
        "price": 75.00,
        "imageUrl": "https://example.com/grooming.jpg",
        "discountEligible": true,
        "providerDiscount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 32
    }
  }
}
```

### 6.4 Bookings Endpoints

#### POST /api/bookings/initiate
**Request:**
```json
{
  "itemId": 1,
  "itemType": "event",
  "couponCode": "PETS20"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookingId": 123,
    "originalPrice": 50.00,
    "discountsApplied": {
      "provider": 10,
      "coupon": 20,
      "subscription": 10
    },
    "finalPrice": 36.00,
    "providerPaymentUrl": "https://petpro.com/pay/abc123",
    "status": "initiated"
  }
}
```

### 6.5 Coupons Endpoints

#### POST /api/coupons/validate
**Request:**
```json
{
  "code": "PETS20",
  "itemId": 1,
  "itemType": "event"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountPercentage": 20,
    "message": "Coupon applied successfully"
  }
}
```

**Response (400 - Invalid):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COUPON",
    "message": "Coupon has expired"
  }
}
```

### 6.6 Subscriptions Endpoints

#### GET /api/subscriptions/status
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tier": "basic",
    "status": "active",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z",
    "autoRenew": true,
    "discountPercentage": 10
  }
}
```

#### GET /api/subscriptions/tiers
**Response (200):**
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "id": "basic",
        "name": "Basic",
        "price": 9.99,
        "currency": "USD",
        "interval": "month",
        "benefits": [
          "10% booking discount",
          "Access to all events",
          "Email support"
        ]
      },
      {
        "id": "premium",
        "name": "Premium",
        "price": 19.99,
        "currency": "USD",
        "interval": "month",
        "benefits": [
          "20% booking discount",
          "Priority access to events",
          "24/7 support",
          "Exclusive content"
        ]
      }
    ]
  }
}
```

#### POST /api/subscriptions/subscribe
**Request:**
```json
{
  "tier": "basic",
  "paymentMethodId": "pm_1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": 45,
    "tier": "basic",
    "status": "active",
    "startDate": "2026-02-04T00:00:00Z",
    "endDate": "2026-03-04T00:00:00Z"
  }
}
```

### 6.7 Payments Endpoints

#### POST /api/payments/initiate
**Request:**
```json
{
  "subscriptionTier": "basic",
  "paymentMethod": "card"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": 789,
    "amount": 9.99,
    "currency": "USD",
    "clientSecret": "pi_secret_123",
    "status": "pending"
  }
}
```

#### POST /api/payments/confirm
**Request:**
```json
{
  "paymentId": 789,
  "gatewayResponse": {
    "transactionId": "txn_1234567890",
    "status": "succeeded"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": 789,
    "status": "completed",
    "subscriptionId": 45
  }
}
```

---

## 7. UI/UX Requirements

### 7.1 Design Principles
- Clean, modern interface
- Pet-themed color palette (warm, friendly)
- Clear hierarchy and navigation
- Mobile-first responsive design
- Accessibility considerations (contrast, font sizes)

### 7.2 Key Screens Wireframe Description

#### Home Screen
- Header with logo and profile icon
- Search bar
- Featured events carousel
- Quick action buttons (Events, Services)
- Categories grid

#### Event/Service Listing
- Filter bar (category, date, price)
- Card layout with:
  - Image
  - Title
  - Provider
  - Price (with discount badge if applicable)
  - Date/Type
- Pull-to-refresh
- Infinite scroll or pagination

#### Detail Screen
- Hero image
- Title and provider
- Price display
- Discount badge (if applicable)
- Description
- Date/time or service type
- Location (for events)
- "Book Now" button (subscription gate)

#### Subscription Gate Modal
- Overlay modal
- Benefits list
- Tier comparison
- "Subscribe Now" CTA
- "Maybe Later" option

#### Payment Screen
- Subscription tier summary
- Price breakdown
- Payment form (card details)
- Secure badge indicators
- "Complete Payment" button

### 7.3 Component Library Suggestions
- React Native Paper
- React Native Elements
- NativeBase
- Custom components (for unique branding)

---

## 8. Non-Functional Requirements

### 8.1 Performance
- App launch time: < 3 seconds
- API response time: < 500ms (average)
- Smooth scrolling at 60fps
- Image loading optimization (lazy loading, caching)

### 8.2 Security
- Password hashing (bcrypt, minimum 10 rounds)
- JWT authentication with expiration
- HTTPS for all API calls
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Rate limiting on API endpoints

### 8.3 Reliability
- Graceful error handling
- Offline capability (cached data viewing)
- Auto-retry for failed requests
- Data persistence in case of app crash

### 8.4 Scalability Considerations
- Database indexing on frequently queried fields
- Connection pooling for database
- Stateless API design
- Pagination for large datasets

---

## 9. Testing Requirements

### 9.1 Testing Scope
While comprehensive testing may be beyond scope for the internship exercise, demonstrate understanding of:

#### Unit Tests
- Discount calculation functions
- Coupon validation logic
- Date/time utilities

#### Integration Tests
- API endpoint functionality
- Database CRUD operations
- Payment flow

#### Manual Testing Checklist
- [ ] User registration and login
- [ ] Event/service listing loads
- [ ] Booking initiation without subscription (should show gate)
- [ ] Subscribe to a tier
- [ ] Book with subscription discount
- [ ] Apply valid coupon code
- [ ] Apply invalid coupon code
- [ ] Payment success flow
- [ ] Payment failure flow
- [ ] Subscription expiry handling

---

## 10. Development Phases

### Phase 1: Foundation (Part 1)
**Time Estimate:** 2-3 hours
- Project setup
- Navigation implementation
- Basic screen layouts
- Folder structure organization

**Deliverables:**
- Navigable app skeleton
- Ability to explain project structure

---

### Phase 2: Data Integration (Part 2)
**Time Estimate:** 3-4 hours
- Backend API setup
- Database schema creation
- Events/services listing with real data
- Loading and error states
- API client implementation

**Deliverables:**
- Working API endpoints
- Dynamic data rendering
- Error handling demonstration

---

### Phase 3: Booking Logic (Part 3)
**Time Estimate:** 4-5 hours
- Booking initiation flow
- Discount calculation engine
- Coupon validation
- Provider redirect logic
- Backend business logic

**Deliverables:**
- Complete booking flow
- Discount calculation explanation
- Coupon system demonstration

---

### Phase 4: Subscription Gating (Part 4)
**Time Estimate:** 2-3 hours
- Subscription status checks
- Access control implementation
- Subscription gate UI
- Tier benefits display

**Deliverables:**
- Functional gating mechanism
- Clear explanation of access control

---

### Phase 5: Payment Integration (Part 5)
**Time Estimate:** 4-6 hours
- Payment gateway integration
- Payment UI components
- Success/failure handling
- Subscription activation logic
- Payment records

**Deliverables:**
- Working payment flow
- Gateway integration explanation
- Error handling for payments

---

### Phase 6: Adaptation (Part 6)
**Time Estimate:** Variable (during demo)
- Live code modifications
- Bug fixes
- Feature additions

**Deliverables:**
- Quick understanding and implementation
- Clean code modifications
- Explanation of changes made

---

## 11. Success Criteria

### 11.1 Technical Competence
- [ ] Can explain all technology choices
- [ ] Understands data flow from app → API → database
- [ ] Can debug issues without AI assistance
- [ ] Can refactor code for clarity

### 11.2 Feature Completeness
- [ ] Navigation works smoothly
- [ ] API integration functional
- [ ] Discount logic correct
- [ ] Subscription gating effective
- [ ] Payment flow operational

### 11.3 Code Quality
- [ ] Clean, readable code
- [ ] Proper error handling
- [ ] Meaningful variable/function names
- [ ] Modular structure
- [ ] Comments where necessary

### 11.4 Adaptability
- [ ] Can modify code quickly during demo
- [ ] Handles requirement changes well
- [ ] Explains trade-offs clearly

---

## 12. Common Pitfalls to Avoid

### 12.1 AI Dependency
❌ **Don't:** Copy-paste AI code without understanding
✅ **Do:** Review, refactor, and understand every line

### 12.2 Over-Engineering
❌ **Don't:** Build complex abstractions prematurely
✅ **Do:** Start simple, refactor when needed

### 12.3 Poor Error Handling
❌ **Don't:** Let app crash on API failures
✅ **Do:** Implement graceful error states with retry options

### 12.4 Hard-Coded Values
❌ **Don't:** Hard-code API URLs, prices, constants
✅ **Do:** Use configuration files and environment variables

### 12.5 Ignoring Edge Cases
❌ **Don't:** Only test happy paths
✅ **Do:** Test expired subscriptions, invalid coupons, network failures

### 12.6 Monolithic Functions
❌ **Don't:** Write 200-line functions
✅ **Do:** Break down into smaller, testable units

---

## 13. Recommended Libraries & Tools

### 13.1 React Native (Mobile)
```json
{
  "navigation": "@react-navigation/native",
  "state management": "Context API or Redux Toolkit",
  "networking": "axios",
  "forms": "react-hook-form",
  "UI components": "react-native-paper or react-native-elements",
  "payment": "@stripe/stripe-react-native"
}
```

### 13.2 Node.js (Backend)
```json
{
  "framework": "express",
  "authentication": "jsonwebtoken, bcrypt",
  "database": "mysql2",
  "validation": "joi or express-validator",
  "environment": "dotenv",
  "logging": "winston or morgan"
}
```

### 13.3 Development Tools
- **API Testing:** Postman or Insomnia
- **Database Management:** MySQL Workbench or DBeaver
- **Version Control:** Git
- **Code Editor:** VS Code with React Native extensions

---

## 14. Documentation Requirements

### 14.1 README.md Must Include
- Project overview
- Setup instructions
- Environment variables needed
- How to run the app
- How to run the backend
- Database setup steps
- Test credentials (for payment gateway)
- Known limitations

### 14.2 Code Comments
- Complex business logic
- Discount calculation formulas
- API endpoint purposes
- Non-obvious design decisions

### 14.3 API Documentation
- All endpoint descriptions
- Request/response examples
- Error codes and meanings

---

## 15. Evaluation Rubric (Expected)

| Criteria | Weight | Excellent | Good | Needs Improvement |
|----------|--------|-----------|------|-------------------|
| **Understanding** | 30% | Explains all code, makes informed decisions | Understands most code, some gaps | Struggles to explain implementation |
| **Code Quality** | 25% | Clean, modular, well-organized | Functional but could be cleaner | Messy or hard to follow |
| **Feature Implementation** | 20% | All parts working correctly | Most features work, minor issues | Significant functionality gaps |
| **Adaptability** | 15% | Quickly handles live changes | Completes changes with some time | Struggles with modifications |
| **Problem Solving** | 10% | Debugs independently, creative solutions | Can debug with hints | Needs significant help |

---

## 16. Final Recommendations

### 16.1 Time Management
- Don't aim for perfection in early parts
- Allocate time for debugging and refactoring
- Leave buffer for Part 6 adaptations

### 16.2 Communication During Demo
- Think out loud when making changes
- Explain your reasoning before coding
- Admit when you're unsure (better than guessing)

### 16.3 Preparation Strategy
1. **Day 1-2:** Parts 1-2 (foundation and data)
2. **Day 3-4:** Parts 3-4 (booking and gating)
3. **Day 5:** Part 5 (payments)
4. **Day 6:** Testing, refactoring, documentation
5. **Day 7:** Practice explanations, prepare for Part 6

### 16.4 What to Prioritize
If time is limited, prioritize in this order:
1. **Understanding** over feature completeness
2. **Clean code** over advanced features
3. **Core flows** (booking, subscription) over nice-to-haves
4. **Error handling** over edge case perfection

---

## 17. Appendix

### 17.1 Sample Data Seeds

#### Events
```sql
INSERT INTO events (title, description, provider, event_date, location, price, category, discount_eligible, provider_discount) VALUES
('Dog Training Workshop', 'Learn basic obedience commands', 'PetPro Training', '2026-03-15 10:00:00', 'Central Park', 50.00, 'training', true, 10),
('Cat Adoption Fair', 'Meet adoptable cats from local shelters', 'Paws Rescue', '2026-03-20 14:00:00', 'Community Center', 0.00, 'adoption', false, 0),
('Pet Photography Session', 'Professional photos of your furry friend', 'SnapPaws Studio', '2026-03-25 09:00:00', 'Studio Downtown', 120.00, 'photography', true, 15);
```

#### Services
```sql
INSERT INTO services (title, description, provider, service_type, price, discount_eligible, provider_discount) VALUES
('Mobile Pet Grooming', 'Full grooming service at your door', 'Paws & Claws', 'grooming', 75.00, true, 5),
('Veterinary House Call', 'Vet visits your home for checkups', 'Dr. Pet Care', 'veterinary', 150.00, true, 0),
('Dog Walking Service', '30-minute walks in your neighborhood', 'Walk & Wag', 'walking', 25.00, true, 10);
```

#### Coupons
```sql
INSERT INTO coupons (code, discount_percentage, valid_from, valid_until, usage_limit, applicable_types) VALUES
('PETS20', 20, '2026-02-01 00:00:00', '2026-12-31 23:59:59', 100, 'all'),
('GROOM10', 10, '2026-02-01 00:00:00', '2026-06-30 23:59:59', 50, 'service'),
('EVENT15', 15, '2026-02-01 00:00:00', '2026-12-31 23:59:59', 200, 'event');
```

### 17.2 Environment Variables Template

```env
# Backend (.env)
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pet_services_app
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=7d

# Payment Gateway (Stripe example)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Other
NODE_ENV=development
```

### 17.3 Quick Start Commands

```bash
# Backend setup
cd backend
npm install
npm run migrate # Run database migrations
npm run seed    # Seed sample data
npm run dev     # Start development server

# Mobile app setup
cd mobile
npm install
npx react-native run-android  # For Android
npx react-native run-ios       # For iOS
```

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 4, 2026 | Initial PRD creation | Claude (AI Assistant) |

---

**End of PRD**

This document serves as the comprehensive blueprint for the Vibe Coding Internship mobile app development exercise. Use it as a reference throughout development and demo preparation.
