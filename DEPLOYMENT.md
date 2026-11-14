# 🚀 NASA Fire Safety Intelligence Engine — Production Deployment & Domain Guide

This document provides a step-by-step guide to deploying the **NASA Fire Safety Intelligence Engine** to a live production server, configuring custom domain names, enabling automatic HTTPS/SSL certificates, and securing API credentials.

---

## 📋 Table of Contents
1. [One-Click Deploy on Render.com (Recommended)](#1-one-click-deploy-on-rendercom-recommended)
2. [Alternative: Deploy on Railway.app](#2-alternative-deploy-on-railwayapp)
3. [Containerized Deployment (Docker)](#3-containerized-deployment-docker)
4. [Custom Domain Registration & DNS Setup](#4-custom-domain-registration--dns-setup)
5. [SSL/TLS Certificate Verification](#5-ssltls-certificate-verification)
6. [Security & API Key Management](#6-security--api-key-management)

---

## 1. One-Click Deploy on Render.com (Recommended)

Render offers free hosting for web services with automatic Git deployment, custom domains, and free SSL certificates.

### Step 1: Push Repository to GitHub
Ensure all code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Prepare production deployment configuration"
git push origin master
```

### Step 2: Create a Web Service on Render
1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** &rarr; **Web Service**.
3. Select your repository `nasaspaceapp`.
4. Render will automatically detect `render.yaml` or you can enter the following:
   - **Name:** `nasa-fire-safety-engine`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.api:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`

### Step 3: Configure Environment Variables
Under **Environment Variables**, add:
| Key | Value | Description |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | `google` | Selects Google Gemini backend |
| `LLM_MODEL` | `gemini-3.5-flash` | Ultra-fast multimodal foundation model |
| `GOOGLE_API_KEY` | `Your_Google_AI_Key` | Secret API key from [aistudio.google.com](https://aistudio.google.com/) |

### Step 4: Deploy
Click **Create Web Service**. Within 2–3 minutes, your live URL will be active:
```
https://nasa-fire-safety-engine.onrender.com/dashboard
```

---

## 2. Alternative: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app) and click **Start a New Project**.
2. Select **Deploy from GitHub repo** &rarr; select `nasaspaceapp`.
3. Add the `GOOGLE_API_KEY` under the **Variables** tab.
4. Railway will automatically execute the `Procfile` and deploy your app.

---

## 3. Containerized Deployment (Docker)

To run the application locally or on any cloud VPS (DigitalOcean, AWS, GCP, Linode):

```bash
# 1. Build the production Docker image
docker build -t nasa-fire-safety-engine .

# 2. Run the container with your Google API Key
docker run -d -p 8000:8000 \
  -e GOOGLE_API_KEY="your-api-key-here" \
  --name nasa-fire-engine \
  nasa-fire-safety-engine

# 3. Test the deployment
curl http://localhost:8000/health
```

---

## 4. Custom Domain Registration & DNS Setup

You can register a custom domain such as `nasafiresafety.space`, `nasafire.dev`, or `spacefireintelligence.org` to give your project an official, polished brand for competition judges.

### Step 1: Register a Domain Name
Choose any ICANN-accredited registrar:
- [Namecheap](https://www.namecheap.com) (often provides `.space` or `.tech` domains for \$1–\$3/year)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (at-cost pricing)
- [GoDaddy](https://godaddy.com)
- [Porkbun](https://porkbun.com)

### Step 2: Add Domain in Hosting Platform
In the **Render Dashboard**:
1. Open your `nasa-fire-safety-engine` service.
2. Go to **Settings** &rarr; **Custom Domains**.
3. Click **Add Custom Domain** and enter your domain:
   - Example: `nasafiresafety.space` and `www.nasafiresafety.space`.

### Step 3: Configure DNS Records at Your Registrar
Open your DNS management panel at your registrar (or Cloudflare) and create these two records:

| Record Type | Name / Host | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `nasa-fire-safety-engine.onrender.com` | Auto or 300 |
| **A** (or ALIAS/ANAME) | `@` (root) | `216.24.57.1` *(Render's Root IP)* | Auto or 300 |

*Note: If using Cloudflare, make sure the proxy status is set to DNS only (Grey cloud) during initial SSL verification.*

---

## 5. SSL/TLS Certificate Verification

- Both Render and Railway automatically issue and renew a free **Let's Encrypt SSL Certificate** once DNS propagation completes (usually 5 to 30 minutes).
- Once active, your dashboard will load securely under:
  ```
  https://www.yourdomain.space/dashboard
  ```

---

## 6. Security & API Key Management

1. **Never Commit API Keys to Git:** Ensure `.env` is listed in `.gitignore` and `.dockerignore`.
2. **Deterministic Cache Protection:** Even if external API limits are reached, the system's **Grounded Response Cache** ensures that all 15 core spaceflight scenarios continue to respond instantly with verified peer-reviewed scientific findings.
3. **NASA Disclaimer:** The mandatory NASA policy notice is permanently embedded in both `/dashboard` and `/guide`.
