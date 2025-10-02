# 🔄 API Refactoring Complete - Implementation Guide

## 📋 What Was Done

### ✅ Backend Infrastructure (gaithri-backend)

#### 1. **Rituals/Pujas API** - FULLY IMPLEMENTED
**New Files:**
- `controllers/ritualsController.js` - Complete rituals management
- Updated `routes/rituals.js` - All ritual endpoints

**Endpoints Available:**
```
GET    /api/rituals/categories           - Ritual categories from DB
GET    /api/rituals/packages-config      - Package configurations (basic, advance, premium)
GET    /api/rituals/catering-config      - Catering options
GET    /api/rituals/addons-config        - Add-on services
GET    /api/rituals                      - All rituals (filterable)
GET    /api/rituals/category/:category   - Rituals by category
GET    /api/rituals/:id                  - Ritual by ID
GET    /api/rituals/:ritual_id/packages  - Ritual-specific packages
POST   /api/rituals/bookings             - Create booking (🔒 protected)
GET    /api/rituals/bookings/my-bookings - User's bookings (🔒 protected)
```

#### 2. **Store API** - FULLY IMPLEMENTED
**Updated Files:**
- `controllers/storeController.js` - Migrated to Sequelize
- Updated `routes/store.js` - Complete store & cart routes

**Endpoints Available:**
```
GET    /api/store/items              - Store items (filterable)
GET    /api/store/items/:id          - Item by ID
GET    /api/store/categories         - Store categories
GET    /api/store/cart               - User's cart (🔒 DB-backed)
POST   /api/store/cart               - Add to cart (🔒 protected)
PUT    /api/store/cart/:id           - Update cart item (🔒 protected)
DELETE /api/store/cart/:id           - Remove from cart (🔒 protected)
DELETE /api/store/cart                - Clear cart (🔒 protected)
POST   /api/store/orders             - Create order (🔒 protected)
GET    /api/store/orders             - User's orders (🔒 protected)
GET    /api/store/orders/:id         - Order by ID (🔒 protected)
```

### ✅ Frontend Services (culture-path-skeleton)

**New Service Files:**
- `src/services/ritualsApi.js` - Complete rituals API client
- `src/services/storeApi.js` - Complete store/cart API client
- Updated `src/services/index.js` - Exports all services

**Usage:**
```javascript
import { ritualsApi, storeApi } from '../services';

// Fetch ritual configurations
const packages = await ritualsApi.getPackageConfigurations();
const catering = await ritualsApi.getCateringConfigurations();
const addons = await ritualsApi.getAddOnServicesConfigurations();

// Cart operations
const cart = await storeApi.getCart();
await storeApi.addToCart(itemId, quantity);
await storeApi.updateCartItem(cartItemId, newQuantity);
```

### ✅ Documentation Created

1. **`FRONTEND_API_MIGRATION.md`** - Detailed migration strategy
2. **`API_REFACTORING_SUMMARY.md`** - Complete work summary
3. **`EXAMPLE_PAGE_REFACTOR.md`** - Step-by-step refactoring guide
4. **`README_REFACTORING.md`** - This overview document

## 🚀 How to Use

### 1. Start the Backend
```bash
cd backends/gaithri-backend
npm install  # if not already done
npm run dev
```
**Backend runs on:** `http://localhost:3002`

### 2. Verify API Endpoints
Open your browser or use curl:
```bash
# Test packages configuration
curl http://localhost:3002/api/rituals/packages-config

# Test catering configuration  
curl http://localhost:3002/api/rituals/catering-config

# Test add-ons configuration
curl http://localhost:3002/api/rituals/addons-config

# Test store items
curl http://localhost:3002/api/store/items
```

### 3. Start the Frontend
```bash
cd culture-path-skeleton
npm install  # if not already done
npm run dev
```
**Frontend runs on:** `http://localhost:5173`

Ensure `.env` has:
```env
VITE_API_BASE_URL=http://localhost:3002/api
```

## 📝 Next Steps - Frontend Integration

### Priority 1: Update Pages to Use APIs

