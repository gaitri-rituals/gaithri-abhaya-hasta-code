# Test Suite Documentation

This directory contains unit tests for the Abhaya Hasta Backend API.

## Test Structure

- `auth.test.js` - Tests for authentication routes and validation
- `middleware.test.js` - Tests for authentication middleware
- `payments.test.js` - Tests for payment routes and Razorpay integration
- `admin.test.js` - Tests for admin routes and authorization
- `utils.test.js` - Basic utility tests and framework verification
- `setup.js` - Test environment setup and configuration

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- tests/auth.test.js
```

### Watch Mode (runs tests when files change)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Verbose Output
```bash
npm run test:verbose
```

## Test Environment

Tests use a separate environment configuration (`.env.test`) with:
- Test database settings
- Mock API keys and secrets
- Disabled external services

## Test Categories

### 1. Validation Tests
- Input validation for API endpoints
- Required field checks
- Data format validation

### 2. Authentication Tests
- JWT token validation
- Middleware authorization
- Role-based access control

### 3. Route Tests
- HTTP status codes
- Response structure
- Error handling

### 4. Integration Tests
- API endpoint functionality
- Database interactions (mocked in test environment)
- External service integrations

## Notes

- Some tests may fail in environments without proper database setup
- External service tests use mock configurations
- Tests are designed to validate structure and logic rather than actual database operations
- The testing framework uses Jest with ES modules support

## Adding New Tests

1. Create test files in the `tests/` directory
2. Follow the naming convention: `*.test.js`
3. Use the existing test structure as a template
4. Mock external dependencies when necessary
5. Focus on testing business logic and validation

## Test Coverage

The test suite covers:
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Error handling
- ✅ Route structure
- ✅ Middleware functionality
- ⚠️ Database operations (mocked)
- ⚠️ External API integrations (mocked)