# WhatsApp AI Commerce Platform - MVP Plan

## 1. Project Overview

Build a multi-tenant SaaS platform that allows traders, small businesses, and e-commerce sellers to sell products through a WhatsApp AI sales agent without requiring a traditional e-commerce website.

The **primary purchasing channel is WhatsApp**. Customers discover products, ask questions, receive prices, confirm orders, and optionally make payments through an AI-powered WhatsApp conversation.

The web application is primarily for sellers to manage their business, products, orders, customers, WhatsApp connection, and platform settings. Public storefront/product pages can be added for SEO and discovery.

### Core idea

> Give every seller an AI salesperson on WhatsApp that knows their products, prices, availability, and business information.

The AI must never invent prices, stock levels, product details, or order information. It retrieves authoritative information from the seller's database through controlled backend functions.

---

# 2. Main Users

## Seller

A trader or business owner who:

- Creates an account
- Creates their business profile
- Adds products
- Sets prices
- Sets stock quantities
- Adds product images
- Connects their WhatsApp Business account
- Receives customer orders
- Tracks order status
- Views sales and revenue information

## Customer

A buyer who:

- Chats with the seller's WhatsApp AI
- Searches for products conversationally
- Asks questions about products
- Gets accurate prices and availability
- Places an order
- Provides delivery information
- Makes payment when enabled
- Receives order confirmation and updates

## Platform Owner

The SaaS owner/developer who:

- Manages sellers
- Monitors platform activity
- Tracks platform revenue
- Configures transaction fees
- Handles subscriptions or platform billing later
- Monitors WhatsApp/API usage
- Handles abuse, disputes, and system administration

---

# 3. MVP Product Philosophy

The MVP should solve one important problem extremely well:

> A customer should be able to open WhatsApp, talk naturally to an AI sales agent, find a seller's product, see the correct price, place an order, and receive confirmation.

Do not attempt to build a full Jumia-style marketplace initially.

The platform should focus on:

1. Seller onboarding
2. Product/catalog management
3. WhatsApp integration
4. AI product conversations
5. Order creation
6. Payment support
7. Seller order management
8. Platform revenue tracking

---

# 4. Technology Stack

## Frontend / Web Application

### React + TypeScript

Use React with TypeScript and TSX for the frontend.

Reasons:

- Strong type safety
- Better maintainability as the multi-tenant application grows
- Clear component contracts
- Better developer tooling and refactoring support
- React ecosystem compatibility

### Tailwind CSS

Use Tailwind CSS for the UI.

### Axios or native fetch

Use Axios or the native browser `fetch` API for communication with the Express backend.

---

# 5. Backend

## Node.js

Runtime for the backend services.

## Express.js

Use Express for the main API.

The backend will handle:

- Authentication
- Sellers
- Products
- Customers
- Orders
- Payments
- WhatsApp webhooks
- AI orchestration
- Platform fees
- Authorization
- Database operations

---

# 6. Database

## MongoDB

MongoDB will store the application's persistent data.

The application must be designed as a **multi-tenant system** from the beginning.

Every seller-owned resource must be associated with a seller/business identifier.

Example:

```text
Seller A
  ├── Products
  ├── Customers
  ├── Orders
  └── WhatsApp configuration

Seller B
  ├── Products
  ├── Customers
  ├── Orders
  └── WhatsApp configuration
```

Seller A must never be able to access Seller B's data.

The backend must enforce tenant isolation rather than relying only on frontend filtering.

---

# 7. Image Storage

## Cloudinary

Use Cloudinary for:

- Product images
- Seller/business logos
- Optional seller profile images

Do not store large image files directly inside MongoDB.

MongoDB should store the relevant Cloudinary URL and public ID.

---

# 8. WhatsApp Integration

## WhatsApp Business Platform / Cloud API

WhatsApp is the central customer-facing sales channel.

The application will receive customer messages through WhatsApp webhooks and send AI-generated responses back through the WhatsApp Business API.

Basic flow:

```text
Customer
   ↓
WhatsApp
   ↓
WhatsApp Business API
   ↓
Our Webhook
   ↓
Backend
   ↓
AI Agent
   ↓
Database / Tools
   ↓
AI Response
   ↓
WhatsApp Business API
   ↓
Customer
```

Each seller should eventually have their own WhatsApp Business connection.

For the MVP, the WhatsApp onboarding architecture should be designed so that additional sellers can connect independently.

---

# 9. AI

## OpenAI API

The AI acts as a conversational sales agent.

It should be responsible for:

- Understanding customer messages
- Identifying customer intent
- Searching the seller's products
- Answering product questions
- Comparing available products
- Providing accurate prices
- Checking availability
- Collecting order information
- Confirming order details
- Initiating controlled order/payment actions

