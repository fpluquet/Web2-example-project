# Tests Organization

This directory contains the test suite for the API project, organized by functionality for better maintainability.

## Structure

```
tests/
├── helpers/
│   ├── testHelpers.js     # Utility functions for making requests and assertions
│   └── testSetup.js       # Global test setup and teardown
├── auth/
│   └── register.test.js   # User registration tests
├── routes/
│   └── home.test.js       # Home route tests
└── users/
    └── changePassword.test.js # Password change functionality tests
```

## Helper Functions

### testHelpers.js
- `createTestUser()` - Creates a test user and returns token and userId
- `attemptLogin(email, password)` - Attempts to log in with given credentials
- `changePassword(token, passwordData)` - Makes a password change request
- `expectSuccessResponse(response, message?)` - Asserts successful API response
- `expectErrorResponse(response, hasErrors?)` - Asserts error API response

### testSetup.js
- Global test setup and teardown
- Database cleanup after each test
- Application cleanup after all tests

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test auth/register.test.js

# Run tests in a specific directory
yarn test users/
```

## Adding New Tests

1. Create test files in the appropriate directory based on functionality
2. Import required helpers from `../helpers/testHelpers.js`
3. Import test setup with `import '../helpers/testSetup.js'`
4. Follow the existing naming convention: `*.test.js`