#### **PujaBookingDetails.jsx** (See EXAMPLE_PAGE_REFACTOR.md)
```javascript
// Replace hardcoded imports
import { pujaPackages, cateringOptions, addOnServices } from '../data/pujaCategories';

// With API fetching
import { ritualsApi } from '../services';
const [pujaPackages, setPujaPackages] = useState({});
// ... fetch on mount
```

#### **Basket.jsx** - Use API Cart
```javascript
// Replace localStorage
import { getBasket, addToBasket } from '../utils/localStorage';

// With API
import { storeApi } from '../services';
const cart = await storeApi.getCart();
await storeApi.addToCart(itemId, quantity);
```

#### **TempleDetails.jsx** - Use Temple API
```javascript
// Replace hardcoded temples
import { mockTemples } from '../data/temples';

// With API
import { templesApi } from '../services';
const temple = await templesApi.getTempleById(id);
```

#### **Store.jsx** - Use Store API
```javascript
// Replace hardcoded products
import { storeProducts } from '../data/storeProducts';

// With API
import { storeApi } from '../services';
const products = await storeApi.getItems();
const categories = await storeApi.getCategories();
```

### Priority 2: Clean Up localStorage

**Keep Only:**
- ✅ `authToken`, `refreshToken` - Authentication
- ✅ `user` - Cached user data
- ✅ `enrollment-draft` - Temporary class enrollment draft
- ✅ `puja-booking-draft` - Temporary puja booking draft
- ✅ `user-preferences` - UI preferences

**Remove (Use API Instead):**
- ❌ `temple-basket` → API cart
- ❌ `temple-bookings` → API bookings
- ❌ `puja-bookings` → API ritual bookings
- ❌ `class-subscriptions` → API enrollments
- ❌ `temple-favorites` → API favorites

## 🔍 Implementation Pattern

For EVERY page that uses hardcoded data:

### Step 1: Add State
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Step 2: Fetch on Mount
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Step 3: Handle Loading/Error
```javascript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### Step 4: Use Fetched Data
```javascript
// Replace direct hardcoded usage
{mockTemples.map(temple => ...)}