### Important rule

The AI must not directly manipulate the database.

Instead, expose controlled backend functions/tools such as:

```text
searchProducts()
getProduct()
checkStock()
getBusinessInformation()
createOrder()
getOrder()
calculateOrderTotal()
createPayment()
```

The AI decides when to call an appropriate tool, but the backend remains responsible for validation and authorization.

---

# 10. Example WhatsApp Conversation

Customer:

> Hi, I need a black sneaker around ₦30,000.

AI:

> I found 3 black sneakers within that range. Here are the available options...

Customer:

> How much is the second one?

AI:

> The second sneaker is ₦28,500 and currently has 6 units available.

Customer:

> I want one.

AI:

> Great. I'll need your name, phone number, and delivery address.

Customer provides details.

AI:

> Your order is:
>
> Black Classic Sneaker
> Quantity: 1
> Price: ₦28,500
>
> Delivery: ₦2,000
> Total: ₦30,500
>
> Would you like to proceed?

Customer:

> Yes.

The backend creates the order and payment process.

---

# 11. Seller Dashboard

The seller dashboard is the main web application.

## MVP Dashboard Sections

### Dashboard

Show:

- Total orders
- Pending orders
- Completed orders
- Total sales
- Recent orders
- Low-stock products

### Products

Seller can:

- Add product
- Edit product
- Delete/deactivate product
- Upload product image
- Set price
- Set stock
- Add description
- Set category
- Mark product as active/inactive

### Orders

Seller can:

- View orders
- View customer information
- View ordered products
- View total amount
- Change order status

Suggested statuses:

```text
Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
```

### Business Settings

Seller can configure:

- Business name
- Description
- Business phone
- Location
- Delivery information
- Payment settings
- WhatsApp connection

---

# 12. Product Model

A product should contain information similar to:

```text
sellerId
name
description
price
currency
stock
category
images
isActive
createdAt
updatedAt
```

Additional fields can be introduced when required.

---

# 13. Order Model

An order should contain:

```text
sellerId
customerId
items
subtotal
deliveryFee
total
paymentStatus
orderStatus
deliveryAddress
customerInformation
createdAt
updatedAt
```

Order items should preserve the price at the time the order was created.

Do not calculate historical order totals using the current product price.

---

# 14. Customer Model

Customers should be associated with the seller/business they interacted with.

Example:

```text
sellerId
name
phone
whatsappId
addresses
createdAt
updatedAt
```

The same WhatsApp customer may exist across different sellers, but seller-specific customer data must remain isolated.

---

# 15. Authentication

Seller authentication should include:

- Registration
- Login
- Logout
- Password hashing
- Protected dashboard routes
- Authentication middleware
- Role/permission checks where required

Never trust seller IDs supplied by the frontend.

The authenticated user's seller/business identity must come from the server-side authentication context.

---

# 16. Multi-Tenant Architecture

This is one of the most important architectural decisions.

Every database query involving seller-owned resources should be scoped to the authenticated seller.

Example concept:

```text
find products
WHERE sellerId = authenticatedSellerId
```

Never:

```text
find product by productId only
```

Instead:

```text
find product by productId AND sellerId
```

This prevents cross-tenant data access.

---

# 17. Payment System

## Paystack

Paystack can be used for customer payments.

The payment architecture should distinguish between:

1. Seller's money
2. Platform's revenue

The platform should not simply treat the seller's entire payment as platform revenue.

For the MVP, design transaction records that clearly track:

```text
orderAmount
platformFee
sellerAmount
paymentProviderFee
currency
paymentReference
paymentStatus
```

The exact settlement/split-payment implementation should be designed according to Paystack's current capabilities and applicable Nigerian payment/business requirements before production launch.

---

# 18. Platform Revenue Model

The platform itself must generate revenue.

There are three possible models.

## Model A - Subscription

Seller pays a fixed recurring fee.

Example:

```text
₦15,000/month
```

Advantages:

- Predictable revenue
- Easy accounting
- Simple mental model

Disadvantage:

- Sellers may hesitate to pay before generating sales.

## Model B - Transaction Fee

The seller pays only when an order is completed.

Example:

```text
Order = ₦50,000
Platform fee = 2%
Platform revenue = ₦1,000
Seller amount = ₦49,000
```

This can be easier to sell to small traders because they only pay when they make money.

## Model C - Hybrid

Use:

```text
Monthly subscription
+
Small transaction fee
```

This can become the long-term business model.

### MVP recommendation

Start with a transaction-based model or a low-cost/free entry tier with a transaction fee.

The architecture should support both transaction fees and subscriptions later without requiring a major rewrite.

---

# 19. Platform Revenue Tracking

Create a dedicated financial/transaction record for every completed payment.

