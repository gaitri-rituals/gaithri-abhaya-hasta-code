# Example: Refactoring PujaBookingDetails to Use API

## Before: Using Hardcoded Data

```javascript
// OLD IMPORTS
import { pujaPackages, cateringOptions, addOnServices } from '../data/pujaCategories';

// Data is immediately available
const PackageSelectionStep = ({ bookingData, updateData, puja }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">Choose Package</h2>
    
    {Object.entries(pujaPackages).map(([key, pkg]) => (
      <div key={key}>
        {/* Use pkg data directly */}
        <h3>{pkg.name}</h3>
        <p>₹{puja.basePrice * pkg.priceMultiplier}</p>
      </div>
    ))}
  </div>
);
```

## After: Using API

```javascript
// NEW IMPORTS
import { useState, useEffect } from 'react';
import { ritualsApi } from '../services';
import { toast } from 'sonner';

const PujaBookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPuja, category } = location.state || {};
  
  // STATE FOR API DATA
  const [pujaPackages, setPujaPackages] = useState({});
  const [cateringOptions, setCateringOptions] = useState({});
  const [addOnServices, setAddOnServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    puja: selectedPuja,
    category: category,
    dateTime: '',
    address: currentAddress?.fullName || '',
    package: 'basic',
    catering: 'basic',
    guestCount: 10,
    addOns: [],
    specialRequests: '',
    skipCatering: false
  });

  // FETCH CONFIGURATIONS ON MOUNT
  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [packages, catering, addons] = await Promise.all([
          ritualsApi.getPackageConfigurations(),
          ritualsApi.getCateringConfigurations(),
          ritualsApi.getAddOnServicesConfigurations()
        ]);
        
        setPujaPackages(packages);
        setCateringOptions(catering);
        setAddOnServices(addons);
      } catch (err) {
        console.error('Error fetching configurations:', err);
        setError('Failed to load booking configurations');
        toast.error('Failed to load configurations. Please try again.');
        
        // OPTIONAL: Use fallback hardcoded data
        // import { pujaPackages as fallbackPackages } from '../data/pujaCategories';
        // setPujaPackages(fallbackPackages);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, []);

  // LOADING STATE
  if (loading) {
    return (
      <InnerPageWrapper title="Loading..." onBackClick={() => navigate(-1)}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <InnerPageWrapper title="Error" onBackClick={() => navigate(-1)}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  // REST OF COMPONENT (same as before, but using state data)
  const calculateTotal = () => {
    const pujaPrice = selectedPuja?.basePrice || 0;
    const packageMultiplier = pujaPackages[bookingData.package]?.priceMultiplier || 1;
    const pujaTotal = pujaPrice * packageMultiplier;
    
    const cateringTotal = !bookingData.skipCatering ? 
      (cateringOptions[bookingData.catering]?.pricePerPerson || 0) * bookingData.guestCount : 0;
    
    const addOnsTotal = bookingData.addOns.reduce((total, addonId) => {
      const addon = addOnServices.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);

    return pujaTotal + cateringTotal + addOnsTotal;
  };

  // ... rest of the component
};

// STEP COMPONENTS (now receive data as props)
const PackageSelectionStep = ({ 
  bookingData, 
  updateData, 
  puja, 
  pujaPackages,  // RECEIVED AS PROP
  onShowPackageDetails 
}) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-foreground">Choose Package</h2>
    
    <div className="space-y-4">
      {Object.entries(pujaPackages).map(([key, pkg]) => (
        <div key={key} className="p-4 rounded-xl border">
          <h3 className="font-semibold">{pkg.name}</h3>
          <span className="text-lg font-bold text-primary">
            ₹{Math.round(puja.basePrice * pkg.priceMultiplier).toLocaleString()}
          </span>
          <p className="text-muted-foreground text-sm">{pkg.description}</p>
          {/* ... rest of package UI */}
        </div>
      ))}
    </div>
  </div>
);

const CateringStep = ({ 
  bookingData, 
  updateData, 
  cateringOptions  // RECEIVED AS PROP
}) => (
  <div className="space-y-6">
    {/* ... catering UI using cateringOptions */}
    {Object.entries(cateringOptions).map(([key, option]) => (
      <div key={key}>
        <h4>{option.name}</h4>
        <span>₹{option.pricePerPerson * bookingData.guestCount}</span>
      </div>
    ))}
  </div>
);

const AddOnsStep = ({ 
  bookingData, 
  updateData, 
  addOnServices,  // RECEIVED AS PROP
  total 
}) => (
  <div className="space-y-6">
    {addOnServices.map((addon) => (
      <div key={addon.id}>
        <h4>{addon.name}</h4>
        <span>₹{addon.price}</span>
      </div>
    ))}
  </div>
);
```

