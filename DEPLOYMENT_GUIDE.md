# JNJ Innovations - Production Deployment & MongoDB Atlas Architecture Guide

## 1. Root Cause Summary: Why Did HTTP 404 Occur?

- **In Google AI Studio**: The application runs inside a full-stack container where both the React frontend and the Express Node.js backend (`server.ts`) run together on port 3000. Requests to `/api/mongodb/status` and `/api/playbooks` are processed directly by Express.
- **In GitHub Pages Deployment**: GitHub Pages is a **static web server** (HTML, CSS, JavaScript). It **cannot run Node.js, Express, or connect directly to MongoDB**.
- When the frontend on GitHub Pages issued `fetch('/api/mongodb/status')`, GitHub Pages checked its static files directory, found no file named `/api/mongodb/status`, and returned **`HTTP 404 Not Found`**.
- Because direct MongoDB connections cannot and must never be made from client-side browser JavaScript (which would expose database credentials), the frontend requires a hosted Node.js backend API.

---

## 2. Recommended Production Architecture

You have two clean options to run this in production:

### Option A: GitHub Pages (Frontend) + Google Cloud Run / Render (Backend API)
* **Frontend**: Hosted on GitHub Pages (`jnjinnovations.com` or `https://jnj-innovations.github.io/remix-jnj-innovations/`).
* **Backend API**: Hosted on **Google Cloud Run** (Free tier) or **Render.com**.
* **Database**: MongoDB Atlas (`jnjtestcluster.695tiet.mongodb.net`, database: `jnj_innovations`).

#### Step-by-Step Backend Deployment to Google Cloud Run:
1. Open Google Cloud Console or terminal with `gcloud` installed.
2. In your project directory, deploy the backend container:
   ```bash
   gcloud run deploy jnj-innovations-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "NODE_ENV=production,MONGODB_URI=mongodb+srv://<username>:<password>@jnjtestcluster.695tiet.mongodb.net/jnj_innovations?retryWrites=true&w=majority,CORS_ORIGINS=https://jnjinnovations.com,https://jnj-innovations.github.io"
   ```
3. Cloud Run will provide a service URL (e.g., `https://jnj-innovations-api-xxxx.run.app`).

#### Connecting the Frontend to Your Backend:
Choose either:
* **Method 1 (Instant in UI - No Rebuild Needed)**:
  1. Open your deployed website and go to **Admin Studio** (`/` -> Admin tab).
  2. In the MongoDB Atlas banner, click **API Endpoint**.
  3. Enter your deployed backend URL (e.g., `https://jnj-innovations-api-xxxx.run.app`) and click **Save & Test**.
  4. Click **Ping /api/health** to verify connectivity.
* **Method 2 (Build-Time via GitHub Actions)**:
  1. In your GitHub repository, go to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
  2. Add a repository secret named `VITE_API_URL` with your Cloud Run backend URL.
  3. In `.github/workflows/deploy.yml`, pass `VITE_API_URL: ${{ secrets.VITE_API_URL }}` to the build step.

---

### Option B: All-in-One Full-Stack Container (Cloud Run / Render)
Deploy the included `Dockerfile` directly to Google Cloud Run or Render. The container serves both the compiled React frontend from `/dist` and all `/api/*` endpoints from a single URL, eliminating cross-origin configuration.

---

## 3. MongoDB Atlas Configuration Checklist

1. **Network Access (IP Whitelist)**:
   - Cloud Run and serverless containers use dynamic egress IP addresses.
   - In MongoDB Atlas:
     1. Navigate to **Security** &rarr; **Network Access**.
     2. Click **+ Add IP Address**.
     3. Select **Allow Access From Anywhere (`0.0.0.0/0`)** and confirm.
   *(Without this step, Atlas rejects connections with TLS alert 80 / SSL internal error).*

2. **Database & Collection**:
   - Database name: `jnj_innovations`
   - Collection name: `playbooks`
   - Authentication user: `jnjinnovations1_db_user`

---

## 4. Verification & Testing

Once your backend is running:
1. **Health Check**:
   Open `https://<YOUR-BACKEND-URL>/api/health` in your browser. It should return:
   ```json
   { "status": "ok", "service": "jnj-innovations-backend-api" }
   ```
2. **Test Connection Button**:
   In the Admin Studio, click **Test Connection**. The badge will change to **Live Cluster Connected**.
3. **Sync from Atlas**:
   Click **Sync from Atlas**. The app will pull live playbook data directly from your Atlas collection.
4. **Push Catalog to Atlas**:
   Click **Push Catalog to Atlas**. The backend performs a safe, non-destructive bulk upsert by SKU/ID without wiping existing records.
