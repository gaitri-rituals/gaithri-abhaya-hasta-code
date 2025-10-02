# 🚀 Quick Start - API Integration

## TL;DR - What Changed

**Before:** Hardcoded data in `/src/data/` files + localStorage for everything  
**After:** API endpoints + DB storage + localStorage only for drafts/UI state

## ✅ What's Ready to Use

### Backend APIs (Port 3002)
```bash
# Rituals/Pujas
GET /api/rituals/packages-config      # Package types (basic, advance, premium)
GET /api/rituals/catering-config      # Catering options
GET /api/rituals/addons-config        # Add-on services

# Store & Cart
GET  /api/store/items                 # All products
GET  /api/store/cart                  # User's cart (DB-backed)
POST /api/store/cart                  # Add to cart
PUT  /api/store/cart/:id              # Update quantity
DELETE /api/store/cart/:id            # Remove item
```

### Frontend Services
```javascript
import { ritualsApi, storeApi } from '../services';

// Fetch configurations
const packages = await ritualsApi.getPackageConfigurations();
const catering = await ritualsApi.getCateringConfigurations();
const addons = await ritualsApi.getAddOnServicesConfigurations();

// Cart operations
await storeApi.addToCart(itemId, quantity);
const cart = await storeApi.getCart();
```

## 🔨 How to Refactor a Page (5 Steps)

### Example: PujaBookingDetails.jsx

**Step 1:** Add imports
```javascript
import { useState, useEffect } from 'react';
import { ritualsApi } from '../services';
import { toast } from 'sonner';
```

**Step 2:** Add state
```javascript
const [pujaPackages, setPujaPackages] = useState({});
const [loading, setLoading] = useState(true);
```

**Step 3:** Fetch on mount
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const packages = await ritualsApi.getPackageConfigurations();
      setPujaPackages(packages);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**Step 4:** Add loading state
```javascript
if (loading) return <div>Loading...</div>;
```

**Step 5:** Use fetched data
```javascript
// Replace: Object.entries(pujaPackages).map(...)
// With: Object.entries(pujaPackages || {}).map(...)
```

## 📋 Pages to Update

### High Priority (Core Features)
1. ✅ Backend APIs created
2. ✅ Frontend services created
3. ⏳ **PujaBookingDetails.jsx** - Use ritualsApi
4. ⏳ **Basket.jsx** - Use storeApi.getCart()
5. ⏳ **TempleDetails.jsx** - Use templesApi
6. ⏳ **Store.jsx** - Use storeApi.getItems()

### Pattern for Each Page
```javascript
// OLD (Hardcoded)
import { data } from '../data/file';
// Use data directly

// NEW (API)
const [data, setData] = useState(null);
useEffect(() => {
  fetchData().then(setData);
}, []);
// Use data from state
```

## 🗂️ localStorage Changes

### ✅ KEEP (UI State & Drafts)
- `authToken` - Auth token
- `refreshToken` - Refresh token  
- `enrollment-draft` - Class enrollment draft
- `puja-booking-draft` - Puja booking draft
- `user-preferences` - UI preferences

### ❌ REMOVE (Use API)
- `temple-basket` → Use `/api/store/cart`
- `temple-bookings` → Use `/api/bookings`
- `puja-bookings` → Use `/api/rituals/bookings`
- `class-subscriptions` → Use `/api/classes/my-enrollments`
- `temple-favorites` → Use `/api/temples/favorites`

## 🏃‍♂️ Quick Test

```bash
# Terminal 1: Start backend
cd backends/gaithri-backend
npm run dev

# Terminal 2: Test API
curl http://localhost:3002/api/rituals/packages-config

# Terminal 3: Start frontend
cd culture-path-skeleton  
npm run dev
```

Open browser: `http://localhost:5173`

## 🔧 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Network Error | Check backend is running on port 3002 |
| 401 Unauthorized | User must be logged in for protected routes |
| Empty data returned | Verify endpoint URL is correct |
| Data still hardcoded | Check imports are using services |

## 📝 Code Snippets

### Replace Hardcoded Packages
```javascript
// Before
import { pujaPackages } from '../data/pujaCategories';

// After
import { ritualsApi } from '../services';
const [pujaPackages, setPujaPackages] = useState({});

useEffect(() => {
  ritualsApi.getPackageConfigurations()
    .then(setPujaPackages)
    .catch(err => console.error(err));
}, []);
```

### Replace localStorage Cart
```javascript
// Before
import { getBasket, addToBasket } from '../utils/localStorage';
const basket = getBasket();
addToBasket(item);

// After
import { storeApi } from '../services';
const cart = await storeApi.getCart();
await storeApi.addToCart(itemId, quantity);
```

### Replace Hardcoded Temples
```javascript
// Before
import { mockTemples } from '../data/temples';
const temple = mockTemples.find(t => t.id === id);

// After
import { templesApi } from '../services';
const temple = await templesApi.getTempleById(id);
```

## 📚 Full Documentation

- **Complete Guide:** `API_REFACTORING_SUMMARY.md`
- **Migration Strategy:** `FRONTEND_API_MIGRATION.md`
- **Code Examples:** `EXAMPLE_PAGE_REFACTOR.md`
- **Overview:** `README_REFACTORING.md`

## ✅ Completion Checklist

- [x] Backend APIs implemented
- [x] Frontend services created
- [x] Documentation written
- [ ] PujaBookingDetails updated
- [ ] Basket updated  
- [ ] TempleDetails updated
- [ ] Store updated
- [ ] localStorage cleaned up
- [ ] Testing completed

## 🎯 Next Action

**Update PujaBookingDetails.jsx following EXAMPLE_PAGE_REFACTOR.md**

```javascript
// 1. Import services
import { ritualsApi } from '../services';

// 2. Add state
const [pujaPackages, setPujaPackages] = useState({});
const [cateringOptions, setCateringOptions] = useState({});
const [addOnServices, setAddOnServices] = useState([]);
const [loading, setLoading] = useState(true);

// 3. Fetch on mount
useEffect(() => {
  const fetchAll = async () => {
    try {
      const [packages, catering, addons] = await Promise.all([
        ritualsApi.getPackageConfigurations(),
        ritualsApi.getCateringConfigurations(),
        ritualsApi.getAddOnServicesConfigurations()
      ]);
      setPujaPackages(packages);
      setCateringOptions(catering);
      setAddOnServices(addons);
    } catch (error) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };
  fetchAll();
}, []);

// 4. Add loading state
if (loading) return <LoadingSpinner />;

// 5. Use state data (same as before)
```

Done! Start with one page and repeat the pattern. 🚀