The platform should be able to calculate:

```text
Gross sales
Platform fees
Seller earnings
Payment fees
Net platform revenue
```

Example:

```text
Customer pays:       ₦100,000
Platform fee:          ₦2,000
Seller amount:        ₦98,000
```

The exact percentage should be configurable rather than hardcoded.

---

# 20. Public Storefront and SEO

The customer does not need to use the website to purchase.

However, public storefront pages can help sellers get discovered through search engines.

Example:

```text
yourplatform.com/store/john-sneakers
yourplatform.com/store/john-sneakers/product/black-runner
```

These pages can contain:

- Seller information
- Product information
- Product images
- Prices
- Availability
- A prominent "Order on WhatsApp" action

The website therefore becomes a discovery/SEO channel while WhatsApp remains the primary purchasing interface.

---

# 21. Core MVP Customer Flow

```text
Customer discovers seller
        ↓
Opens WhatsApp
        ↓
Sends message
        ↓
WhatsApp webhook receives message
        ↓
Backend identifies seller
        ↓
AI understands request
        ↓
AI searches seller's catalog
        ↓
Backend returns authoritative product data
        ↓
AI responds to customer
        ↓
Customer selects product
        ↓
AI collects order information
        ↓
Backend validates order
        ↓
Order is created
        ↓
Payment is initiated
        ↓
Customer pays
        ↓
Payment webhook confirms payment
        ↓
Order becomes paid
        ↓
Seller sees order in dashboard
        ↓
Seller fulfills order
```

---

# 22. Recommended Building Process

Do not build everything simultaneously.

Build vertically from the core business flow.

## Phase 1 - Project Foundation

Set up:

- Git repository
- React + TypeScript + Vite application
- Tailwind CSS
- Express backend
- MongoDB
- Environment variables
- Basic project structure
- Authentication architecture
- Error handling
- API conventions

---

## Phase 2 - Seller Authentication

Build:

- Seller registration
- Login
- Logout
- Protected dashboard
- Seller/business model
- Authentication middleware

Success condition:

> A seller can securely create an account and access their dashboard.

---

## Phase 3 - Product Management

Build:

- Product creation
- Product editing
- Product deletion/deactivation
- Product listing
- Product search
- Stock management
- Cloudinary image upload

Success condition:

> A seller can completely manage their catalog.

---

## Phase 4 - Order Management

Build:

- Customer model
- Order model
- Order creation
- Order listing
- Order details
- Order status management

Initially, orders can be created through a backend test endpoint before WhatsApp is connected.

Success condition:

> A seller can see and manage real order records.

---

## Phase 5 - WhatsApp Integration

Connect:

- WhatsApp Business API
- Webhook verification
- Incoming messages
- Outgoing messages
- Seller identification
- Message logging

First implement deterministic responses before adding AI.

Success condition:

> A customer can send a WhatsApp message and receive a response from the platform.

---

# 23. Phase 6 - AI Sales Agent

Add OpenAI integration.

Implement controlled tools:

```text
searchProducts
getProduct
checkStock
getBusinessInfo
createOrder
calculateOrderTotal
```

The AI should have access only to the current seller's data.

Success condition:

> A customer can have a natural conversation with the AI and successfully create an order.

---

# 24. Phase 7 - Payments

Integrate Paystack.

Build:

- Payment initialization
- Payment reference
- Payment status
- Payment webhook
- Order/payment reconciliation
- Platform fee calculation
- Seller amount calculation

Success condition:

> Customer can pay for a WhatsApp order and the system correctly records the payment.

---

# 25. Phase 8 - Platform Revenue

Implement:

- Configurable transaction fee
- Platform transaction records
- Seller earnings
- Platform earnings
- Revenue dashboard
- Payment reconciliation

Success condition:

> Every successful transaction clearly shows how much belongs to the seller and how much belongs to the platform.

---

# 26. Phase 9 - Public Storefront

Add optional SEO-friendly public storefront pages using the React/Vite frontend.

Build:

- Seller storefront
- Product pages
- SEO metadata
- Open Graph metadata
- Product sharing
- "Order on WhatsApp" buttons

This is useful for Google/social discovery but is not the primary checkout interface.

---

# 27. Phase 10 - Production Hardening

Before public launch, implement:

- Rate limiting
- Input validation
- Request size limits
- Secure authentication
- Secure cookies/tokens
- CORS configuration
- Webhook signature verification
- Payment webhook verification
- Database indexes
- Structured logging
- Error monitoring
- Idempotency for payment/order operations
- Tenant isolation tests
- AI tool authorization
- Abuse protection
- Backup strategy

---

# 28. Suggested API Structure

```text
/api/auth
/api/sellers
/api/products
/api/orders
/api/customers
/api/payments
/api/whatsapp
/api/webhooks
/api/platform
```

