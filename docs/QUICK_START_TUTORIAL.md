# 🚀 Quick Start Tutorial - Get Production Ready in 30 Minutes

This tutorial walks you through deploying FaceAnalytics Pro to production.

---

## Prerequisites (5 minutes)

### 1. Create Required Accounts

Click each link and sign up (all have free tiers):

- [ ] **Firebase**: https://console.firebase.google.com/
- [ ] **Netlify**: https://app.netlify.com/
- [ ] **Google AI Studio**: https://aistudio.google.com/apikey
- [ ] **PayPal Developer** (optional): https://developer.paypal.com/
- [ ] **Upstash** (optional): https://console.upstash.com/
- [ ] **Cloudflare** (optional): https://dash.cloudflare.com/

### 2. Install Tools

```bash
# Verify Node.js installed
node -v  # Should be 20+

# Install Firebase CLI
npm install -g firebase-tools

# Install Netlify CLI (optional)
npm install -g netlify-cli
```

---

## Step 1: Firebase Setup (10 minutes)

### Create Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `visagex-prod`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. Click "Authentication" in left menu
2. Click "Get started"
3. Enable "Email/Password"
4. Enable "Google" (optional)
5. Click "Save"

### Create Firestore Database

1. Click "Firestore Database" in left menu
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (closest to your users)
5. Click "Enable"

### Deploy Security Rules & Indexes

```bash
# Login to Firebase
firebase login

# Initialize Firebase
firebase init firestore

# Select:
# - Use existing project: visagex-prod
# - Rules file: firestore.rules
# - Indexes file: firestore.indexes.json

# Deploy
firebase deploy --only firestore:rules,firestore:indexes
```

### Generate Service Account Key

1. Go to Project Settings (gear icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download JSON file
5. Convert to single line:

**Mac/Linux:**
```bash
cat serviceAccountKey.json | jq -c .
```

**Windows (PowerShell):**
```powershell
Get-Content serviceAccountKey.json | Out-String | % {$_.Replace("`n","")}
```

6. Copy the output - you'll need it for `.env`

---

## Step 2: Get API Keys (5 minutes)

### Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIzaSy`)

### Upstash Redis (Optional - for rate limiting)

1. Go to https://console.upstash.com/
2. Click "Create Database"
3. Name: `visagex-ratelimit`
4. Region: Choose closest to you
5. Click "Create"
6. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Cloudflare Turnstile (Optional - for CAPTCHA)

1. Go to https://dash.cloudflare.com/
2. Click "Turnstile" in left menu
3. Click "Add Widget"
4. Name: `VisageX CAPTCHA`
5. Domain: `visagex.online` (or your domain)
6. Copy Site Key and Secret Key

---

## Step 3: Configure Environment (5 minutes)

### Create .env File

```bash
# Copy example
cp .env.example .env
```

### Fill in Required Variables

Open `.env` and fill in:

```bash
# REQUIRED - Gemini AI
VERTEX_API_KEY=AIzaSy...  # From Google AI Studio

# REQUIRED - Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # Single line JSON
FIRESTORE_DATABASE_ID=(default)

# REQUIRED - Your domain
APP_URL=https://visagex.online

# OPTIONAL - PayPal (for payments)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
VITE_PAYPAL_CLIENT_ID=

# OPTIONAL - Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OPTIONAL - Cloudflare Turnstile (for CAPTCHA)
VITE_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# OPTIONAL - PostHog (for analytics)
VITE_PUBLIC_POSTHOG_KEY=
```

### Validate Configuration

```bash
# Start dev server - should validate env vars
npm run dev

# Should see:
# ✅ Environment variables validated successfully
```

---

## Step 4: Deploy to Netlify (5 minutes)

### Method 1: Git-Based (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub
   - Select your repository

3. **Configure Build**
   ```
   Build command: npm run build
   Publish directory: dist
   Functions directory: netlify/functions
   ```

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add ALL variables from `.env`
   - Click "Deploy site"