// With state data
{data?.map(temple => ...)}
```

## 🗂️ File Structure

```
manjumegaproject/
├── backends/
│   └── gaithri-backend/
│       ├── controllers/
│       │   ├── ritualsController.js     ✅ NEW
│       │   └── storeController.js       ✅ UPDATED
│       └── routes/
│           ├── rituals.js               ✅ UPDATED
│           └── store.js                 ✅ UPDATED
│
├── culture-path-skeleton/
│   └── src/
│       ├── services/
│       │   ├── ritualsApi.js            ✅ NEW
│       │   ├── storeApi.js              ✅ NEW
│       │   └── index.js                 ✅ UPDATED
│       ├── pages/
│       │   ├── PujaBookingDetails.jsx   ⏳ TO UPDATE
│       │   ├── Basket.jsx               ⏳ TO UPDATE
│       │   ├── TempleDetails.jsx        ⏳ TO UPDATE
│       │   ├── ClassEnrollmentStepper.jsx ⏳ TO UPDATE
│       │   └── Store.jsx                ⏳ TO UPDATE
│       └── data/                        📦 KEEP (as fallback)
│           ├── pujaCategories.js
│           ├── temples.js
│           ├── templeClasses.js
│           └── storeProducts.js
│
├── API_REFACTORING_SUMMARY.md           ✅ DOCUMENTATION
├── FRONTEND_API_MIGRATION.md            ✅ MIGRATION GUIDE
├── EXAMPLE_PAGE_REFACTOR.md             ✅ CODE EXAMPLES
└── README_REFACTORING.md                ✅ THIS FILE
```

## 📊 Database Requirements

### Tables Expected to Exist:
- ✅ `users` - User accounts
- ✅ `temples` - Temple information
- ✅ `temple_services` - Temple services
- ✅ `bookings` - Temple bookings
- ✅ `cart_items` - Shopping cart (DB-backed)
- ✅ `store_items` - Store products
- ✅ `store_orders` - Store orders
- ✅ `vendors` - Vendor information
- ✅ `classes` - Temple classes

### May Need to Create:
- ⚠️ `rituals` - Ritual/Puja data
- ⚠️ `ritual_bookings` - Ritual bookings

**If missing, create with:**
```sql
CREATE TABLE rituals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  base_price DECIMAL(10,2),
  duration VARCHAR(50),
  vendor_id INTEGER REFERENCES vendors(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ritual_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ritual_id INTEGER REFERENCES rituals(id),
  package_type VARCHAR(50),
  booking_date DATE,
  booking_time TIME,
  address TEXT,
  special_requests TEXT,
  contact_phone VARCHAR(20),
  num_people INTEGER DEFAULT 1,
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ✅ Testing Checklist

### Backend Tests
- [ ] Start gaithri-backend on port 3002
- [ ] Test `/api/rituals/packages-config` returns package data
- [ ] Test `/api/rituals/catering-config` returns catering data
- [ ] Test `/api/rituals/addons-config` returns add-ons data
- [ ] Test `/api/store/items` returns store items
- [ ] Test authenticated endpoints with valid token

### Frontend Tests
- [ ] Import ritualsApi works correctly
- [ ] Import storeApi works correctly
- [ ] Can fetch package configurations
- [ ] Can fetch catering configurations
- [ ] Can fetch add-on services
- [ ] Can fetch store items
- [ ] Can add items to cart (requires auth)
- [ ] Can update cart (requires auth)
- [ ] Can remove from cart (requires auth)

### Integration Tests
- [ ] User can browse rituals
- [ ] User can book a ritual
- [ ] User can add store items to cart
- [ ] Cart persists across sessions
- [ ] User can checkout from cart
- [ ] User can view order history

## 🐛 Troubleshooting

### Issue: "Network Error" when calling API
**Solution:** 
- Verify backend is running on port 3002
- Check `.env` has correct `VITE_API_BASE_URL`
- Check CORS settings in backend

### Issue: "401 Unauthorized" for cart operations
**Solution:**
- User must be logged in
- Auth token must be in localStorage
- Check apiClient is sending Bearer token

### Issue: Configuration endpoints return empty data
**Solution:**
- Data is hardcoded in controller (not in DB)
- Verify controller was updated correctly
- Check import statements use ES6 modules

### Issue: Frontend still using hardcoded data
**Solution:**
- Verify imports are changed to use services
- Check useEffect is fetching data on mount
- Ensure state is being set correctly

## 📚 Additional Resources

- **API Documentation:** See `API_REFACTORING_SUMMARY.md`
- **Migration Guide:** See `FRONTEND_API_MIGRATION.md`
- **Code Examples:** See `EXAMPLE_PAGE_REFACTOR.md`
- **Port Configuration:** See `PORT_CONFIG.md`

## 🎯 Quick Commands Reference

```bash
# Start all services
./start-all-apps.sh

# Start only backend
cd backends/gaithri-backend && npm run dev

# Start only frontend
cd culture-path-skeleton && npm run dev

# Test API endpoint
curl http://localhost:3002/api/rituals/packages-config

# Check backend health
curl http://localhost:3002/health
```

## 💡 Best Practices

1. **Always add loading states** when fetching from API
2. **Always handle errors gracefully** with user-friendly messages
3. **Consider adding fallback data** for offline scenarios
4. **Use React Query** for better caching and state management
5. **Debounce search inputs** to reduce API calls
6. **Add retry logic** for failed requests
7. **Show optimistic updates** for better UX
8. **Cache responses** where appropriate

## 🚀 Ready to Implement?

1. **Start with one page** - Use `EXAMPLE_PAGE_REFACTOR.md` as guide
2. **Test thoroughly** - Verify API calls work
3. **Handle edge cases** - Loading, errors, empty states
4. **Move to next page** - Repeat the pattern
5. **Clean up** - Remove unused localStorage code

---

**Need Help?** Refer to the example files or check the API endpoints directly in the browser/Postman.

**Note:** Hardcoded data files in `/src/data/` are kept intentionally for:
- Type reference
- Fallback data
- Development/testing
- Offline mode (future)
