# API Refactoring Summary

## ✅ Completed Work

### 1. Backend API Implementation

#### **Rituals/Pujas API** (`gaithri-backend`)
**New Controller:** `/backends/gaithri-backend/controllers/ritualsController.js`
- ✅ `GET /api/rituals/categories` - Get ritual categories
- ✅ `GET /api/rituals/packages-config` - Get package configurations (basic, advance, premium)
- ✅ `GET /api/rituals/catering-config` - Get catering options
- ✅ `GET /api/rituals/addons-config` - Get add-on services
- ✅ `GET /api/rituals` - Get all rituals (with filtering)
- ✅ `GET /api/rituals/category/:category` - Get rituals by category
- ✅ `GET /api/rituals/:id` - Get ritual by ID
- ✅ `GET /api/rituals/:ritual_id/packages` - Get ritual-specific packages
- ✅ `POST /api/rituals/bookings` - Create ritual booking (protected)
- ✅ `GET /api/rituals/bookings/my-bookings` - Get user's ritual bookings (protected)

**Routes Updated:** `/backends/gaithri-backend/routes/rituals.js`

#### **Store API** (`gaithri-backend`)
**Controller Updated:** `/backends/gaithri-backend/controllers/storeController.js`
**Routes Updated:** `/backends/gaithri-backend/routes/store.js`
- ✅ `GET /api/store/items` - Get store items (with filtering)
- ✅ `GET /api/store/items/:id` - Get item by ID
- ✅ `GET /api/store/categories` - Get store categories
- ✅ `GET /api/store/cart` - Get user's cart (DB-backed, protected)
- ✅ `POST /api/store/cart` - Add to cart (protected)
- ✅ `PUT /api/store/cart/:id` - Update cart item (protected)
- ✅ `DELETE /api/store/cart/:id` - Remove from cart (protected)
- ✅ `DELETE /api/store/cart` - Clear cart (protected)
- ✅ `POST /api/store/orders` - Create order (protected)
- ✅ `GET /api/store/orders` - Get user's orders (protected)
- ✅ `GET /api/store/orders/:id` - Get order by ID (protected)

### 2. Frontend Service Modules

**New Services Created:**
- ✅ `/culture-path-skeleton/src/services/ritualsApi.js` - Rituals API service
  - All methods for rituals, categories, packages, catering, add-ons, bookings
- ✅ `/culture-path-skeleton/src/services/storeApi.js` - Store API service
  - All methods for items, categories, cart, orders

**Index Updated:** `/culture-path-skeleton/src/services/index.js`
- ✅ Exported `ritualsApi` and `storeApi`
- ✅ Added to main `api` object

### 3. Documentation Created
- ✅ `/FRONTEND_API_MIGRATION.md` - Detailed migration guide
- ✅ `/API_REFACTORING_SUMMARY.md` - This summary document

## 🚧 Remaining Work

### Phase 1: Update Frontend Pages (High Priority)

#### 1. **PujaBookingDetails.jsx**
**Current:** Uses hardcoded data from `/data/pujaCategories.js`
```javascript
// REPLACE:
import { pujaPackages, cateringOptions, addOnServices } from '../data/pujaCategories';

// WITH:
import { ritualsApi } from '../services';
// Fetch configurations on component mount
const [pujaPackages, setPujaPackages] = useState({});
const [cateringOptions, setCateringOptions] = useState({});
const [addOnServices, setAddOnServices] = useState([]);

useEffect(() => {
  const fetchConfigurations = async () => {
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
      console.error('Error fetching configurations:', error);
      toast.error('Failed to load configurations');
    }
  };
  fetchConfigurations();
}, []);
```

#### 2. **Basket.jsx**
**Current:** Uses localStorage for basket
```javascript
// REPLACE localStorage basket with API cart:
import { getBasket, removeFromBasket, updateBasketItem } from '../utils/localStorage';

// WITH:
import { storeApi } from '../services';

// Fetch cart from API
const fetchCart = async () => {
  const cartData = await storeApi.getCart();
  setCart(cartData);
};

// Add to cart
await storeApi.addToCart(itemId, quantity);

// Update cart item
await storeApi.updateCartItem(cartItemId, newQuantity);

// Remove from cart
await storeApi.removeFromCart(cartItemId);
```

#### 3. **TempleDetails.jsx**
**Current:** Uses hardcoded data from `/data/temples.js`
```javascript
// REPLACE:
import { mockTemples } from '../data/temples';

// WITH:
import { templesApi } from '../services';
const [temple, setTemple] = useState(null);

useEffect(() => {
  const fetchTemple = async () => {
    try {
      const templeData = await templesApi.getTempleById(templeId);
      setTemple(templeData);
    } catch (error) {
      console.error('Error fetching temple:', error);
    }
  };
  fetchTemple();
}, [templeId]);
```

#### 4. **ClassEnrollmentStepper.jsx**
**Current:** Uses hardcoded data from `/data/templeClasses.js`
```javascript
// REPLACE:
import { templeClasses, gurus } from '../data/templeClasses';

// WITH API:
import { classAPI } from '../services/api';
const [classData, setClassData] = useState(null);

useEffect(() => {
  const fetchClass = async () => {
    const data = await classAPI.getById(classId);
    setClassData(data);
  };
  fetchClass();
}, [classId]);
```

#### 5. **MySubscriptions.jsx**
**Current:** Uses localStorage for subscriptions
```javascript
// REPLACE:
import { getClassSubscriptions } from '../utils/localStorage';

// WITH:
import { classAPI } from '../services/api';
const subscriptions = await classAPI.getMyEnrollments();
```

