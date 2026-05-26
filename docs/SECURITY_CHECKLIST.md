# Production Security Checklist 🔒

## Pre-Launch Security Audit

Use this checklist before deploying to production.

---

## 1. Environment Variables Security

### ✅ Secrets Management
- [ ] No hardcoded secrets in code
- [ ] All API keys in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] Different keys for dev/staging/production
- [ ] Secrets rotated before first production deploy

### ✅ Access Control
- [ ] Netlify environment variables restricted to deploy context
- [ ] Firebase service account key secure
- [ ] Database credentials not shared
- [ ] API keys have minimal required permissions

### Validation
```bash
# Check for hardcoded secrets
grep -r "AIzaSy" src/ backend/
grep -r "sk-" src/ backend/
grep -r "password" src/ backend/

# Check .gitignore
cat .gitignore | grep ".env"
```

---

## 2. Authentication & Authorization

### ✅ Firebase Auth Configuration
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled (optional)
- [ ] Email verification required
- [ ] Password reset configured
- [ ] Session management secure

### ✅ Token Security
- [ ] JWT tokens validated on every request
- [ ] Token expiration set (default: 1 hour)
- [ ] Refresh token rotation enabled
- [ ] Tokens stored securely (httpOnly cookies preferred)

### ✅ Authorization Rules
- [ ] Users can only access their own data
- [ ] Admin roles properly enforced
- [ ] API endpoints check authentication
- [ ] Role-based access control implemented

### Firestore Security Rules Checklist
- [ ] `users/{userId}` - only owner can read/write
- [ ] `scans/{scanId}` - only owner can read, backend can write
- [ ] `processed_orders/{orderId}` - only backend can access
- [ ] No public read/write rules
- [ ] Admin access via role field

### Test Security Rules
```bash
# Start Firebase emulators
firebase emulators:start

# Run security rules tests
npm test

# Test manually in Firestore Console
# → Rules → Rules Playground
```

---

## 3. Data Protection

### ✅ Input Validation
- [ ] All inputs validated with Zod schemas
- [ ] File upload size limits enforced
- [ ] File type validation (images only)
- [ ] SQL injection prevention (using Firestore)
- [ ] XSS prevention (React escapes by default)

### ✅ Data Encryption
- [ ] HTTPS enforced (Netlify default)
- [ ] Sensitive data encrypted at rest (Firebase default)
- [ ] Payment data handled by PayPal (PCI compliant)
- [ ] No sensitive data in logs

### ✅ Data Minimization
- [ ] Only necessary data collected
- [ ] User data deleted on request
- [ ] Logs don't contain PII
- [ ] Images compressed before storage

### Validation
```bash
# Test input validation
curl -X POST https://visagex.online/api/gemini-analysis \
  -H "Content-Type: application/json" \
  -d '{"image": "invalid"}'

# Should return validation error
```

---

## 4. API Security

### ✅ Rate Limiting
- [ ] Rate limiting enabled (Upstash Redis)
- [ ] Per-user and per-IP limits configured
- [ ] Daily caps enforced
- [ ] Rate limit headers returned
- [ ] Graceful degradation when Redis unavailable

### Rate Limit Configuration
```typescript
// Analysis: 5 requests per 10 minutes
// Celebrity: 3 requests per 10 minutes
// Hair: 3 requests per 10 minutes
// Coach: 20 requests per 10 minutes
// Daily cap: 50 analyses per user
```

### ✅ CORS Configuration
- [ ] Origin allowlist configured
- [ ] Only production domain allowed
- [ ] Credentials handled correctly
- [ ] Preflight requests handled

### ✅ Headers Security
- [ ] Helmet.js enabled
- [ ] Content-Security-Policy set
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security enabled

### Validation
```bash
# Test CORS
curl -H "Origin: https://evil.com" \
  https://visagex.online/api/health -I

# Should NOT include Access-Control-Allow-Origin

# Test security headers
curl -I https://visagex.online

# Should include:
# Content-Security-Policy
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

---

## 5. Payment Security

### ✅ PayPal Integration
- [ ] Webhook signature verification enabled
- [ ] Replay protection via Redis
- [ ] Order validation before capture
- [ ] Amount validation (prevent $0 purchases)
- [ ] Transaction logging

### ✅ PCI Compliance
- [ ] No credit card data stored
- [ ] PayPal handles all payment data
- [ ] HTTPS enforced for all payment pages
- [ ] Webhook endpoint secured

### Validation
```bash
# Test webhook verification
curl -X POST https://visagex.online/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "fake", "event_type": "fake"}'

# Should return 401 or 403 (invalid signature)
```

---

## 6. Bot & Fraud Protection

### ✅ CAPTCHA (Cloudflare Turnstile)
- [ ] Turnstile enabled on sensitive endpoints
- [ ] Secret key secure (server-side only)
- [ ] Site key public (client-side)
- [ ] Graceful degradation for trusted users
- [ ] CAPTCHA required for high-risk users

### ✅ Fraud Detection
- [ ] Risk scoring implemented
- [ ] Device fingerprinting enabled
- [ ] IP tracking active
- [ ] Account suspension for abusers
- [ ] Spike detection for unusual activity

### ✅ Bot Protection
- [ ] Bot middleware enabled on API routes
- [ ] Known scrapers blocked
- [ ] Empty user-agent blocked
- [ ] Rate limits stricter for bots

### Validation
```bash
# Test bot blocking
curl -A "" https://visagex.online/api/health
# Should be blocked or rate limited

