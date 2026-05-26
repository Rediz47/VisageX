# Monitoring & Alerting Setup Guide 📊

## Table of Contents
1. [Overview](#overview)
2. [Application Monitoring](#application-monitoring)
3. [Infrastructure Monitoring](#infrastructure-monitoring)
4. [Error Tracking](#error-tracking)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Alerting](#alerting)
7. [Dashboards](#dashboards)
8. [Log Management](#log-management)
9. [Performance Monitoring](#performance-monitoring)
10. [Cost Monitoring](#cost-monitoring)

---

## Overview

Effective monitoring ensures you:
- ✅ Detect issues before users do
- ✅ Understand system behavior
- ✅ Optimize performance
- ✅ Control costs
- ✅ Maintain SLAs

### Monitoring Stack
```
┌─────────────────────────────────────┐
│         Dashboards (PostHog)        │
├─────────────────────────────────────┤
│  Alerts  │  Uptime  │  Performance  │
├─────────────────────────────────────┤
│     Error Tracking (Sentry)         │
├─────────────────────────────────────┤
│      Logs (Netlify + Firebase)      │
└─────────────────────────────────────┘
```

---

## Application Monitoring

### PostHog Analytics Setup

#### 1. Create Project
1. Go to [PostHog](https://us.posthog.com/)
2. Sign up / Log in
3. Create new project: "FaceAnalytics Pro"
4. Copy Project API Key

#### 2. Configure Environment
```bash
# Add to .env
VITE_PUBLIC_POSTHOG_KEY=phc_your_project_key
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

#### 3. Verify Integration
```javascript
// In browser console
posthog.identify('user-id')
posthog.capture('test_event', { test: 'data' })

// Check PostHog dashboard → Events
// Should see 'test_event'
```

#### 4. Track Key Events

Add to your React components:

```typescript
import posthog from 'posthog-js';

// User signup
posthog.capture('user_signed_up', {
  method: 'email', // or 'google'
  timestamp: new Date().toISOString()
});

// Analysis started
posthog.capture('analysis_started', {
  image_size: image.size,
  image_type: image.type
});

// Analysis completed
posthog.capture('analysis_completed', {
  duration: endTime - startTime,
  overall_score: result.overallScore,
  credits_used: 1
});

// Payment initiated
posthog.capture('payment_initiated', {
  plan: 'premium',
  amount: 9.99
});

// Payment completed
posthog.capture('payment_completed', {
  plan: 'premium',
  amount: 9.99,
  credits_added: 10
});

// Error occurred
posthog.capture('error_occurred', {
  error_type: 'AI_TIMEOUT',
  endpoint: '/api/gemini-analysis',
  user_id: userId
});
```

#### 5. Create Funnels

In PostHog → Funnels:

**Signup Funnel:**
1. Visit landing page
2. Click "Sign Up"
3. Complete registration
4. Verify email
5. Run first analysis

**Payment Funnel:**
1. Click "Buy Credits"
2. Select plan
3. Open PayPal
4. Complete payment
5. Credits added

**Analysis Funnel:**
1. Upload photo
2. Start analysis
3. Robot scan completes
4. Results displayed
5. User views all tabs

#### 6. Set Up Dashboards

Create dashboard with:
- Daily active users (DAU)
- Analysis completion rate
- Average analysis time
- Payment conversion rate
- Credit usage per user
- Error rate

---

## Infrastructure Monitoring

### Firebase Monitoring

#### 1. Enable Firebase Monitoring
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Quality** → **Performance**
4. Enable Performance Monitoring

#### 2. Add Performance SDK

```bash
npm install firebase/performance
```

```typescript
// src/firebase.ts
import { getPerformance } from 'firebase/performance';

const app = initializeApp(firebaseConfig);
const perf = getPerformance(app);
```

#### 3. Monitor Firestore

**Quotas & Usage:**
- Check daily in Firebase Console
- Set up billing alerts
- Monitor read/write operations

**Key Metrics:**
- Documents read per day
- Documents written per day
- Storage used
- Network egress

#### 4. Set Up Firebase Alerts

In Firebase Console → Project Settings → Integrations:
- Connect to BigQuery (for advanced analysis)
- Enable Crashlytics (if using mobile apps)

### Netlify Monitoring

#### 1. Enable Analytics
1. Go to Netlify dashboard
2. Site settings → Analytics
3. Enable visitor analytics

#### 2. Monitor Deployments
- Check build success rate
- Monitor deployment frequency
- Track rollback events

#### 3. Function Monitoring
In Netlify dashboard → Functions:
- Invocation count
- Error rate
- Duration (must be < 26s)
- Memory usage

---

## Error Tracking

### Sentry Setup (Recommended)

#### 1. Create Sentry Project
1. Go to [Sentry](https://sentry.io/)
2. Sign up (free tier: 5K errors/month)
3. Create project: React + Node.js
4. Copy DSN keys

#### 2. Install Sentry

```bash
# Frontend
npm install @sentry/react @sentry/tracing

# Backend
npm install @sentry/node @sentry/tracing
```

#### 3. Configure Frontend

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.NODE_ENV
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

#### 4. Configure Backend

```typescript
// backend/app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add as middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

#### 5. Add Environment Variables

```bash
# Frontend DSN (public)
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Backend DSN (private)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

#### 6. Configure Alerts

In Sentry → Projects → Settings → Alerts:
- Alert on: New issues
- Threshold: 1 event
- Notify: Email, Slack, PagerDuty

#### 7. Custom Error Tracking

```typescript
// Manual error capture
try {
  await analyzeImage(image);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'analysis' },
    user: { id: userId },
    extra: { imageSize: image.size }
  });
  throw error;
}

// Capture message
Sentry.captureMessage('User completed analysis', {
  level: 'info',
  tags: { feature: 'analysis' }
});
```

---

## Uptime Monitoring

### UptimeRobot (Free)

#### 1. Setup
1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Sign up (free: 50 monitors, 5 min checks)
3. Add monitors:

**Monitor 1: API Health**
- Name: API Health Check
- URL: `https://visagex.online/api/health`
- Monitoring Interval: 5 minutes
- Alert Contacts: Your email

**Monitor 2: Homepage**
- Name: Homepage
- URL: `https://visagex.online/`
- Monitoring Interval: 5 minutes

#### 2. Configure Alerts
- Email alerts (free)
- SMS alerts (paid)
- Slack integration (paid)
- Webhook alerts (free)

### Better Stack (Free Alternative)

1. Go to [Better Stack](https://betterstack.com/)
2. Free tier: 10 monitors, 3 min checks
3. Better incident management
4. Status pages included

### Custom Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

URL="https://visagex.online/api/health"
TIMEOUT=10
RETRIES=3

for i in $(seq 1 $RETRIES); do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $URL)
  
  if [ "$RESPONSE" -eq 200 ]; then
    echo "✅ Health check passed (attempt $i)"
    exit 0
  else
    echo "❌ Health check failed: $RESPONSE (attempt $i)"
    sleep 5
  fi
done

# If all retries failed, send alert
echo "🚨 Service down! Sending alert..."
# Add your alert logic here (email, Slack, etc.)
exit 1
```

Run with cron:
```bash
# Add to crontab (every 5 minutes)
*/5 * * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## Alerting

### Email Alerts

#### Firebase Billing Alerts
1. Firebase Console → Project Settings → Usage and billing
2. Set budget alert
3. Enter threshold (e.g., $10)
4. Configure email recipients

#### Netlify Alerts
1. Netlify dashboard → Team settings → Notifications
2. Configure:
   - Deploy failures
   - Build errors
   - Custom domain issues

### Slack Alerts

#### Using Webhooks

1. Create Slack channel: `#visagex-alerts`
2. Add Incoming Webhook integration
3. Copy webhook URL
4. Add to monitoring scripts:

```bash
SLACK_WEBHOOK="https://hooks.slack.com/services/XXX"

send_slack_alert() {
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-type: application/json' \
    --data "{
      \"text\": \"🚨 Alert: $1\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [
          {\"title\": \"Service\", \"value\": \"FaceAnalytics Pro\", \"short\": true},
          {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
        ]
      }]
    }"
}

# Usage
send_slack_alert "API health check failed!"
```

### PagerDuty (For Critical Alerts)

1. Create PagerDuty account
2. Create service: "FaceAnalytics Pro"
3. Add escalation policy
4. Configure integrations (Sentry, UptimeRobot)

---

## Dashboards

### PostHog Dashboard Setup

Create dashboard with these panels:

#### 1. User Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- New signups per day
- User retention rate

#### 2. Analysis Metrics
- Analyses per day
- Average analysis duration
- Success rate
- Error rate by type
- Most common analysis times

#### 3. Payment Metrics
- Revenue per day
- Conversion rate
- Average order value
- Churn rate
- Credits purchased vs used

#### 4. Performance Metrics
- Page load time
- API response time
- Error rate
- Robot animation FPS

### Grafana (Advanced)

For custom dashboards:

```bash
# Install Grafana
docker run -d -p 3000:3000 grafana/grafana

# Add data sources:
# - PostgreSQL (if using)
# - Prometheus
# - Loki (logs)

# Import dashboards from Grafana community
```

---

## Log Management

### Netlify Logs

```bash
# View real-time logs
netlify logs

# Filter logs
netlify logs | grep "error"

# Save to file
netlify logs > logs.txt
```

### Firebase Logs

```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --only gemini-analysis

# Stream logs
firebase functions:log --follow
```

### Structured Logging (Already Configured)

The app uses `pino` for structured logging:

```json
{
  "level": "error",
  "time": "2024-01-01T12:00:00.000Z",
  "pid": 12345,
  "hostname": "server",
  "reqId": "uuid",
  "req": {
    "method": "POST",
    "url": "/api/gemini-analysis",
    "user": "user-id"
  },
  "res": {
    "statusCode": 500
  },
  "err": {
    "type": "Error",
    "message": "AI timeout",
    "stack": "..."
  }
}
```

### Log Retention

- **Netlify**: 30 days (free), unlimited (paid)
- **Firebase**: No automatic deletion
- **Sentry**: 30 days (free), 90 days (paid)
- **PostHog**: 1 year (free), unlimited (paid)

---

## Performance Monitoring

### Web Vitals

Already tracked in the app. Check in:
- PostHog → Insights
- Chrome DevTools → Lighthouse
- PageSpeed Insights

### Target Metrics
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1
- **FCP** < 1.8s
- **TTFB** < 800ms

### API Performance

Monitor in Netlify → Functions:
- **Duration**: Should be < 10s (AI calls < 30s)
- **Memory**: Should be < 1024MB
- **Invocations**: Track daily usage
- **Errors**: Should be < 1%

---

## Cost Monitoring

### Firebase Costs

Check weekly:
- **Auth**: Free up to 50K MAU
- **Firestore**: $0.06/100K reads, $0.18/100K writes
- **Storage**: $0.026/GB

Set budget alerts:
1. Firebase Console → Usage and billing
2. Set budget: $25/month (adjust as needed)
3. Alert at 50%, 90%, 100%

### Netlify Costs

- **Free tier**: 100GB bandwidth, 300 build minutes
- **Pro**: $19/month (unlimited bandwidth)
- Monitor in dashboard → Usage

### Gemini AI Costs

- **Free tier**: 60 requests/minute
- **Paid**: $0.35/1M input tokens, $1.05/1M output tokens
- Monitor in Google Cloud Console → Billing

### Upstash Redis Costs

- **Free tier**: 256MB, 100K commands/day
- **Pay-as-you-go**: $0.20/1M commands
- Monitor in Upstash Console

---

## Incident Response

### When Alert Fires

1. **Acknowledge**
   - Check alert details
   - Acknowledge in monitoring system
   - Notify team

2. **Assess**
   - Check health endpoint
   - Review error logs
   - Check recent deployments

3. **Mitigate**
   - Rollback if needed
   - Scale resources
   - Enable maintenance mode

4. **Communicate**
   - Update status page
   - Notify affected users
   - Provide ETA for fix

5. **Resolve**
   - Fix root cause
   - Test thoroughly
   - Deploy fix
   - Monitor for recurrence

6. **Review**
   - Post-mortem meeting
   - Document lessons learned
   - Update runbook
   - Improve monitoring

---

## Quick Start Checklist

### Week 1: Basic Monitoring
- [ ] PostHog configured
- [ ] Health checks active
- [ ] UptimeRobot monitors created
- [ ] Email alerts configured

### Week 2: Error Tracking
- [ ] Sentry integrated
- [ ] Error boundaries working
- [ ] Alerts configured
- [ ] Slack notifications active

### Week 3: Advanced Monitoring
- [ ] Firebase performance enabled
- [ ] Custom dashboards created
- [ ] Log aggregation setup
- [ ] Cost monitoring active

### Week 4: Optimization
- [ ] Performance baselines set
- [ ] Alert thresholds tuned
- [ ] Runbook documented
- [ ] Team trained

---

**Monitoring is your eyes and ears in production!** 👀