### Phase 2: Cart/Basket Migration

**Key Changes:**
1. Remove `addToBasket()` localStorage calls
2. Use `storeApi.addToCart()` for items
3. For non-store items (temple services, pujas), create separate cart endpoints:
   - `/api/cart/temple-services` - Temple service cart
   - `/api/cart/ritual-bookings` - Ritual booking cart
   - `/api/cart/all` - Combined cart for checkout

**Unified Cart Structure:**
```javascript
{
  storeItems: [...],
  templeServices: [...],
  ritualBookings: [...],
  classEnrollments: [...],
  summary: {
    totalItems: 10,
    totalAmount: 5000
  }
}
```

### Phase 3: localStorage Cleanup

**Keep Only:**
- ✅ `authToken` - Authentication token
- ✅ `refreshToken` - Refresh token
- ✅ `user` - User profile data (cached)
- ✅ `enrollment-draft` - Temporary draft for class enrollment
- ✅ `puja-booking-draft` - Temporary draft for puja booking
- ✅ `user-preferences` - UI preferences (theme, language)

**Remove:**
- ❌ `temple-basket` → Use API cart
- ❌ `temple-bookings` → Use API bookings
- ❌ `puja-bookings` → Use API ritual bookings
- ❌ `class-subscriptions` → Use API enrollments
- ❌ `temple-favorites` → Use API favorites
- ❌ `learning-progress` → Use API (needs backend implementation)
- ❌ `gamification-data` → Use API (needs backend implementation)
- ❌ `daily-streaks` → Use API (needs backend implementation)

## 📋 Implementation Checklist

### Backend Tasks
- [x] Create rituals controller
- [x] Add ritual routes
- [x] Add package/catering/addon configuration endpoints
- [x] Update store controller to use Sequelize
- [x] Update store routes
- [ ] Create unified cart endpoint (optional)
- [ ] Add learning progress API (future)
- [ ] Add gamification API (future)

### Frontend Tasks
- [x] Create ritualsApi service
- [x] Create storeApi service
- [x] Update services index
- [ ] Update PujaBookingDetails.jsx to use API
- [ ] Update Basket.jsx to use API cart
- [ ] Update TempleDetails.jsx to use API
- [ ] Update ClassEnrollmentStepper.jsx to use API
- [ ] Update MySubscriptions.jsx to use API
- [ ] Update ExploreTemples.jsx to use API
- [ ] Update Store.jsx to use API
- [ ] Update MyBookings.jsx to use API
- [ ] Clean up localStorage usage
- [ ] Add loading states for API calls
- [ ] Add error handling for API failures

## 🔧 Environment Configuration

### Backend (gaithri-backend)
Ensure `.env` has:
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=temple_ecosystem_db
DB_USER=temple_admin
DB_PASSWORD=temple_password123
```

### Frontend (culture-path-skeleton)
Ensure `.env` has:
```env
VITE_API_BASE_URL=http://localhost:3002/api
```

## 🚀 Quick Start Commands

### Start Backend
```bash
cd backends/gaithri-backend
npm run dev
# Server runs on http://localhost:3002
```

### Start Frontend
```bash
cd culture-path-skeleton
npm run dev
# App runs on http://localhost:5173
```

### Test API Endpoints
```bash
# Test rituals packages config
curl http://localhost:3002/api/rituals/packages-config

# Test catering config
curl http://localhost:3002/api/rituals/catering-config

# Test add-ons config
curl http://localhost:3002/api/rituals/addons-config

# Test store items
curl http://localhost:3002/api/store/items
```

## 📊 Database Requirements

The following tables are expected in the database:

### Existing Tables (likely already present)
- `users` - User accounts
- `temples` - Temple information
- `temple_services` - Services offered by temples
- `bookings` - Temple service bookings
- `cart_items` - Shopping cart (DB-backed)
- `store_items` - Store products
- `store_orders` - Store orders
- `store_order_items` - Order line items
- `vendors` - Vendor information
- `classes` - Temple classes

### May Need to Create
- `rituals` - Ritual/Puja information
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
  ```

- `ritual_bookings` - Ritual booking records
  ```sql
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

## 🎯 Next Steps

1. **Immediate (Today):**
   - Update `PujaBookingDetails.jsx` to use API configurations
   - Test ritual booking flow end-to-end

2. **Short Term (This Week):**
   - Migrate all pages to use API instead of hardcoded data
   - Implement API-based cart across all features
   - Clean up localStorage usage

3. **Medium Term (Next Week):**
   - Add learning progress API
   - Add gamification API
   - Implement offline mode with service workers

4. **Long Term (Future):**
   - Move configuration data to database
   - Add admin panel to manage configurations
   - Implement real-time updates with WebSockets

## 📝 Migration Notes

- Hardcoded data files are NOT deleted - kept for:
  - Type reference
  - Fallback in case of API failure
  - Development/testing
  
- All API calls should have proper error handling
- Loading states should be shown during API fetches
- Consider implementing optimistic UI updates for better UX
- Add request caching where appropriate (React Query recommended)

## 🐛 Known Issues / Considerations

1. **API Base URL:** Ensure frontend points to correct backend port (3002)
2. **CORS:** Backend allows localhost ports - verify if needed
3. **Authentication:** Most cart/booking endpoints require auth token
4. **Database:** Some tables may need to be created if missing
5. **Sequelize vs pg:** Store controller needs Sequelize query updates (partially done)
