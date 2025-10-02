# Frontend API Migration Guide

## Overview
This document outlines the migration from hardcoded data and localStorage to API-based data management.

## Changes Summary

### 1. Backend APIs Implemented
- **Rituals/Pujas API** (`/api/rituals`)
  - GET `/rituals/categories` - Get ritual categories
  - GET `/rituals` - Get all rituals with filtering
  - GET `/rituals/:id` - Get ritual by ID
  - GET `/rituals/category/:category` - Get rituals by category
  - GET `/rituals/:ritual_id/packages` - Get ritual packages
  - POST `/rituals/bookings` - Create ritual booking
  - GET `/rituals/bookings/my-bookings` - Get user's ritual bookings

- **Store API** (`/api/store`)
  - GET `/store/items` - Get store items
  - GET `/store/items/:id` - Get item by ID
  - GET `/store/categories` - Get store categories
  - GET `/store/cart` - Get user's cart (DB-backed)
  - POST `/store/cart` - Add to cart
  - PUT `/store/cart/:id` - Update cart item
  - DELETE `/store/cart/:id` - Remove from cart
  - DELETE `/store/cart` - Clear cart
  - POST `/store/orders` - Create order
  - GET `/store/orders` - Get user's orders
  - GET `/store/orders/:id` - Get order by ID

### 2. Frontend Service Files Created
- `src/services/ritualsApi.js` - Rituals/Pujas API service
- `src/services/storeApi.js` - Store API service
- Updated `src/services/index.js` to export new services

### 3. localStorage Usage - KEEP ONLY FOR:
- **Draft states** (temporary form data during multi-step flows)
  - `enrollment-draft` - Class enrollment draft
  - `puja-booking-draft` - Puja booking draft
- **UI preferences** (user settings, not business data)
  - `user-preferences` - UI theme, language preferences
- **PWA settings** (installation prompts)
- **Auth tokens** (managed by apiClient)

### 4. localStorage Usage - REMOVE/MIGRATE TO API:
- ❌ `temple-basket` → Use `/store/cart` API
- ❌ `temple-bookings` → Use `/bookings` API
- ❌ `puja-bookings` → Use `/rituals/bookings` API
- ❌ `class-subscriptions` → Use `/classes/:id/enroll` API
- ❌ `temple-favorites` → Use `/temples/favorites` API
- ❌ `learning-progress` → Use backend learning progress API (to be implemented)
- ❌ `gamification-data` → Use backend gamification API (to be implemented)

### 5. Data Files - Migration Strategy
Instead of deleting hardcoded data files, use them as:
- **Type definitions** for TypeScript/JSDoc
- **Fallback data** for offline mode
- **Mock data** for development/testing

Update imports:
```javascript
// OLD - Hardcoded
import { pujaCategories } from '../data/pujaCategories';

// NEW - API-based
import { ritualsApi } from '../services';
const [pujaCategories, setPujaCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const categories = await ritualsApi.getCategories();
      setPujaCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Optionally use fallback hardcoded data
    }
  };
  fetchCategories();
}, []);
```

## Pages to Refactor

### High Priority (Core Functionality)
1. ✅ **PujaBookingDetails.jsx** - Use ritualsApi for packages, catering, add-ons
2. **ClassEnrollmentStepper.jsx** - Use classesApi for class data and enrollment
3. **TempleDetails.jsx** - Use templesApi for temple data, services, events
4. **Basket.jsx** - Use cartApi for cart management
5. **Store.jsx** - Use storeApi for products
6. **MyBookings.jsx** - Use bookingsApi for all bookings
7. **MySubscriptions.jsx** - Use API for subscriptions

### Medium Priority
8. **ExploreTemples.jsx** - Use templesApi
9. **Classes.jsx** - Use classesApi
10. **Home.jsx** - Use various APIs for dashboard data

### Low Priority (Minimal changes needed)
11. **Login.jsx**, **OTP.jsx** - Already using authApi
12. **Profile pages** - Already using userApi

## Implementation Steps

### Step 1: Update Package Data Sources
Since packages, catering, and add-ons might not be in DB yet, we have two options:

**Option A: Store in Database**
- Create tables: `ritual_packages`, `catering_options`, `addon_services`
- Migrate hardcoded data to DB
- Fetch via API

**Option B: Keep as Configuration**
- Move to backend as configuration files
- Return via API endpoints
- Easier to update without DB changes

**Recommended: Option B** (faster implementation)

### Step 2: Update Cart/Basket System
```javascript
// OLD - localStorage
import { getBasket, addToBasket, removeFromBasket } from '../utils/localStorage';

// NEW - API
import { cartApi } from '../services';

// Add to cart
await cartApi.addToCart(itemId, quantity);

// Get cart
const cart = await cartApi.getCart();

// Update quantity
await cartApi.updateCartItem(cartItemId, newQuantity);

// Remove item
await cartApi.removeFromCart(cartItemId);
```

### Step 3: Update Bookings System
```javascript
// OLD - localStorage
import { addBooking, getBookings } from '../utils/localStorage';

// NEW - API
import { bookingsApi, ritualsApi } from '../services';

// Temple service booking
await bookingsApi.createBooking(bookingData);

// Ritual/Puja booking
await ritualsApi.createBooking(bookingData);

// Get all bookings
const bookings = await bookingsApi.getMyBookings();
const ritualBookings = await ritualsApi.getMyBookings();
```

## Testing Checklist

### Functionality Tests
- [ ] User can browse rituals/pujas from API
- [ ] User can create ritual booking via API
- [ ] User can add items to cart (DB-backed)
- [ ] Cart persists across sessions
- [ ] User can create orders from cart
- [ ] User can view order history
- [ ] Temple browsing works from API
- [ ] Class enrollment works via API
- [ ] Booking creation and retrieval works

### Data Migration Tests
- [ ] Existing localStorage data migrated/cleared
- [ ] No data loss during migration
- [ ] Offline mode gracefully handled
- [ ] Error states properly displayed

### Performance Tests
- [ ] API calls optimized (no unnecessary fetches)
- [ ] Loading states shown during API calls
- [ ] Caching implemented where appropriate

## Rollback Plan
If issues occur:
1. Keep hardcoded data files intact
2. Add feature flag to toggle API vs localStorage
3. Gradual rollout per feature/page

## Environment Variables
Ensure these are set:
```env
VITE_API_BASE_URL=http://localhost:3002/api  # gaithri-backend port
```

## Notes
- Draft states in localStorage are ACCEPTABLE (temporary UI state)
- Business data MUST go through API/DB
- Always handle API errors gracefully with user feedback
- Consider implementing offline mode with service workers later
