# 🔌 Complete API Integration Guide

This guide explains how to integrate both frontend applications (Abhaya Hasta and Gaithri) with their respective backend APIs.

## 🏗️ Architecture

```
Frontend Apps (React)          Backend APIs (Node.js)         Database
─────────────────────         ──────────────────────         ────────
Abhaya Hasta UI    ──────►    Abhaya Hasta API    ──────►   PostgreSQL
(localhost:5174)               (localhost:3000)              (localhost:5432)

Gaithri Dashboard  ──────►    Gaithri Admin API   ──────►   PostgreSQL
(localhost:5173)               (localhost:3002)              (localhost:5432)
```

## 📡 **API Service Files Created**

### **Abhaya Hasta (Consumer App)**

**Location**: `culture-path-skeleton/src/services/api.js`

**Usage Example:**

```javascript
import api from "@/services/api";

// Login user
const handleLogin = async (phone, password) => {
  try {
    const response = await api.auth.login({ phone, password });
    localStorage.setItem("authToken", response.token);
    console.log("Logged in:", response.user);
  } catch (error) {
    console.error("Login failed:", error);
  }
};

// Get temples
const fetchTemples = async () => {
  try {
    const temples = await api.temple.getAll({ city: "Bangalore" });
    console.log("Temples:", temples);
  } catch (error) {
    console.error("Failed to fetch temples:", error);
  }
};

// Create booking
const createBooking = async (bookingData) => {
  try {
    const booking = await api.booking.create(bookingData);
    console.log("Booking created:", booking);
  } catch (error) {
    console.error("Booking failed:", error);
  }
};
```

### **Gaithri (Admin Dashboard)**

**Location**: `sacred-ops-dashboard/src/services/api.ts`

**Usage Example:**

```typescript
import api from "@/services/api";

// Admin login
const handleAdminLogin = async (username: string, password: string) => {
  try {
    const response = await api.auth.login({ username, password });
    localStorage.setItem("adminToken", response.token);
    console.log("Admin logged in:", response.admin);
  } catch (error) {
    console.error("Login failed:", error);
  }
};

// Get dashboard metrics
const fetchMetrics = async () => {
  try {
    const metrics = await api.dashboard.getMetrics();
    console.log("Dashboard metrics:", metrics);
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
  }
};

// Create event
const createEvent = async (eventData: any) => {
  try {
    const event = await api.events.create(eventData);
    console.log("Event created:", event);
  } catch (error) {
    console.error("Failed to create event:", error);
  }
};
```

## 🔐 **Authentication Integration**

### **Abhaya Hasta (Consumer)**

**1. Login Flow:**

```javascript
import { authAPI } from "@/services/api";

// Step 1: Login
const loginUser = async () => {
  const response = await authAPI.login({
    phone: "9876543210",
    password: "userpassword",
  });

  // Store token
  localStorage.setItem("authToken", response.token);
  localStorage.setItem("user", JSON.stringify(response.user));
};

// Step 2: Use token in subsequent requests
// The api.js automatically adds the token from localStorage
```

**2. Registration Flow:**

```javascript
// Register new user
const registerUser = async () => {
  const response = await authAPI.register({
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    password: "password123",
  });

  // OTP will be sent
  console.log("OTP sent:", response.message);
};

// Verify OTP
const verifyOTP = async (otp) => {
  const response = await authAPI.verifyOTP({
    phone: "9876543210",
    otp: otp,
  });

  // Store token after verification
  localStorage.setItem("authToken", response.token);
};
```

### **Gaithri (Admin)**

**Admin Login:**

```typescript
import { authAPI } from "@/services/api";

const loginAdmin = async () => {
  const response = await authAPI.login({
    username: "admin",
    password: "admin123",
  });

  // Store admin token
  localStorage.setItem("adminToken", response.token);
  localStorage.setItem("admin", JSON.stringify(response.admin));
};
```

## 🛕 **Temple Discovery Integration**

### **Abhaya Hasta**

```javascript
import { templeAPI } from "@/services/api";

// Get all temples
const temples = await templeAPI.getAll();

// Search temples by location
const bangaloreTemples = await templeAPI.getAll({
  city: "Bangalore",
  category: "Ganapathi",
});

// Get specific temple
const temple = await templeAPI.getById(1);

// Find nearby temples
const nearbyTemples = await templeAPI.getNearby(12.9716, 77.5946, 10);

// Get temple categories
const categories = await templeAPI.getCategories();
```

## 📅 **Booking System Integration**

### **Abhaya Hasta**