# Test with bot user agent
curl -A "Googlebot" https://visagex.online/api/health
# Should be blocked
```

---

## 7. Infrastructure Security

### ✅ Netlify Configuration
- [ ] HTTPS enforced (automatic)
- [ ] Custom domain configured
- [ ] DNS secured
- [ ] Build hooks secured
- [ ] Deploy previews restricted

### ✅ Firebase Configuration
- [ ] Project restricted to production
- [ ] API keys restricted to domains
- [ ] Firestore rules deployed
- [ ] Backups enabled
- [ ] Quotas set to prevent abuse

### ✅ Redis (Upstash)
- [ ] Token secure
- [ ] Database restricted to IP allowlist (optional)
- [ ] TLS enabled (default)
- [ ] Backup enabled

### Validation
```bash
# Test Firebase API key restrictions
# Go to Google Cloud Console → APIs & Services → Credentials
# Ensure API key restricted to:
# - HTTP referrers: *.visagex.online
# - APIs: Firebase, Generative Language

# Test Redis connection
curl $UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

---

## 8. Dependency Security

### ✅ Package Audit
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Review before forcing fixes
npm audit fix --force
```

### ✅ Dependency Updates
- [ ] All dependencies up to date
- [ ] No deprecated packages
- [ ] Major versions reviewed before updating
- [ ] Lock file committed (package-lock.json)

### ✅ Build Security
- [ ] CI/CD pipeline scans dependencies
- [ ] Snyk or Dependabot enabled
- [ ] Automated PRs for security updates
- [ ] Manual review of major updates

---

## 9. Logging & Monitoring

### ✅ Error Logging
- [ ] Errors logged with context
- [ ] No sensitive data in logs
- [ ] Request IDs for tracing
- [ ] Structured logging (pino)

### ✅ Monitoring
- [ ] PostHog analytics configured
- [ ] Health checks enabled
- [ ] Uptime monitoring active
- [ ] Alert thresholds set

### ✅ Audit Trail
- [ ] User actions logged
- [ ] Payment events logged
- [ ] Admin actions logged
- [ ] Security events logged

### Validation
```bash
# Check health endpoint
curl https://visagex.online/api/health/detailed | jq

# Check logs in Netlify
netlify logs

# Check Firebase logs
firebase functions:log
```

---

## 10. Incident Response

### ✅ Backup Strategy
- [ ] Firestore automated backups enabled
- [ ] Backup restoration tested
- [ ] Backup retention period set (30 days min)
- [ ] Critical data backed up elsewhere

### ✅ Recovery Plan
- [ ] Rollback procedure documented
- [ ] Database restore procedure documented
- [ ] Emergency contact list available
- [ ] Incident response plan created

### ✅ Communication
- [ ] Status page configured
- [ ] User notification templates ready
- [ ] Support team informed
- [ ] Social media response plan

---

## 11. Compliance & Legal

### ✅ Privacy
- [ ] Privacy policy published
- [ ] Data retention policy defined
- [ ] User consent obtained
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)

### ✅ Terms of Service
- [ ] Terms published
- [ ] Acceptable use policy defined
- [ ] Abuse reporting mechanism
- [ ] Account termination policy

### ✅ Accessibility
- [ ] WCAG 2.1 AA compliance targeted
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

---

## Quick Security Scan Script

Create `scripts/security-scan.sh`:

```bash
#!/bin/bash

echo "🔒 Running Security Scan..."
echo ""

# 1. Check for vulnerabilities
echo "1️⃣  Checking dependencies..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ High severity vulnerabilities found!"
  exit 1
fi
echo "✅ Dependencies OK"
echo ""

# 2. Check environment variables
echo "2️⃣  Checking environment variables..."
if [ ! -f .env ]; then
  echo "❌ .env file missing!"
  exit 1
fi
echo "✅ .env file exists"
echo ""

# 3. Check for hardcoded secrets
echo "3️⃣  Checking for hardcoded secrets..."
if grep -r "AIzaSy" src/ backend/ 2>/dev/null; then
  echo "❌ Found hardcoded API key!"
  exit 1
fi
echo "✅ No hardcoded secrets"
echo ""

# 4. Type checking
echo "4️⃣  Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type errors found!"
  exit 1
fi
echo "✅ Type check passed"
echo ""

# 5. Linting
echo "5️⃣  Running linter..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors found!"
  exit 1
fi
echo "✅ Linting passed"
echo ""

# 6. Health check (if deployed)
echo "6️⃣  Testing health endpoint..."
HEALTH=$(curl -s https://visagex.online/api/health)
if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  echo "✅ Health check passed"
else
  echo "⚠️  Health check failed (may not be deployed yet)"
fi
echo ""

echo "✅ Security scan complete!"
```

Make it executable:
```bash
chmod +x scripts/security-scan.sh
```

Run it:
```bash
./scripts/security-scan.sh
```

---

## Final Verification

Before launching, verify:

- [ ] All checklist items completed
- [ ] Security scan script passes
- [ ] Penetration testing completed (optional but recommended)
- [ ] Legal review completed
- [ ] Team trained on incident response
- [ ] Monitoring and alerts active
- [ ] Backup restoration tested
- [ ] Documentation updated

---

## Ongoing Security

### Daily
- [ ] Check error logs
- [ ] Monitor unusual activity
- [ ] Review failed auth attempts

### Weekly
- [ ] Run security scan script
- [ ] Review rate limiting stats
- [ ] Check dependency updates

### Monthly
- [ ] Full dependency audit
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Update security documentation

### Quarterly
- [ ] Penetration testing
- [ ] Security training for team
- [ ] Review and update policies
- [ ] Infrastructure security review

---

**Security is not a one-time task, it's an ongoing process!** 🔐
