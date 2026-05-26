# Architecture Overview

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [netlify.toml](file://netlify.toml)
- [backend/app.ts](file://backend/app.ts)
- [backend/index.ts](file://backend/index.ts)
- [netlify/functions/api.ts](file://netlify/functions/api.ts)
- [src/main.tsx](file://src/main.tsx)
- [src/App.tsx](file://src/App.tsx)
- [src/firebase.ts](file://src/firebase.ts)
- [src/lib/api.ts](file://src/lib/api.ts)
- [src/components/FaceAnalyzer/hooks/useFaceModel.ts](file://src/components/FaceAnalyzer/hooks/useFaceModel.ts)
- [src/components/FaceAnalyzer/hooks/useAnalysis.ts](file://src/components/FaceAnalyzer/hooks/useAnalysis.ts)
- [src/components/FaceAnalyzer/utils/geometry.ts](file://src/components/FaceAnalyzer/utils/geometry.ts)
- [backend/services/firebase.service.ts](file://backend/services/firebase.service.ts)
- [backend/services/scan.service.ts](file://backend/services/scan.service.ts)
- [backend/routes/scan.routes.ts](file://backend/routes/scan.routes.ts)
- [backend/routes/ai.routes.ts](file://backend/routes/ai.routes.ts)
- [backend/utils/image.ts](file://backend/utils/image.ts)
- [backend/types/mediapipe.ts](file://backend/types/mediapipe.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the FaceAnalytics Pro system architecture. The platform consists of:
- A React 19 frontend that performs client-side facial landmark detection using MediaPipe and orchestrates image uploads and AI analysis.
- An Express.js backend that validates requests, enforces rate limits and fraud controls, interacts with Firebase, and calls Gemini AI for advanced analysis.
- A serverless deployment on Netlify Functions that exposes REST endpoints via a reverse proxy and static hosting.

Technology stack highlights include React 19, Express.js, Firebase (Firestore, Authentication, Storage), MediaPipe Tasks Vision, and Google Gemini AI (Vertex AI/Gemini Developer API). The system emphasizes secure, scalable, and responsive processing of facial analysis workflows.

## Project Structure
The repository is organized into:
- Frontend (React 19): src/ and public/
- Backend (Express): backend/
- Serverless adapter: netlify/functions/
- Deployment configuration: netlify.toml
- Root package and tooling: package.json

```mermaid
graph TB
subgraph "Client (Browser)"
FE["React 19 App<br/>src/"]
MP["MediaPipe Tasks Vision<br/>useFaceModel.ts"]
API["HTTP Client Interceptor<br/>src/lib/api.ts"]
end
subgraph "Serverless API"
NET["Netlify Functions<br/>netlify/functions/api.ts"]
EXP["Express App<br/>backend/app.ts"]
ROUTE_AI["AI Routes<br/>backend/routes/ai.routes.ts"]
ROUTE_SCAN["Scan Routes<br/>backend/routes/scan.routes.ts"]
SRV_FIRE["Firebase Service<br/>backend/services/firebase.service.ts"]
SRV_SCAN["Scan Service<br/>backend/services/scan.service.ts"]
UTIL_IMG["Image Utils<br/>backend/utils/image.ts"]
end
subgraph "External Services"
FB["Firebase Auth/DB/Storage"]
GEM["Google Gemini AI<br/>Vertex AI / Gemini Dev API"]
end
FE --> MP
FE --> API
API --> NET
NET --> EXP
EXP --> ROUTE_AI
EXP --> ROUTE_SCAN
ROUTE_AI --> SRV_FIRE
ROUTE_AI --> SRV_SCAN
ROUTE_AI --> UTIL_IMG
ROUTE_SCAN --> SRV_FIRE
ROUTE_AI --> GEM
ROUTE_SCAN --> FB
SRV_FIRE --> FB
```

**Diagram sources**
- [src/main.tsx:1-40](file://src/main.tsx#L1-L40)
- [src/lib/api.ts:1-36](file://src/lib/api.ts#L1-L36)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/routes/scan.routes.ts:1-63](file://backend/routes/scan.routes.ts#L1-L63)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)
- [backend/utils/image.ts:1-42](file://backend/utils/image.ts#L1-L42)
- [src/firebase.ts:1-21](file://src/firebase.ts#L1-L21)

**Section sources**
- [package.json:1-79](file://package.json#L1-L79)
- [netlify.toml:1-42](file://netlify.toml#L1-L42)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)

## Core Components
- React 19 Frontend
  - Initializes PostHog analytics and renders routed pages.
  - Uses MediaPipe Tasks Vision to detect facial landmarks locally.
  - Sends cropped images to backend endpoints for AI analysis and saves results to Firebase.
- Express Backend
  - Dynamically imports heavy modules on first request to optimize Lambda cold start.
  - Enforces security headers, CORS, rate limiting, bot protection, and fraud checks.
  - Exposes routes for AI analysis and scan history.
- Firebase Integration
  - Provides Auth, Firestore, and Storage; Firestore configured for HTTP/1.1 in serverless.
  - Stores scan results and user data; supports caching and deduplication.
- Serverless Adapter
  - Netlify Functions wraps the Express app and serves static assets in production.
- AI Analysis Pipeline
  - Calls Gemini AI via Vertex AI or Gemini Developer API depending on credentials.
  - Applies image compression, robust parsing, and credit-safe ordering.

**Section sources**
- [src/App.tsx:1-473](file://src/App.tsx#L1-L473)
- [src/main.tsx:1-40](file://src/main.tsx#L1-L40)
- [src/components/FaceAnalyzer/hooks/useFaceModel.ts:1-37](file://src/components/FaceAnalyzer/hooks/useFaceModel.ts#L1-L37)
- [src/components/FaceAnalyzer/hooks/useAnalysis.ts:1-207](file://src/components/FaceAnalyzer/hooks/useAnalysis.ts#L1-L207)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)

## Architecture Overview
The system boundary separates:
- Client-side React application (browser)
- Serverless API functions (Netlify)
- External services (Firebase, Gemini AI)

```mermaid
graph TB
Browser["Browser"]
ReactApp["React 19 App<br/>src/"]
MP["MediaPipe Tasks Vision<br/>client-side"]
APIInt["Axios Interceptor<br/>Authorization + CAPTCHA"]
Netlify["Netlify Functions<br/>api.ts"]
ExpressApp["Express App<br/>app.ts"]
Routes["Routes<br/>ai.routes.ts / scan.routes.ts"]
FirebaseSvc["Firebase Service<br/>firebase.service.ts"]
Firestore["Firestore DB"]
Auth["Firebase Auth"]
Storage["Firebase Storage"]
Gemini["Gemini AI / Vertex AI"]
Browser --> ReactApp
ReactApp --> MP
ReactApp --> APIInt
APIInt --> Netlify
Netlify --> ExpressApp
ExpressApp --> Routes
Routes --> FirebaseSvc
FirebaseSvc --> Firestore
FirebaseSvc --> Auth
FirebaseSvc --> Storage
Routes --> Gemini
```

**Diagram sources**
- [src/main.tsx:1-40](file://src/main.tsx#L1-L40)
- [src/lib/api.ts:1-36](file://src/lib/api.ts#L1-L36)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/routes/scan.routes.ts:1-63](file://backend/routes/scan.routes.ts#L1-L63)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)

## Detailed Component Analysis

### React Frontend: Client-Side Facial Landmarking and Upload Flow
- Model Loading
  - Loads MediaPipe Face Landmarker from CDN and initializes GPU delegate.
- Image Processing
  - Uses client-side geometry utilities to render overlays and prepare cropped images.
- API Interaction
  - Axios interceptor attaches Firebase ID tokens and optional CAPTCHA tokens.
  - Calls backend endpoints for analysis and scan history.
- Analytics
  - PostHog provider configured to send events to a proxied ingest endpoint.

```mermaid
sequenceDiagram
participant U as "User"
participant R as "React App<br/>src/App.tsx"
participant M as "MediaPipe<br/>useFaceModel.ts"
participant A as "API Interceptor<br/>src/lib/api.ts"
participant N as "Netlify Function<br/>netlify/functions/api.ts"
participant E as "Express App<br/>backend/app.ts"
participant AI as "AI Routes<br/>backend/routes/ai.routes.ts"
participant F as "Firebase Service<br/>backend/services/firebase.service.ts"
U->>R : "Upload photo"
R->>M : "Detect landmarks"
M-->>R : "Landmarks"
R->>A : "POST /api/gemini-analysis"
A->>N : "Forward request"
N->>E : "Invoke configured app"
E->>AI : "Route request"
AI->>F : "Read user credits / store result"
AI-->>E : "AI result JSON"
E-->>N : "Response"
N-->>A : "Response"
A-->>R : "Analysis result"
R-->>U : "Display results"
```

**Diagram sources**
- [src/components/FaceAnalyzer/hooks/useFaceModel.ts:1-37](file://src/components/FaceAnalyzer/hooks/useFaceModel.ts#L1-L37)
- [src/components/FaceAnalyzer/utils/geometry.ts:1-15](file://src/components/FaceAnalyzer/utils/geometry.ts#L1-L15)
- [src/lib/api.ts:1-36](file://src/lib/api.ts#L1-L36)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)

**Section sources**
- [src/main.tsx:1-40](file://src/main.tsx#L1-L40)
- [src/App.tsx:1-473](file://src/App.tsx#L1-L473)
- [src/components/FaceAnalyzer/hooks/useFaceModel.ts:1-37](file://src/components/FaceAnalyzer/hooks/useFaceModel.ts#L1-L37)
- [src/components/FaceAnalyzer/hooks/useAnalysis.ts:1-207](file://src/components/FaceAnalyzer/hooks/useAnalysis.ts#L1-L207)
- [src/lib/api.ts:1-36](file://src/lib/api.ts#L1-L36)

### Express Backend: Security, Routing, and AI Orchestration
- Dynamic Imports
  - Heavy modules (helmet, crypto, http-proxy-middleware, route handlers) are dynamically imported to reduce Lambda initialization overhead.
- Security and Middleware
  - Helmet CSP, COOP/COEP adjustments, CORS allowlist, bot blocking, and request logging.
- Routes
  - AI analysis and celebrity/hair analysis endpoints with rate limits, daily caps, and fraud checks.
  - Scan history and save endpoints backed by Firestore.
- AI Integration
  - Calls Vertex AI or Gemini Developer API based on credential type.
  - Applies retry logic, timeouts, and robust JSON parsing.
- Image Compression
  - Sharp-based compression to reduce payload sizes for AI calls.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Sec["Security & Logging"]
Sec --> RouteSel{"Route?"}
RouteSel --> |AI Analysis| AI["AI Routes<br/>ai.routes.ts"]
RouteSel --> |Scan History| SH["Scan Routes<br/>scan.routes.ts"]
AI --> Img["Compress Image<br/>utils/image.ts"]
AI --> Vertex["Call Gemini / Vertex"]
Vertex --> Parse["Parse & Validate JSON"]
Parse --> Store["Store Result<br/>scan.service.ts"]
Store --> Deduct["Deduct Credits<br/>ledger best-effort"]
Deduct --> Resp(["Return Result"])
SH --> FBRead["Read Firestore<br/>firebase.service.ts"]
FBRead --> Resp
```

**Diagram sources**
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/routes/scan.routes.ts:1-63](file://backend/routes/scan.routes.ts#L1-L63)
- [backend/utils/image.ts:1-42](file://backend/utils/image.ts#L1-L42)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)

**Section sources**
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/routes/scan.routes.ts:1-63](file://backend/routes/scan.routes.ts#L1-L63)
- [backend/utils/image.ts:1-42](file://backend/utils/image.ts#L1-L42)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)

### Serverless Adapter: Netlify Functions and Static Hosting
- Function Entrypoint
  - Defer heavy imports until first invocation to stay within Lambda budget.
  - Wraps Express app with serverless-http.
- Redirects and Proxies
  - Redirects /api/* to Netlify Functions.
  - Reverse proxy for PostHog ingest to avoid CORS issues.
- Build and Runtime
  - Vite builds static assets; Netlify publishes dist and compiles functions.

```mermaid
sequenceDiagram
participant C as "Client"
participant P as "Netlify Proxy<br/>netlify.toml"
participant F as "Function Handler<br/>netlify/functions/api.ts"
participant X as "Express App<br/>backend/app.ts"
C->>P : "GET /api/health"
P->>F : "Proxy to function"
F->>X : "Configure and serve"
X-->>F : "200 OK"
F-->>P : "Response"
P-->>C : "Response"
```

**Diagram sources**
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [netlify.toml:1-42](file://netlify.toml#L1-L42)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)

**Section sources**
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [netlify.toml:1-42](file://netlify.toml#L1-L42)
- [backend/index.ts:1-29](file://backend/index.ts#L1-L29)

### Firebase Services: Auth, DB, Storage, and HTTP/1.1 Settings
- Admin SDK Initialization
  - Supports environment-variable-based service account and local fallback.
- Firestore Settings
  - Switches to HTTP/1.1 (REST) to avoid gRPC handshake latency in cold Lambda containers.
- Scan Storage
  - Stores analysis results with deduplication via image hashing and caching.

```mermaid
classDiagram
class FirebaseService {
+getAdminApp()
+getAdminDb()
+getAdminAuth()
}
class ScanService {
+hashImage()
+getCachedResult()
+storeScanResult()
+getUserScanHistory()
}
FirebaseService <.. ScanService : "uses"
```

**Diagram sources**
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)

**Section sources**
- [src/firebase.ts:1-21](file://src/firebase.ts#L1-L21)
- [backend/services/firebase.service.ts:1-120](file://backend/services/firebase.service.ts#L1-L120)
- [backend/services/scan.service.ts:1-134](file://backend/services/scan.service.ts#L1-L134)

## Dependency Analysis
- Frontend Dependencies
  - React 19, @mediapipe/tasks-vision, axios, @posthog/react, lucide-react, motion, react-router-dom, resend, sharp, tailwind-merge, zod.
- Backend Dependencies
  - express, helmet, http-proxy-middleware, serverless-http, sharp, pino, @upstash/ratelimit, @google/generative-ai, firebase-admin.
- Netlify Runtime
  - external_node_modules includes sharp, firebase-admin, pino, esbuild, lightningcss for optimized builds.

```mermaid
graph LR
Pkg["package.json"]
P1["@google/genai"]
P2["@mediapipe/tasks-vision"]
P3["express"]
P4["serverless-http"]
P5["sharp"]
P6["firebase-admin"]
P7["helmet"]
P8["@upstash/ratelimit"]
Pkg --> P1
Pkg --> P2
Pkg --> P3
Pkg --> P4
Pkg --> P5
Pkg --> P6
Pkg --> P7
Pkg --> P8
```

**Diagram sources**
- [package.json:1-79](file://package.json#L1-L79)

**Section sources**
- [package.json:1-79](file://package.json#L1-L79)
- [netlify.toml:6-16](file://netlify.toml#L6-L16)

## Performance Considerations
- Cold Starts
  - Dynamic imports in Express app and Netlify function handler minimize initialization time.
- AI Latency
  - Gemini 2.5 Flash vision analysis can take 20–40s; backend sets a 24s timeout for Netlify and 60s for local dev.
- Image Compression
  - Sharp reduces payload size to improve throughput and cost efficiency.
- Firestore Transport
  - HTTP/1.1 REST preferred over gRPC in serverless to avoid handshake delays.
- Client Timeout
  - Frontend waits up to 70s for AI responses to accommodate backend AbortController timing.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- 403 Insufficient Credits
  - Backend soft-checks credits before AI call; if credits are insufficient, returns 403. Frontend should prompt credit purchase or notify user.
- 429 Too Many Requests
  - Shared rate limiters and daily caps enforce usage quotas; reduce frequency or upgrade plan.
- 502 Gemini Parsing Failure
  - Backend returns 502 with parse preview; verify prompt correctness and model response format.
- 502/504 Server Errors
  - Check Netlify logs for cold start failures or backend exceptions; confirm environment variables and Firebase credentials.
- CORS and CSP
  - Ensure APP_URL allowlist matches frontend origin; review CSP directives for external resources.

**Section sources**
- [backend/routes/ai.routes.ts:270-516](file://backend/routes/ai.routes.ts#L270-L516)
- [backend/app.ts:145-164](file://backend/app.ts#L145-L164)
- [backend/app.ts:90-140](file://backend/app.ts#L90-L140)

## Conclusion
FaceAnalytics Pro integrates a modern React 19 frontend with MediaPipe for client-side landmarking, a security-hardened Express backend, and serverless deployment on Netlify Functions. Firebase provides identity, storage, and data persistence, while Gemini AI delivers advanced facial analysis. The architecture balances performance, scalability, and security through careful transport choices, rate limiting, and robust error handling.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### System Context Diagram: Client, Serverless API, and Firebase
```mermaid
graph TB
subgraph "Client"
UA["User Agent"]
REACT["React App"]
end
subgraph "Edge"
NGINX["Netlify Redirects/Proxies"]
end
subgraph "Serverless"
FN["Netlify Function Handler"]
APP["Express App"]
AI["AI Routes"]
SC["Scan Routes"]
end
subgraph "Firebase"
AUTH["Auth"]
DB["Firestore"]
STORE["Storage"]
end
subgraph "Gemini AI"
GEM["Vertex AI / Gemini Dev API"]
end
UA --> REACT
REACT --> NGINX
NGINX --> FN
FN --> APP
APP --> AI
APP --> SC
AI --> GEM
SC --> DB
AI --> DB
AI --> STORE
APP --> AUTH
```

**Diagram sources**
- [netlify.toml:27-42](file://netlify.toml#L27-L42)
- [netlify/functions/api.ts:1-28](file://netlify/functions/api.ts#L1-L28)
- [backend/app.ts:1-205](file://backend/app.ts#L1-L205)
- [backend/routes/ai.routes.ts:1-800](file://backend/routes/ai.routes.ts#L1-L800)
- [backend/routes/scan.routes.ts:1-63](file://backend/routes/scan.routes.ts#L1-L63)
- [src/firebase.ts:1-21](file://src/firebase.ts#L1-L21)

### Cross-Cutting Concerns
- Security
  - Helmet CSP, COOP/COEP, CORS allowlist, bot protection, and fraud checks.
- Authentication
  - Firebase Auth with ID token injection via Axios interceptor.
- Observability
  - PostHog ingestion via reverse proxy; request logging with unique IDs.
- Scalability
  - HTTP/1.1 Firestore, dynamic imports, and function-level timeouts.

**Section sources**
- [backend/app.ts:90-164](file://backend/app.ts#L90-L164)
- [src/lib/api.ts:9-33](file://src/lib/api.ts#L9-L33)
- [netlify.toml:32-36](file://netlify.toml#L32-L36)
- [backend/services/firebase.service.ts:97-108](file://backend/services/firebase.service.ts#L97-L108)