5. **Wait for Deploy**
   - Should complete in 2-3 minutes
   - Click on deploy to view logs

### Method 2: Manual Deploy

```bash
# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

---

## Step 5: Test Deployment (5 minutes)

### Health Check

```bash
# Replace with your URL
curl https://visagex.online/api/health

# Expected:
# {"status":"ok","timestamp":"..."}

# Detailed check
curl https://visagex.online/api/health/detailed | jq

# Expected:
# {
#   "status": "healthy",
#   "checks": {
#     "redis": {"status": "healthy" or "degraded"},
#     "firestore": {"status": "healthy"},
#     "gemini": {"status": "healthy"},
#     "environment": {"status": "healthy"}
#   }
# }
```

### Manual User Flow Test

1. **Visit your site**: https://visagex.online
2. **Sign up**: Create new account
3. **Upload photo**: Click "Analyze Photo"
4. **Run analysis**: Wait 10-30 seconds
5. **View results**: Check scores and metrics
6. **Success!** ✅

---

## Step 6: Set Up Monitoring (5 minutes)

### PostHog Analytics

1. Go to https://us.posthog.com/
2. Sign up and create project
3. Copy Project API Key
4. Add to Netlify environment variables:
   ```
   VITE_PUBLIC_POSTHOG_KEY=phc_your_key
   ```
5. Redeploy: `netlify deploy --prod`

### UptimeRobot

1. Go to https://uptimerobot.com/
2. Sign up (free)
3. Add monitor:
   - URL: `https://visagex.online/api/health`
   - Check interval: 5 minutes
   - Alert to: Your email
4. Click "Create Monitor"

---

## 🎉 You're Live!

Your FaceAnalytics Pro is now in production!

### Next Steps

1. **Monitor for 24 hours**
   - Check health endpoint regularly
   - Watch for errors in Netlify logs
   - Monitor Firebase usage

2. **Set up PayPal** (when ready)
   - Follow `docs/PRODUCTION_GUIDE.md` → PayPal Setup
   - Test in sandbox mode first
   - Then switch to production

3. **Add custom domain** (optional)
   - Netlify → Domain settings
   - Add your domain
   - Configure DNS

4. **Read the guides**
   - `docs/PRODUCTION_GUIDE.md` - Complete deployment guide
   - `docs/TESTING_GUIDE.md` - Testing procedures
   - `docs/SECURITY_CHECKLIST.md` - Security audit
   - `docs/MONITORING_GUIDE.md` - Monitoring setup

---

## Troubleshooting

### Build Fails

```bash
# Check build logs in Netlify
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency issues

# Test build locally
npm run build
```

### Health Check Fails

```bash
# Check Netlify function logs
netlify logs

# Common issues:
# - Firebase service account invalid
# - Firestore rules blocking access
# - Missing API keys
```

### Analysis Not Working

```bash
# Check detailed health
curl https://visagex.online/api/health/detailed

# Check Gemini API key
# - Verify key is correct
# - Check quota in Google Cloud Console
# - Test key with curl
```

### Users Can't Signup

```bash
# Check Firebase Console
# - Authentication enabled?
# - Sign-in methods configured?
# - Quota exceeded?
```

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod

# Check health
curl https://visagex.online/api/health/detailed

# View logs
netlify logs

# Type check
npx tsc --noEmit

# Run tests
npm test

# Security audit
npm audit
```

---

## Need Help?

1. **Check the guides**
   - `docs/PRODUCTION_GUIDE.md`
   - `docs/TESTING_GUIDE.md`
   - `PRODUCTION_SUMMARY.md`

2. **Check logs**
   - Netlify: `netlify logs`
   - Firebase: `firebase functions:log`
   - Browser: F12 → Console

3. **Health check**
   - `https://visagex.online/api/health/detailed`

---

**Congratulations! You've successfully deployed FaceAnalytics Pro to production!** 🎊