```javascript
import { bookingAPI, paymentAPI } from "@/services/api";

// Create booking
const createBooking = async () => {
  // Step 1: Create booking
  const booking = await bookingAPI.create({
    temple_id: 1,
    service_name: "Ganapathi Homam",
    booking_date: "2024-10-15",
    time_slot: "10:00 AM",
    devotee_name: "John Doe",
    devotee_phone: "9876543210",
    payment_amount: 500,
  });

  // Step 2: Create payment order
  const paymentOrder = await paymentAPI.createOrder({
    booking_id: booking.id,
    amount: 500,
  });

  // Step 3: Process payment with Razorpay
  // (Integrate Razorpay checkout here)

  // Step 4: Verify payment
  const verified = await paymentAPI.verifyPayment({
    razorpay_order_id: paymentOrder.order_id,
    razorpay_payment_id: "payment_xyz",
    razorpay_signature: "signature_xyz",
  });
};

// Get user bookings
const myBookings = await bookingAPI.getAll();

// Cancel booking
await bookingAPI.cancel(bookingId);

// Get QR code for booking
const qrCode = await bookingAPI.getQRCode(bookingId);
```

## 📊 **Dashboard Integration**

### **Gaithri**

```typescript
import { dashboardAPI } from "@/services/api";

// Get key metrics
const metrics = await dashboardAPI.getMetrics();
// Returns: { totalRevenue, totalVisitors, activeEvents, totalBookings, etc. }

// Get revenue data
const revenueData = await dashboardAPI.getRevenue({
  period: "monthly",
  start_date: "2024-01-01",
  end_date: "2024-12-31",
});

// Get visitor analytics
const visitorData = await dashboardAPI.getVisitors({ period: "weekly" });

// Get community metrics
const communityStats = await dashboardAPI.getCommunity();
```

## 🎉 **Event Management Integration**

### **Gaithri**

```typescript
import { eventAPI } from "@/services/api";

// Get all events
const events = await eventAPI.getAll();

// Create new event
const newEvent = await eventAPI.create({
  name: "Diwali Celebration",
  description: "Grand Diwali festival",
  event_date: "2024-10-28",
  start_time: "18:00",
  end_time: "21:00",
  max_participants: 100,
  registration_fee: 100,
});

// Update event
await eventAPI.update(eventId, {
  name: "Updated Event Name",
  max_participants: 150,
});

// Get event bookings
const attendees = await eventAPI.getBookings(eventId);

// Cancel event
await eventAPI.delete(eventId);
```

## 🛍️ **Store Integration**

### **Abhaya Hasta (Consumer)**

```javascript
import { storeAPI } from "@/services/api";

// Get products
const products = await storeAPI.getProducts({ category: "Puja Items" });

// Add to cart
await storeAPI.addToCart(productId, 2);

// Get cart
const cart = await storeAPI.getCart();

// Create order
const order = await storeAPI.createOrder({
  items: [{ product_id: 1, quantity: 2 }],
  delivery_address_id: 1,
  payment_method: "razorpay",
});
```

### **Gaithri (Admin)**

```typescript
import { storeManagementAPI } from "@/services/api";

// Create product
const product = await storeManagementAPI.createProduct({
  name: "Kumkum Powder",
  category: "Puja Items",
  price: 50,
  stock_quantity: 100,
});

// Update inventory
await storeManagementAPI.updateInventory(productId, 150);

// Get orders
const orders = await storeManagementAPI.getOrders();

// Update order status
await storeManagementAPI.updateOrderStatus(orderId, "shipped");
```

## 📚 **Class Enrollment Integration**

### **Abhaya Hasta (Consumer)**

```javascript
import { classAPI } from "@/services/api";

// Get available classes
const classes = await classAPI.getAll({ temple_id: 1 });

// Enroll in class
const enrollment = await classAPI.enroll(classId, {
  student_name: "John Doe",
  student_phone: "9876543210",
  student_age: 25,
});

// Get my enrollments
const myClasses = await classAPI.getMyEnrollments();
```

### **Gaithri (Admin)**

```typescript
import { classManagementAPI } from "@/services/api";

// Create class
const newClass = await classManagementAPI.create({
  name: "Vedic Chanting",
  description: "Learn Sanskrit mantras",
  schedule: "Every Saturday 10 AM",
  max_students: 30,
  duration_weeks: 12,
  fees: 2000,
});

// Get enrollments
const enrollments = await classManagementAPI.getEnrollments(classId);

// Approve enrollment
await classManagementAPI.approveEnrollment(classId, enrollmentId);
```

## 💳 **Payment Integration**

### **Razorpay Integration Example**