Example:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id

GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status

POST   /api/payments/initialize
GET    /api/payments/:reference

POST   /api/webhooks/whatsapp
POST   /api/webhooks/paystack
```

---

# 29. Security Principles

The project will handle:

- Customer information
- Seller information
- Payment information
- WhatsApp identifiers
- Business information

Therefore:

- Validate all input
- Authenticate every private request
- Authorize every resource access
- Enforce seller ownership at the database/query layer
- Never expose secrets to React/Vite client code
- Keep API keys in environment variables
- Verify webhooks
- Do not trust AI-generated values
- Recalculate totals on the server
- Validate stock on the server
- Make payment/order operations idempotent
- Log important security events

---

# 30. AI Safety and Data Integrity

The AI should be treated as an interface, not the source of truth.

### Bad architecture

```text
Customer
   ↓
AI
   ↓
AI decides price
   ↓
Order
```

### Correct architecture

```text
Customer
   ↓
AI
   ↓
Backend tool
   ↓
Database
   ↓
Validated result
   ↓
AI
   ↓
Customer
```

The AI can understand language and decide which tool to call, but the backend determines what is actually true.

---

# 31. MVP Scope

## Must Have

- Seller registration/login
- Multi-tenant seller architecture
- Seller dashboard
- Business profile
- Product CRUD
- Product images
- Product prices
- Stock management
- Orders
- Customers
- WhatsApp Business API
- WhatsApp webhook
- AI product assistant
- Product search through AI
- Accurate pricing
- Stock checking
- Order creation
- Basic payment integration
- Platform transaction fee tracking

## Nice to Have Later

- Public SEO storefront
- Seller analytics
- Discounts
- Coupons
- Product variants
- Delivery integrations
- Multiple WhatsApp numbers
- Automated order updates
- Customer broadcast campaigns
- Abandoned cart recovery
- AI sales analytics
- AI-generated product descriptions
- Seller subscriptions
- Advanced platform analytics
- Mobile application

---

# 32. Things NOT to Build Initially

Avoid:

- Native mobile apps
- Full marketplace
- Complex recommendation algorithms
- Social features
- Advanced inventory management
- Complex accounting
- Multiple payment providers
- Multiple delivery providers
- AI voice calls
- Sophisticated analytics
- Complicated seller tiers

The MVP should prove one thing:

> Can a seller make real sales through an AI-powered WhatsApp conversation?

---

# 33. Initial Project Architecture

```text
whatsapp-commerce/
│
├── web/
│   ├── src/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── ...
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── ai/
│   │   ├── whatsapp/
│   │   ├── payments/
│   │   └── cloudinary/
│   ├── utils/
│   └── index.js
│
├── .gitignore
├── README.md
└── package.json
```

The AI, WhatsApp, payment, and storage integrations should be isolated into services rather than placing third-party API logic throughout controllers.

---

# 34. Development Milestones

### Milestone 1

Seller can register and log in.

### Milestone 2

Seller can create and manage products.

### Milestone 3

Seller can see orders.

### Milestone 4

WhatsApp can receive and send messages.

### Milestone 5

AI can search products and answer product questions.

### Milestone 6

AI can create an order.

### Milestone 7

Customer can pay.

### Milestone 8

Seller can fulfill the order.

### Milestone 9

Platform records its transaction fee.

### Milestone 10

Test with real small businesses.

---

# 35. Success Criteria for the MVP

The MVP is successful when this complete flow works reliably:

```text
Seller signs up
      ↓
Adds products and prices
      ↓
Connects WhatsApp
      ↓
Customer opens WhatsApp
      ↓
Customer asks for a product
      ↓
AI finds the correct product
      ↓
AI gives the correct price
      ↓
Customer orders
      ↓
AI collects required information
      ↓
Backend creates order
      ↓
Customer pays
      ↓
Payment is verified
      ↓
Seller receives order
      ↓
Platform records its fee
```

If this works reliably for real sellers and real customers, the core business has been validated.

---

# 36. Long-Term Vision

The long-term product can become a complete conversational commerce platform for small businesses.

Instead of requiring every trader to build:

- A website
- A mobile app
- A customer support team
- A sales team
- An inventory interface
- A payment system

the platform provides these capabilities through one system, with WhatsApp as the primary customer interface.

The seller's experience becomes:

```text
Add products
      ↓
Connect WhatsApp
      ↓
AI becomes the sales agent
      ↓
Customers chat
      ↓
Orders arrive
      ↓
Payments are collected
      ↓
Seller fulfills orders
      ↓
Platform earns a transaction fee
```

The most important principle throughout development is:

> **Build the smallest system that can reliably turn a WhatsApp conversation into a paid order.**