## Key Changes Summary

### 1. Add State for API Data
```javascript
const [pujaPackages, setPujaPackages] = useState({});
const [cateringOptions, setCateringOptions] = useState({});
const [addOnServices, setAddOnServices] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### 2. Fetch Data on Mount
```javascript
useEffect(() => {
  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const [packages, catering, addons] = await Promise.all([
        ritualsApi.getPackageConfigurations(),
        ritualsApi.getCateringConfigurations(),
        ritualsApi.getAddOnServicesConfigurations()
      ]);
      setPujaPackages(packages);
      setCateringOptions(catering);
      setAddOnServices(addons);
    } catch (err) {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };
  fetchConfigurations();
}, []);
```

### 3. Add Loading/Error States
```javascript
if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
}
```

### 4. Pass Data to Child Components
```javascript
// Before (hardcoded data automatically available in component)
<PackageSelectionStep bookingData={bookingData} updateData={updateData} />

// After (pass fetched data as props)
<PackageSelectionStep 
  bookingData={bookingData} 
  updateData={updateData}
  pujaPackages={pujaPackages}  // PASS AS PROP
/>
```

### 5. Update Step Components to Receive Props
```javascript
// Before
const PackageSelectionStep = ({ bookingData, updateData }) => {
  // pujaPackages available from import
}

// After
const PackageSelectionStep = ({ bookingData, updateData, pujaPackages }) => {
  // pujaPackages received as prop
}
```

## Testing the Changes

### 1. Start Backend
```bash
cd backends/gaithri-backend
npm run dev
```

### 2. Verify API Endpoints
```bash
curl http://localhost:3002/api/rituals/packages-config
curl http://localhost:3002/api/rituals/catering-config
curl http://localhost:3002/api/rituals/addons-config
```

### 3. Start Frontend
```bash
cd culture-path-skeleton
npm run dev
```

### 4. Test User Flow
1. Navigate to puja booking page
2. Select a puja
3. Verify package selection shows correct data
4. Verify catering options load
5. Verify add-ons load
6. Complete booking flow

## Error Handling Best Practices

```javascript
// 1. Network Error
try {
  const data = await ritualsApi.getPackageConfigurations();
} catch (error) {
  if (error.message === 'Network Error') {
    toast.error('No internet connection. Please check your network.');
  } else if (error.response?.status === 404) {
    toast.error('Configuration not found');
  } else {
    toast.error('Failed to load configurations');
  }
}

// 2. Fallback to Hardcoded Data
try {
  const packages = await ritualsApi.getPackageConfigurations();
  setPujaPackages(packages);
} catch (error) {
  console.error('API failed, using fallback data:', error);
  // Import fallback data
  import('../data/pujaCategories').then(module => {
    setPujaPackages(module.pujaPackages);
  });
}

// 3. Retry Logic
const fetchWithRetry = async (fetchFn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const packages = await fetchWithRetry(() => ritualsApi.getPackageConfigurations());
```

## Performance Optimization

```javascript
// 1. Use React Query for Caching
import { useQuery } from '@tanstack/react-query';

const { data: pujaPackages, isLoading, error } = useQuery({
  queryKey: ['pujaPackages'],
  queryFn: ritualsApi.getPackageConfigurations,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// 2. Memoize Expensive Calculations
const totalPrice = useMemo(() => calculateTotal(), [bookingData, pujaPackages, cateringOptions, addOnServices]);

// 3. Debounce API Calls
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce(async (query) => {
    const results = await ritualsApi.getAllRituals({ search: query });
    setSearchResults(results);
  }, 500),
  []
);
```

## Similar Pattern for Other Pages

### TempleDetails.jsx
```javascript
const [temple, setTemple] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchTemple = async () => {
    try {
      const data = await templesApi.getTempleById(templeId);
      setTemple(data);
    } catch (error) {
      console.error('Error fetching temple:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchTemple();
}, [templeId]);
```

### ClassEnrollmentStepper.jsx
```javascript
const [classData, setClassData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchClass = async () => {
    try {
      const data = await classAPI.getById(classId);
      setClassData(data);
    } catch (error) {
      console.error('Error fetching class:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchClass();
}, [classId]);
```

### Store.jsx
```javascript
const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStoreData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        storeApi.getItems({ limit: 50 }),
        storeApi.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchStoreData();
}, []);
```