```javascript
import { paymentAPI } from "@/services/api";

const processPayment = async (bookingData) => {
  // 1. Create order in backend
  const order = await paymentAPI.createOrder({
    booking_id: bookingData.id,
    amount: bookingData.amount,
  });

  // 2. Initialize Razorpay checkout
  const options = {
    key: "rzp_test_1234567890",
    amount: order.amount,
    currency: "INR",
    order_id: order.razorpay_order_id,
    name: "Temple Services",
    description: bookingData.service_name,
    handler: async function (response) {
      // 3. Verify payment
      try {
        const verified = await paymentAPI.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (verified.success) {
          alert("Payment successful!");
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
      }
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};
```

## 🔧 **Environment Configuration**

### **Abhaya Hasta (.env)**

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY=rzp_test_1234567890
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

### **Gaithri (.env)**

```env
VITE_API_BASE_URL=http://localhost:3002/api
```

## 🧪 **Testing API Integration**

### **Test in Browser Console**

**Abhaya Hasta:**

```javascript
// Import the API service
import api from "./src/services/api.js";

// Test temple fetch
api.temple.getAll().then((temples) => console.log("Temples:", temples));

// Test with authentication
api.auth
  .login({ phone: "9876543210", password: "test123" })
  .then((response) => {
    localStorage.setItem("authToken", response.token);
    return api.booking.getAll();
  })
  .then((bookings) => console.log("My bookings:", bookings));
```

**Gaithri Dashboard:**

```typescript
// Import the API service
import api from "./src/services/api";

// Test admin login
api.auth
  .login({ username: "admin", password: "admin123" })
  .then((response) => {
    localStorage.setItem("adminToken", response.token);
    return api.dashboard.getMetrics();
  })
  .then((metrics) => console.log("Dashboard metrics:", metrics));
```

## 📝 **Complete API Endpoints Reference**

### **Abhaya Hasta Backend (localhost:3000/api)**

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/forgot-password` - Reset password

#### Temples

- `GET /temples` - Get all temples (with filters)
- `GET /temples/:id` - Get temple details
- `GET /temples/nearby` - Find nearby temples
- `GET /temples/categories` - Get categories
- `GET /temples/:id/services` - Get temple services

#### Bookings

- `POST /bookings` - Create booking
- `GET /bookings` - Get user bookings
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/cancel` - Cancel booking
- `GET /bookings/:id/qr` - Get QR code

#### Payments

- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Payment history
- `POST /payments/refund` - Request refund

#### User Profile

- `GET /users/profile` - Get profile
- `PUT /users/profile` - Update profile
- `GET /users/addresses` - Get addresses
- `POST /users/addresses` - Add address
- `PUT /users/addresses/:id` - Update address
- `DELETE /users/addresses/:id` - Delete address

#### Classes

- `GET /classes` - Get all classes
- `GET /classes/:id` - Get class details
- `POST /classes/:id/enroll` - Enroll in class
- `GET /classes/my-enrollments` - Get enrollments

#### Store

- `GET /store/products` - Get products
- `GET /store/products/:id` - Get product details
- `POST /store/cart/add` - Add to cart
- `GET /store/cart` - Get cart
- `PUT /store/cart/:id` - Update cart item
- `DELETE /store/cart/:id` - Remove from cart
- `POST /store/orders` - Create order
- `GET /store/orders` - Get orders

#### Subscriptions

- `GET /subscriptions/plans` - Get subscription plans
- `POST /subscriptions/subscribe` - Subscribe to plan
- `GET /subscriptions/my-subscriptions` - Get subscriptions
- `PUT /subscriptions/:id/cancel` - Cancel subscription

#### Pujas

- `GET /pujas/categories` - Get puja categories
- `GET /pujas/category/:category` - Get pujas by category
- `GET /pujas/:id` - Get puja details

### **Gaithri Backend (localhost:3002/api)**

#### Admin Authentication

- `POST /auth/login` - Admin login
- `POST /auth/create-admin` - Create admin
- `GET /auth/me` - Get admin profile

#### Dashboard

- `GET /dashboard/metrics` - Key metrics
- `GET /dashboard/revenue` - Revenue analytics
- `GET /dashboard/visitors` - Visitor analytics
- `GET /dashboard/community` - Community stats
- `GET /dashboard/recent-activity` - Recent activity

#### Events

- `GET /events` - Get all events
- `POST /events` - Create event
- `GET /events/:id` - Get event details
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `GET /events/:id/bookings` - Get event bookings
- `PUT /events/:id/status` - Update event status

#### Temple Management

- `GET /temples` - Get temples
- `GET /temples/:id` - Get temple details
- `PUT /temples/:id` - Update temple
- `PUT /temples/:id/timings` - Update timings
- `PUT /temples/:id/services` - Update services

