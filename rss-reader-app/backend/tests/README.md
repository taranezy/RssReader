# Backend Tests

This directory contains all backend test files, organized by type and purpose.

## Directory Structure

### `integration/`
Integration tests that test full workflows and API endpoints:
- API endpoint tests (`test-api*.js`)
- Import/export functionality (`test-import*.js`)
- Authentication flows (`test-login-flow.js`)
- YouTube integration (`test-youtube*.js`)
- Feed processing (`test-demo-feeds.js`, `test-both-feeds.js`)

### `unit/`
Unit tests that test individual components and functions:
- Parser tests (`test-parser-extraction.js`, `test-browser-parser.js`)
- Repository tests (`test-repository-category.js`)

### `debug/`
Debugging scripts for troubleshooting and development:
- OPML debugging (`debug-opml.js`)
- Parser logic debugging (`debug-parser-logic.js`)
- Real data debugging (`debug-real-opml.js`)

### `migrations/`
Database migration and maintenance scripts:
- Schema migrations (`migrate-image-url.js`)
- Data cleanup scripts (`delete-youtube-feed.js`)

### `utils/`
Utility scripts and helper tools:
- Data analysis (`analyze-feeds.js`)
- Data verification (`check-*.js`)
- Environment testing (`test-env-loading.js`)
- Regex and string utilities (`test-regex.js`, `test-substring.js`)
- Authentication verification (`verify-auth-setup.js`)

### Root Level
- `ImportExportController.test.js` - Official Jest test for ImportExportController

## Running Tests

### Individual Test Files
```bash
node tests/integration/test-api.js
node tests/unit/test-parser-extraction.js
node tests/debug/debug-opml.js
```

### All Tests in a Category
```bash
# Run all integration tests
for file in tests/integration/*.js; do node "$file"; done

# Run all unit tests
for file in tests/unit/*.js; do node "$file"; done
```

## Test Categories

- **Integration Tests**: Test complete workflows and external integrations
- **Unit Tests**: Test individual functions and components in isolation
- **Debug Scripts**: Development aids for troubleshooting issues
- **Utility Scripts**: Helper tools for data verification and setup

## Adding New Tests

1. **Integration tests** → `tests/integration/`
2. **Unit tests** → `tests/unit/`
3. **Debug scripts** → `tests/debug/`
4. **Utility/verification scripts** → `tests/utils/`

## Notes

- All test files are standalone Node.js scripts that can be run directly
- Some tests may require the backend server to be running
- Debug scripts are primarily for development troubleshooting
- Utility scripts help with data validation and environment setup