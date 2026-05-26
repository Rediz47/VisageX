# FaceAnalytics Pro - Production Deployment Guide 🚀

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Production Checklist](#production-checklist)
4. [Environment Setup](#environment-setup)
5. [Firebase Configuration](#firebase-configuration)
6. [Netlify Deployment](#netlify-deployment)
7. [PayPal Setup](#paypal-setup)
8. [Testing in Production](#testing-in-production)
9. [Monitoring & Alerting](#monitoring--alerting)
10. [Troubleshooting](#troubleshooting)

---

## Overview

FaceAnalytics Pro is a professional AI-powered facial analysis platform featuring:
- **MediaPipe** for 468-point facial landmark detection
- **Gemini 2.5 Flash AI** for detailed aesthetic analysis
- **Firebase** for authentication and database
- **PayPal** for payment processing
- **Upstash Redis** for rate limiting and caching
- **Netlify** for serverless deployment

### Architecture
```
┌─────────────────┐
│   React 19 UI   │ ← Vite 6, Tailwind 4, Framer Motion
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│   Netlify CDN   │ ← Static assets + Serverless functions
└────────┬────────┘
         │
┌────────▼────────┐
│  Express API    │ ← Serverless (Netlify Functions)
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    │          │          │          │
┌───▼──┐  ┌───▼───┐  ┌──▼───┐  ┌──▼────┐
│Firebase│  │Gemini │  │PayPal│  │Upstash│
│  Auth  │  │  AI   │  │      │  │ Redis │
└────────┘  └───────┘  └──────┘  └───────┘
```

---

## Prerequisites

### Required Accounts
- [ ] **Google Cloud Platform** account (for Gemini API)
- [ ] **Firebase** project (free tier works)
- [ ] **Netlify** account (free tier works)
- [ ] **PayPal Developer** account (for payments)
- [ ] **Upstash** account (for Redis - free tier works)
- [ ] **Cloudflare** account (for Turnstile CAPTCHA - free)
- [ ] **Resend** account (for emails - free tier: 100/day)

### Required Tools
- Node.js 20+ (`node -v`)
- npm 9+ (`npm -v`)
- Git
- Netlify CLI (optional): `npm i -g netlify-cli`

---

## Production Checklist

### Before Deployment

- [ ] **Security Audit Complete**
  - [ ] Run `npm audit` - fix all critical/high vulnerabilities
  - [ ] Review Firestore security rules
  - [ ] Verify CORS configuration
  - [ ] Test rate limiting works
  - [ ] Validate CAPTCHA integration

- [ ] **Environment Variables Set**
  - [ ] All required variables configured (see [.env.example](.env.example))
  - [ ] No hardcoded secrets in code
  - [ ] Different keys for production vs development

- [ ] **Firebase Configured**
  - [ ] Authentication enabled (Email, Google)
  - [ ] Firestore database created
  - [ ] Security rules deployed
  - [ ] Indexes deployed (`firestore.indexes.json`)
  - [ ] Service account key generated

- [ ] **Payment System Ready**
  - [ ] PayPal app created in developer portal
  - [ ] Webhook configured and verified
  - [ ] Test payment flow in sandbox mode

- [ ] **Monitoring Setup**
  - [ ] PostHog project created
  - [ ] Error tracking configured (Sentry recommended)
  - [ ] Uptime monitoring enabled

---

## Environment Setup

### 1. Create Production .env File

Create a `.env.production` file with these variables:

```bash
# ==========================================
# REQUIRED - Core Services
# ==========================================

# Gemini AI (get from https://aistudio.google.com/apikey)
VERTEX_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# Firebase (get from Firebase Console → Project Settings → Service Accounts)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
FIRESTORE_DATABASE_ID=(default)

# App URL (your production domain)
APP_URL=https://visagex.online

# ==========================================
# REQUIRED - Payments (PayPal)
# ==========================================

# PayPal Developer Dashboard: https://developer.paypal.com
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
VITE_PAYPAL_CLIENT_ID=your_production_client_id

# ==========================================
# REQUIRED - Rate Limiting (Upstash Redis)
# ==========================================

# Upstash Console: https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# ==========================================
# REQUIRED - CAPTCHA (Cloudflare Turnstile)
# ==========================================

# Cloudflare Dashboard: https://dash.cloudflare.com → Turnstile
VITE_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# ==========================================
# OPTIONAL - Email Notifications (Resend)
# ==========================================

# Resend Dashboard: https://resend.com
RESEND_API_KEY=re_your_api_key

# ==========================================
# OPTIONAL - Analytics (PostHog)
# ==========================================

# PostHog Project Settings
VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# ==========================================
# OPTIONAL - Admin Configuration
# ==========================================

ADMIN_EMAILS=admin@visagex.online,you@email.com

# Site password protection (optional)
VITE_SITE_PASSWORD=

# ==========================================
# OPTIONAL - Fraud Detection (has defaults)
# ==========================================

FRAUD_MAX_ACCOUNTS_PER_IP=3
FRAUD_MAX_REFERRALS_PER_HOUR=5
FRAUD_SCAN_SPIKE_THRESHOLD=20

# ==========================================
# OPTIONAL - GCP Configuration
# ==========================================

GCP_PROJECT=your_gcp_project_id
GCP_REGION=us-central1
```

### 2. Validate Environment Variables

The app automatically validates environment variables on startup. If any required variables are missing, it will fail fast with a clear error message.

```bash
# Test locally
npm run dev

# You should see:
# ✅ Environment variables validated successfully
```

---

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable **Authentication** and **Firestore**

### 2. Enable Authentication Methods

1. Go to **Authentication** → **Sign-in method**
2. Enable:
   - ✅ Email/Password
   - ✅ Google (recommended)

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose location (closest to your users)

### 4. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Select your project
# Choose firestore.rules
# Choose firestore.indexes.json

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Generate Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Convert to single line for `.env`:

```bash
# On Mac/Linux
cat serviceAccountKey.json | jq -c .

# On Windows (PowerShell)
Get-Content serviceAccountKey.json | Out-String | % {$_.Replace("`n","")}

# Copy the output to FIREBASE_SERVICE_ACCOUNT in .env
```

### 6. Deploy Firestore Indexes

The `firestore.indexes.json` file is already configured. Deploy it:

```bash
firebase deploy --only firestore:indexes
```

---

## Netlify Deployment

### Method 1: Git-Based Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Functions directory: netlify/functions
   ```

4. **Set Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add all variables from `.env.production`
   - Click "Deploy site"

5. **Configure Custom Domain** (optional)
   - Go to **Domain settings**
   - Add your custom domain
   - Configure DNS as instructed

### Method 2: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Method 3: API Deployment

```bash
# Build
npm run build

# Deploy via API
netlify deploy --prod --dir=dist --functions=netlify/functions
```

---

## PayPal Setup

### 1. Create PayPal Developer Account

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Go to **Apps & Credentials**

### 2. Create App

1. Click "Create App"
2. Name: `FaceAnalytics Pro`
3. Select **Business** account type
4. Copy **Client ID** and **Client Secret**

### 3. Configure Webhook

1. Go to your app settings
2. Scroll to **Webhooks**
3. Click "Add Webhook"
4. URL: `https://visagex.online/api/paypal/webhook`
5. Select events:
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
   - ✅ `CHECKOUT.ORDER.APPROVED`

6. Copy the **Webhook ID**

### 4. Test in Sandbox Mode

Before going live, test with sandbox credentials:

```bash
# In .env (sandbox testing)
PAYPAL_CLIENT_ID=sandbox_client_id
PAYPAL_CLIENT_SECRET=sandbox_client_secret
PAYPAL_WEBHOOK_ID=sandbox_webhook_id
VITE_PAYPAL_CLIENT_ID=sandbox_client_id
```

### 5. Go Live

When ready for production:
1. Switch PayPal app from **Sandbox** to **Live**
2. Update all PayPal credentials in `.env`
3. Update webhook URL to production domain
4. Test a real payment (small amount)

---

## Testing in Production

### 1. Health Check

```bash
# Simple health check
curl https://visagex.online/api/health

# Expected: {"status":"ok","timestamp":"..."}

# Detailed health check
curl https://visagex.online/api/health/detailed

# Expected:
# {
#   "status": "healthy",
#   "checks": {
#     "redis": {"status": "healthy", ...},
#     "firestore": {"status": "healthy", ...},
#     "gemini": {"status": "healthy", ...},
#     "environment": {"status": "healthy", ...}
#   }
# }
```

### 2. Test User Flow

1. **Signup Flow**
   - [ ] Create new account
   - [ ] Verify email received
   - [ ] Login with credentials
   - [ ] Login with Google

2. **Analysis Flow**
   - [ ] Upload photo
   - [ ] Wait for analysis (should complete in 10-30s)
   - [ ] View results
   - [ ] Check credits deducted

3. **Payment Flow** (Sandbox first!)
   - [ ] Click "Buy Credits"
   - [ ] Complete PayPal payment
   - [ ] Verify credits added
   - [ ] Check PayPal webhook logs

4. **Rate Limiting**
   - [ ] Make 6 rapid requests (should block after 5)
   - [ ] Wait 10 minutes
   - [ ] Verify rate limit reset

5. **CAPTCHA**
   - [ ] Trigger CAPTCHA (rapid requests)
   - [ ] Complete Turnstile challenge
   - [ ] Verify access restored

### 3. Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test (10 users over 60 seconds)
artillery quick --count 10 --num 60 https://visagex.online/api/health

# Check results
# Look for:
# - Response times < 200ms
# - Error rate < 1%
# - No 5xx errors
```

### 4. Security Testing

```bash
# Test CORS
curl -H "Origin: https://evil.com" https://visagex.online/api/health
# Should NOT include Access-Control-Allow-Origin header

# Test CSP headers
curl -I https://visagex.online
# Should include Content-Security-Policy header

# Test rate limiting
for i in {1..10}; do
  curl https://visagex.online/api/health
done
# Should get 429 after limit reached
```

---

## Monitoring & Alerting

### 1. PostHog Analytics

1. Create project at [PostHog](https://us.posthog.com/)
2. Add API key to `.env`
3. Track events:
   - User signups
   - Analysis completed
   - Payments successful
   - Errors encountered

### 2. Error Tracking (Sentry)

1. Create project at [Sentry](https://sentry.io/)
2. Install SDK:
   ```bash
   npm install @sentry/react @sentry/node
   ```
3. Initialize in `src/main.tsx` and `backend/app.ts`
4. Configure error reporting

### 3. Uptime Monitoring

**Free Options:**
- [UptimeRobot](https://uptimerobot.com/) - 50 monitors, 5 min checks
- [Pingdom](https://www.pingdom.com/) - 14-day trial
- [Better Stack](https://betterstack.com/) - 10 monitors, 3 min checks

**Monitor these endpoints:**
- `https://visagex.online/api/health` (every 5 min)
- `https://visagex.online/` (every 5 min)

### 4. Custom Alerts

Set up alerts for:
- ❌ Health check fails
- ❌ Error rate > 5%
- ❌ Response time > 5s
- ❌ Firebase quota > 80%
- ❌ PayPal webhook failures

---

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Problem:** App fails to start with missing env var error

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# Verify format (no spaces around =)
cat .env

# Check in Netlify dashboard
# Site settings → Environment variables
# Ensure all vars are set
```

#### 2. Firebase Authentication Fails

**Problem:** Users can't login

**Solution:**
```bash
# Check Firebase Console
# → Authentication → Sign-in method
# Ensure methods are enabled

# Check browser console for errors
# Look for Firebase SDK errors

# Verify Firebase config in src/firebase.ts
```

#### 3. Gemini AI Returns Errors

**Problem:** Analysis fails with 502 error

**Solution:**
```bash
# Check API key
curl -H "x-goog-api-key: YOUR_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Check quota in Google Cloud Console
# → APIs & Services → Dashboard
# → Generative Language API

# Check detailed health endpoint
curl https://visagex.online/api/health/detailed
```

#### 4. PayPal Webhook Not Working

**Problem:** Payments complete but credits not added

**Solution:**
```bash
# Check webhook logs in PayPal Developer Console
# → Apps & Credentials → Your App → Webhooks

# Verify webhook signature
# Check backend logs for verification errors

# Test webhook manually
curl -X POST https://visagex.online/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 5. Rate Limiting Too Strict

**Problem:** Legitimate users getting blocked

**Solution:**
```bash
# Check Redis
curl $UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Adjust limits in backend/middleware/ratelimit.middleware.ts
# Increase maxRequests or window size

# Clear rate limit for specific user
# Via Upstash Console → Browse → Delete key
```

### Getting Help

1. **Check Logs**
   ```bash
   # Netlify logs
   netlify logs

   # Firebase logs
   firebase functions:log

   # Check browser console
   # F12 → Console tab
   ```

2. **Health Check**
   ```bash
   curl https://visagex.online/api/health/detailed | jq
   ```

3. **Contact Support**
   - GitHub Issues: Create detailed bug report
   - Email: admin@visagex.online
   - Include: Error messages, steps to reproduce, environment

---

## Post-Launch Checklist

After going live:

- [ ] Monitor error rate for first 24 hours
- [ ] Check user feedback
- [ ] Verify payments processing correctly
- [ ] Monitor Firebase quota usage
- [ ] Check rate limiting effectiveness
- [ ] Review analytics data
- [ ] Set up automated backups
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Plan next feature releases

---

## Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Review analytics
- [ ] Monitor Firebase usage
- [ ] Check PayPal transactions

### Monthly Tasks
- [ ] Update dependencies (`npm update`)
- [ ] Review security rules
- [ ] Test backup restoration
- [ ] Review rate limiting stats
- [ ] Check for deprecated APIs

### Quarterly Tasks
- [ ] Full security audit
- [ ] Load testing
- [ ] Review and update documentation
- [ ] Plan infrastructure upgrades
- [ ] User feedback review

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [PayPal Developer](https://developer.paypal.com/)
- [Upstash Docs](https://docs.upstash.com/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or create an issue on GitHub.