#### Rituals

- `GET /rituals` - Get rituals
- `POST /rituals` - Create ritual
- `PUT /rituals/:id` - Update ritual
- `DELETE /rituals/:id` - Delete ritual

#### Vendors

- `GET /vendors` - Get vendors
- `POST /vendors` - Create vendor
- `PUT /vendors/:id` - Update vendor
- `DELETE /vendors/:id` - Delete vendor

#### User Management

- `GET /users` - Get users
- `GET /users/:id` - Get user details
- `PUT /users/:id/status` - Update user status
- `GET /users/:id/bookings` - Get user bookings

#### Store Management

- `GET /store/products` - Get products
- `POST /store/products` - Create product
- `PUT /store/products/:id` - Update product
- `DELETE /store/products/:id` - Delete product
- `PUT /store/products/:id/inventory` - Update inventory
- `GET /store/orders` - Get orders
- `PUT /store/orders/:id/status` - Update order status

#### Class Management

- `GET /classes` - Get classes
- `POST /classes` - Create class
- `PUT /classes/:id` - Update class
- `DELETE /classes/:id` - Delete class
- `GET /classes/:id/enrollments` - Get enrollments
- `PUT /classes/:classId/enrollments/:enrollmentId/approve` - Approve enrollment

## 🚀 **Quick Integration Checklist**

### **Abhaya Hasta Frontend**

- [x] API service file created at `src/services/api.js`
- [ ] Import API service in components
- [ ] Replace mock data with API calls
- [ ] Add error handling and loading states
- [ ] Test authentication flow
- [ ] Test temple search and booking
- [ ] Test payment processing

### **Gaithri Dashboard Frontend**

- [x] API service file created at `src/services/api.ts`
- [ ] Import API service in components
- [ ] Replace mock data with API calls
- [ ] Add error handling and loading states
- [ ] Test admin login
- [ ] Test dashboard metrics
- [ ] Test event management

## 💡 **Best Practices**

### **Error Handling**

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.temple.getAll();
    setTemples(data);
  } catch (error) {
    setError(error.message);
    // Show error notification to user
  } finally {
    setLoading(false);
  }
};
```

### **Loading States**

```javascript
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.temple.getAll();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

### **Token Management**

```javascript
// Save token after login
const handleLogin = async (credentials) => {
  const response = await api.auth.login(credentials);
  localStorage.setItem("authToken", response.token);
  localStorage.setItem("user", JSON.stringify(response.user));
};

// Clear token on logout
const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  // Redirect to login page
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};
```

## 🔗 **Integration Steps**

### **Step 1: Update Component to Use API**

**Before (Mock Data):**

```javascript
const temples = [
  { id: 1, name: "Temple 1" },
  { id: 2, name: "Temple 2" },
];
```

**After (Real API):**

```javascript
import { templeAPI } from "@/services/api";

const [temples, setTemples] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchTemples = async () => {
    try {
      const data = await templeAPI.getAll();
      setTemples(data);
    } catch (error) {
      console.error("Failed to fetch temples:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchTemples();
}, []);
```

### **Step 2: Handle Authentication**

```javascript
import { authAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async (phone, password) => {
    try {
      const response = await authAPI.login({ phone, password });
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/home');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    // Login form JSX
  );
};
```

### **Step 3: Protect Routes**

```javascript
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("authToken");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Usage in App.jsx
<Route
  path="/bookings"
  element={
    <ProtectedRoute>
      <MyBookings />
    </ProtectedRoute>
  }
/>;
```

## 🎯 **Complete Integration Example**

### **Temple Detail Page with Booking**

```javascript
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { templeAPI, bookingAPI, paymentAPI } from "@/services/api";

const TempleDetailPage = () => {
  const { id } = useParams();
  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemple = async () => {
      try {
        const data = await templeAPI.getById(id);
        setTemple(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemple();
  }, [id]);

  const handleBooking = async (serviceData) => {
    try {
      // Create booking
      const booking = await bookingAPI.create({
        temple_id: id,
        ...serviceData,
      });

      // Process payment
      const order = await paymentAPI.createOrder({
        booking_id: booking.id,
        amount: serviceData.amount,
      });

      // Show Razorpay checkout
      // ... Razorpay integration code

      alert("Booking successful!");
    } catch (error) {
      alert("Booking failed: " + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{temple.name}</h1>
      <p>{temple.description}</p>
      {/* Temple services and booking form */}
    </div>
  );
};
```

---

**🎉 Complete API integration layer is ready for both applications!**

All API endpoints are properly documented and integrated with type-safe service layers for seamless frontend-backend communication.
