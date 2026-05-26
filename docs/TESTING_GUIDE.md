# Testing Guide - FaceAnalytics Pro 🧪

## Table of Contents
1. [Overview](#overview)
2. [Running Tests](#running-tests)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [API Testing](#api-testing)
5. [Load Testing](#load-testing)
6. [Security Testing](#security-testing)
7. [E2E Testing](#e2e-testing)
8. [Performance Testing](#performance-testing)

---

## Overview

This guide covers all testing aspects for FaceAnalytics Pro:
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and services
- **E2E Tests**: Complete user flows
- **Load Tests**: Performance under traffic
- **Security Tests**: Vulnerability scanning

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
# Run geometry tests
npm test -- geometry

# Run AI routes tests
npm test -- ai.routes

# Run with watch mode (development)
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Type Checking

```bash
npx tsc --noEmit
```

### Run Linting

```bash
npm run lint
```

### Fix Code Style

```bash
npm run format
```

---

## Manual Testing Checklist

### 1. User Authentication

- [ ] **Email Signup**
  1. Navigate to `/`
  2. Click "Sign Up"
  3. Enter valid email and password
  4. Verify email sent (check Resend logs)
  5. Click verification link
  6. Confirm account activated

- [ ] **Google Signup**
  1. Click "Sign in with Google"
  2. Select Google account
  3. Verify redirect back to app
  4. Confirm user created in Firestore

- [ ] **Login**
  1. Enter credentials
  2. Verify successful login
  3. Check user profile loads
  4. Verify auth token in localStorage

- [ ] **Password Reset**
  1. Click "Forgot Password"
  2. Enter email
  3. Check reset email received
  4. Click reset link
  5. Set new password
  6. Login with new password

### 2. Facial Analysis

- [ ] **Photo Upload**
  1. Click "Analyze Photo"
  2. Upload valid image (JPG/PNG)
  3. Verify image preview shows
  4. Check robot animation starts

- [ ] **Analysis Process**
  1. Watch robot scanning animation
  2. Verify beam effects visible
  3. Check hand gestures during scan
  4. Confirm progress bar advances
  5. Wait for completion (10-30s)

- [ ] **Results Display**
  1. Verify overall score shown
  2. Check facial ratio cards
  3. Confirm breakdown metrics
  4. View celebrity matches
  5. Check dermatology section
  6. Verify timeline plan

- [ ] **Error Handling**
  1. Upload invalid file → Should show error
  2. Upload too large file → Should reject
  3. No face detected → Should show message
  4. Network error → Should retry
  5. AI timeout → Should show error

### 3. Credits System

- [ ] **Free Credits**
  1. Create new account
  2. Check initial credits (should be 3)
  3. Run analysis → Credits decrease
  4. Verify credits displayed correctly

- [ ] **Credit Purchase**
  1. Click "Buy Credits"
  2. Select plan
  3. Complete PayPal payment
  4. Verify credits added
  5. Check transaction in history

- [ ] **Credit Exhaustion**
  1. Use all credits
  2. Try to run analysis
  3. Should show "Buy Credits" modal
  4. Cannot proceed without credits

### 4. Payment Flow

- [ ] **PayPal Integration**
  1. Click purchase button
  2. PayPal window opens
  3. Complete payment (sandbox account)
  4. Verify payment successful
  5. Check credits added
  6. Verify webhook received

- [ ] **Payment Failures**
  1. Cancel payment → Should return to app
  2. Insufficient funds → Should show error
  3. Network timeout → Should retry
  4. Invalid webhook → Should reject

### 5. Referral System

- [ ] **Invite Friends**
  1. Go to profile
  2. Copy referral link
  3. Open in new browser (incognito)
  4. Signup via referral link
  5. Verify referrer gets credit

- [ ] **Referral Tracking**
  1. Check referral count in profile
  2. Verify rewards distributed
  3. Check fraud prevention (max per hour)

### 6. Rate Limiting

- [ ] **API Rate Limits**
  1. Make 5 rapid analysis requests
  2. 6th request should be blocked (429)
  3. Wait 10 minutes
  4. Verify rate limit reset

- [ ] **Daily Caps**
  1. Make 50 requests in one day
  2. 51st should be blocked
  3. Wait until next day (UTC)
  4. Verify cap reset

### 7. CAPTCHA

- [ ] **Turnstile Integration**
  1. Trigger rate limit
  2. Should require CAPTCHA
  3. Complete Turnstile challenge
  4. Verify access restored

### 8. Responsive Design

- [ ] **Mobile (320px - 480px)**
  - [ ] All pages render correctly
  - [ ] Buttons accessible
  - [ ] Text readable
  - [ ] Animations smooth

- [ ] **Tablet (768px - 1024px)**
  - [ ] Layout adjusts properly
  - [ ] Navigation works
  - [ ] Images scale correctly

- [ ] **Desktop (1280px+)**
  - [ ] Full layout visible
  - [ ] Hover effects work
  - [ ] Animations performant

### 9. Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## API Testing

### Using cURL

#### Health Check
```bash
curl https://visagex.online/api/health
```

#### Detailed Health Check
```bash
curl https://visagex.online/api/health/detailed | jq
```

#### Authentication
```bash
# Login (replace with actual credentials)
curl -X POST https://visagex.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save token from response
TOKEN="your_auth_token"
```

#### Facial Analysis
```bash
curl -X POST https://visagex.online/api/gemini-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "analysisType": "full"
  }'
```

#### Celebrity Lookalike
```bash
curl -X POST https://visagex.online/api/celebrity-lookalike \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
  }'
```

#### Get Scan History
```bash
curl https://visagex.online/api/scans/history?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. **Import Collection**
   - Create new collection: "FaceAnalytics Pro"
   - Add environment: "Production" with `{{base_url}}` and `{{token}}`

2. **Setup Environment Variables**
   ```
   base_url: https://visagex.online
   token: <your_auth_token>
   ```

3. **Test Endpoints**
   - Create requests for each API endpoint
   - Use collection runner for batch testing

### Using HTTPie

```bash
# Install HTTPie
pip install httpie

# Health check
http GET https://visagex.online/api/health

# Authenticated request
http GET https://visagex.online/api/scans/history \
  Authorization:"Bearer $TOKEN"
```

---

## Load Testing

### Using Artillery

#### Install Artillery
```bash
npm install -g artillery
```

#### Create Load Test Script
Create `load-test.yml`:
```yaml
config:
  target: "https://visagex.online"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"

scenarios:
  - flow:
      - get:
          url: "/api/health"
      - think: 2
      - get:
          url: "/api/health/detailed"
```

#### Run Load Test
```bash
artillery run load-test.yml
```

#### Generate Report
```bash
artillery run load-test.yml --output report.json
artillery report report.json
```

### Using k6

#### Install k6
```bash
# Mac
brew install k6

# Windows (using scoop)
scoop install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Create Load Test Script
Create `load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://visagex.online/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

#### Run Load Test
```bash
k6 run load-test.js
```

#### Run with Cloud Dashboard
```bash
k6 cloud load-test.js
```

---

## Security Testing

### 1. Dependency Vulnerabilities

```bash
# Check for vulnerabilities
npm audit

# Auto-fix (safe updates only)
npm audit fix

# Force fix (may break changes)
npm audit fix --force

# Check in CI/CD
npm audit --audit-level=high
```

### 2. OWASP ZAP Scan

#### Install OWASP ZAP
Download from: https://www.zaproxy.org/download/

#### Run Automated Scan
```bash
# Start ZAP daemon
zap.sh -daemon -port 8090 -config api.disablekey=true &

# Run spider scan
curl "http://localhost:8090/JSON/spider/action/scan/?url=https://visagex.online"

# Run active scan
curl "http://localhost:8090/JSON/ascan/action/scan/?url=https://visagex.online"

# Generate report
curl "http://localhost:8090/OTHER/core/other/htmlreport/?zapapiformat=HTML" > zap-report.html
```

### 3. Manual Security Tests

#### Test CORS
```bash
# Should NOT allow evil.com
curl -H "Origin: https://evil.com" \
  https://visagex.online/api/health -I

# Should allow your domain
curl -H "Origin: https://visagex.online" \
  https://visagex.online/api/health -I
```

#### Test CSP Headers
```bash
curl -I https://visagex.online

# Should include:
# Content-Security-Policy: default-src 'self' ...
```

#### Test SQL Injection (if applicable)
```bash
# Test for injection vulnerabilities
curl "https://visagex.online/api/scans/history?limit=10;DROP TABLE users"
```

#### Test XSS
```bash
# Test reflected XSS
curl "https://visagex.online/search?q=<script>alert('xss')</script>"
```

#### Test Rate Limiting
```bash
# Send 20 rapid requests
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://visagex.online/api/health
done

# Should see: 200 200 200 200 200 429 429 ...
```

### 4. Firebase Security Rules Testing

#### Use Firebase Emulator
```bash
# Start emulators
firebase emulators:start

# Run security rules tests
firebase emulators:exec "npm test"
```

#### Test Rules Manually
Use Firestore simulator in Firebase Console:
1. Go to Firestore → Rules
2. Click "Rules Playground"
3. Test different scenarios:
   - Authenticated user reading own data ✅
   - Authenticated user reading other's data ❌
   - Unauthenticated user reading data ❌
   - Admin deleting user ✅

---

## E2E Testing

### Using Playwright

#### Install Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

#### Create Test
Create `e2e/analysis.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('complete analysis flow', async ({ page }) => {
  // Navigate to app
  await page.goto('https://visagex.online');
  
  // Click analyze button
  await page.click('text=Analyze Photo');
  
  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-image.jpg');
  
  // Wait for analysis to complete
  await expect(page.locator('text=Analysis Complete')).toBeVisible({
    timeout: 60000
  });
  
  // Verify results shown
  await expect(page.locator('text=Overall Score')).toBeVisible();
  await expect(page.locator('text=Facial Ratios')).toBeVisible();
});
```

#### Run E2E Tests
```bash
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test analysis
```

### Using Cypress

#### Install Cypress
```bash
npm install -D cypress
npx cypress install
```

#### Create Test
Create `cypress/e2e/analysis.cy.js`:
```javascript
describe('Facial Analysis', () => {
  it('completes full analysis flow', () => {
    cy.visit('https://visagex.online');
    
    cy.contains('Analyze Photo').click();
    
    cy.get('input[type="file"]')
      .selectFile('test-image.jpg');
    
    cy.contains('Analysis Complete', { timeout: 60000 })
      .should('be.visible');
    
    cy.contains('Overall Score').should('be.visible');
  });
});
```

#### Run Cypress
```bash
npx cypress open

# Or run headless
npx cypress run
```

---

## Performance Testing

### Lighthouse Audit

#### Using Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Click "Analyze page load"

#### Using CLI
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://visagex.online --output html --output report.html

# Open report
open report.html
```

### Target Scores
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 95

### Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 800ms

---

## CI/CD Testing

### GitHub Actions

The project includes a CI pipeline (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
```

### Local CI Simulation

```bash
# Simulate CI locally
npm ci
npx tsc --noEmit
npm run lint
npm test
```

---

## Test Data

### Sample Images for Testing

Create `test-data/` directory with:
- `clear-face.jpg` - Clear front-facing photo
- `side-face.jpg` - Side profile
- `multiple-faces.jpg` - Group photo
- `no-face.jpg` - Photo without face
- `low-quality.jpg` - Blurry/dark photo
- `large-file.jpg` - >10MB image

### Test User Accounts

```bash
# Create test users in Firebase Console
test-user-1@example.com / password123
test-user-2@example.com / password123
admin@example.com / password123 (admin role)
```

---

## Test Reports

### Generate Coverage Report

```bash
npm test -- --coverage

# Open HTML report
open coverage/index.html
```

### Target Coverage
- **Statements**: > 70%
- **Branches**: > 60%
- **Functions**: > 70%
- **Lines**: > 70%

---

## Continuous Monitoring

### Post-Deployment Tests

Run these daily:
```bash
# Health check
curl -f https://visagex.online/api/health || echo "HEALTH CHECK FAILED"

# SSL certificate
curl -vI https://visagex.online 2>&1 | grep "expire date"

# Response time
curl -o /dev/null -s -w "Time: %{time_total}s\n" \
  https://visagex.online/api/health
```

### Automated Testing Schedule

- **Every commit**: Unit tests, linting, type checking
- **Every PR**: Full test suite + E2E tests
- **Daily**: Load tests + security scans
- **Weekly**: Full audit + manual testing
- **Monthly**: Performance review + optimization

---

## Debugging Tips

### Enable Debug Logging

```bash
# Backend
DEBUG=express:* npm run dev

# Frontend (browser console)
localStorage.setItem('debug', '*');
```

### Check Firebase Logs

```bash
firebase functions:log --only your-function-name
```

### Check Netlify Logs

```bash
netlify logs
```

### Browser Debugging

1. Open DevTools (F12)
2. Check Console for errors
3. Network tab for API calls
4. Application tab for localStorage
5. Performance tab for bottlenecks

---

## Quick Test Commands

```bash
# Full test suite
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format

# Build
npm run build

# Health check
curl https://visagex.online/api/health

# Load test
artillery run load-test.yml

# Security audit
npm audit

# Lighthouse
lighthouse https://visagex.online
```

---

**Remember**: Test early, test often, automate everything! 🚀
