# 🚀 Complete Vercel Deployment Guide for MindTrack

This is a beginner-friendly, step-by-step guide to deploy your MindTrack application on Vercel for FREE.

## ✅ Quick Checklist

Before you start, make sure you have:
- [ ] GitHub account
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account (free)
- [ ] Vercel account (free)

**Estimated Time**: 30-45 minutes for first-time setup

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up MongoDB Atlas (Free Database)](#step-1-set-up-mongodb-atlas-free-database)
3. [Step 2: Prepare Your Project](#step-2-prepare-your-project)
4. [Step 3: Create Vercel Account](#step-3-create-vercel-account)
5. [Step 4: Deploy Backend API](#step-4-deploy-backend-api)
6. [Step 5: Deploy Frontend](#step-5-deploy-frontend)
7. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
8. [Step 7: Test Your Deployment](#step-7-test-your-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
- ✅ A GitHub account (free)
- ✅ Git installed on your computer
- ✅ Your project code ready
- ✅ An email address for account creation

---

## Step 1: Set Up MongoDB Atlas (Free Database)

Since Vercel doesn't provide a database, you need a cloud database. MongoDB Atlas offers a free tier.

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Click **"Try Free"** or **"Sign Up"**
3. Fill in your details and create an account
4. Verify your email if required

### 1.2 Create a Free Cluster
1. After logging in, you'll see **"Build a Database"**
2. Choose **"M0 FREE"** (Free tier)
3. Select a cloud provider (AWS is fine)
4. Choose a region closest to you (e.g., `us-east-1`)
5. Click **"Create"** (takes 1-3 minutes)

### 1.3 Set Up Database Access
1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username (e.g., `mindtrack_user`)
5. Create a strong password (SAVE THIS PASSWORD!)
6. Under "Database User Privileges", select **"Atlas admin"**
7. Click **"Add User"**

### 1.4 Configure Network Access
1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Vercel deployment)
4. Click **"Confirm"**

### 1.5 Get Your Connection String
1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
5. **IMPORTANT**: Replace `<password>` with your actual password
6. Replace `<dbname>` with `mindtrack` (or leave it, we'll add it in code)
7. **SAVE THIS CONNECTION STRING** - you'll need it later!

---

## Step 2: Prepare Your Project

### 2.1 Install Vercel CLI (Optional but Recommended)
Open your terminal/PowerShell and run:
```bash
npm install -g vercel
```

### 2.2 Push Your Code to GitHub
If you haven't already:

1. **Initialize Git** (if not done):
   ```bash
   cd "d:\codes\final year project\mindtrack"
   git init
   ```

2. **Create a .gitignore file** (if you don't have one):
   Create a file named `.gitignore` in your project root with:
   ```
   node_modules/
   .env
   .env.local
   .vercel
   dist/
   build/
   *.log
   ```

3. **Add all files**:
   ```bash
   git add .
   ```

4. **Commit**:
   ```bash
   git commit -m "Initial commit for Vercel deployment"
   ```

5. **Create a GitHub repository**:
   - Go to [github.com](https://github.com)
   - Click the **"+"** icon → **"New repository"**
   - Name it `mindtrack` (or any name you like)
   - Don't initialize with README
   - Click **"Create repository"**

6. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/mindtrack.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

---

## Step 3: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub
5. Complete the signup process

---

## Step 4: Deploy Backend API

### 4.1 Create Vercel Configuration for Backend

The backend needs to be converted to serverless functions. The configuration files have been created for you.

### 4.2 Deploy Backend via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`mindtrack`)
4. **IMPORTANT - Configure the project**:
   - **Framework Preset**: Select **"Other"**
   - **Root Directory**: Click **"Edit"** → Click **"Set Root Directory"** → Select `backend` folder → Click **"Continue"**
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (should auto-fill)

5. **Environment Variables** (Click "Environment Variables" to add them now, or add later in Step 6):
   - Click **"Add"** for each variable:
     - **Name**: `MONGO_URI` | **Value**: Your MongoDB connection string from Step 1.5 | **Environments**: Select all (Production, Preview, Development)
     - **Name**: `JWT_SECRET` | **Value**: Any random string (e.g., `your-super-secret-jwt-key-12345`) | **Environments**: Select all
     - **Name**: `OPENAI_API_KEY` | **Value**: Your OpenAI API key (optional, leave empty if you don't have one) | **Environments**: Select all

6. Click **"Deploy"**

7. **Wait for deployment** (2-5 minutes)
   - Watch the build logs - it should show "Building..." then "Deploying..."
   - If there are errors, check the logs and fix them

8. **After successful deployment**:
   - Click on your project name
   - Copy the **"Production"** URL (looks like: `https://mindtrack-backend-xxxxx.vercel.app`)
   - **SAVE THIS URL** - you'll need it for the frontend!

---

## Step 5: Deploy Frontend

### 5.1 Deploy Frontend via Vercel Dashboard

1. In Vercel dashboard, click **"Add New..."** → **"Project"** again
2. Import the same GitHub repository (`mindtrack`) - **Yes, the same repo!**
3. **IMPORTANT - Configure the project**:
   - **Framework Preset**: Select **"Vite"** (Vercel should auto-detect it)
   - **Root Directory**: Click **"Edit"** → Click **"Set Root Directory"** → Select `frontend` folder → Click **"Continue"**
   - **Build Command**: `npm run build` (should auto-fill)
   - **Output Directory**: `dist` (should auto-fill)
   - **Install Command**: `npm install` (should auto-fill)

4. **Environment Variables** (Click "Environment Variables" to add):
   - Click **"Add"**:
     - **Name**: `VITE_API_URL`
     - **Value**: Your backend URL from Step 4.2 (e.g., `https://mindtrack-backend-xxxxx.vercel.app`)
     - **IMPORTANT**: Don't add `/api` at the end - just the base URL!
     - **Environments**: Select all (Production, Preview, Development)

5. Click **"Deploy"**

6. **Wait for deployment** (2-5 minutes)
   - Watch the build logs
   - Frontend builds are usually faster than backend

7. **After successful deployment**:
   - Click on your project name
   - Copy the **"Production"** URL (looks like: `https://mindtrack-frontend-xxxxx.vercel.app`)
   - **This is your live website URL!** 🎉

---

## Step 6: Configure Environment Variables

### 6.1 Backend Environment Variables

1. Go to your backend project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MONGO_URI` | Your MongoDB connection string | Production, Preview, Development |
   | `JWT_SECRET` | Any random secret string | Production, Preview, Development |
   | `OPENAI_API_KEY` | Your OpenAI key (optional) | Production, Preview, Development |

4. Click **"Save"** for each variable
5. **Redeploy** the backend (go to "Deployments" → click "..." → "Redeploy")

### 6.2 Frontend Environment Variables

1. Go to your frontend project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_API_URL` | Your backend URL (from Step 4.2) | Production, Preview, Development |

4. Click **"Save"**
5. **Redeploy** the frontend

---

## Step 7: Test Your Deployment

1. **Visit your frontend URL** (from Step 5.2)
2. Try to **register a new account**
3. Try to **login**
4. Test creating an entry

If everything works, congratulations! 🎉

---

## Troubleshooting

### Problem: Backend returns 404 errors
**Solution**: 
- Check that your `vercel.json` in the backend folder is correct
- Make sure all routes are under `/api/*` path
- Check Vercel function logs: Go to your project → "Functions" tab

### Problem: "Cannot connect to database"
**Solution**:
- Verify your MongoDB connection string is correct
- Check that you replaced `<password>` in the connection string
- Verify Network Access in MongoDB Atlas allows all IPs (0.0.0.0/0)
- Check backend logs in Vercel dashboard

### Problem: Frontend can't reach backend
**Solution**:
- Verify `VITE_API_URL` environment variable is set correctly
- Make sure it's the full backend URL (e.g., `https://mindtrack-backend-xxxxx.vercel.app`)
- Don't include `/api` in the URL - the frontend code adds it
- Redeploy frontend after changing environment variables

### Problem: CORS errors
**Solution**:
- The backend should already have CORS enabled
- If issues persist, check the backend `server.js` CORS configuration

### Problem: Build fails
**Solution**:
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Problem: Functions timeout
**Solution**:
- Vercel free tier has 10-second timeout for serverless functions
- For longer operations, consider optimizing your code
- MongoDB connections should be cached (the code handles this)

---

## 🎯 Quick Reference

- **Backend URL**: `https://your-backend-project.vercel.app`
- **Frontend URL**: `https://your-frontend-project.vercel.app`
- **MongoDB Atlas**: [https://cloud.mongodb.com](https://cloud.mongodb.com)
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)

---

## 📝 Notes

- **Free Tier Limits**:
  - Vercel: Unlimited deployments, 100GB bandwidth/month
  - MongoDB Atlas: 512MB storage, shared cluster
  - Serverless functions: 10-second timeout, 100GB-hours/month

- **Custom Domains**: You can add your own domain later in Vercel settings (free)

- **Automatic Deployments**: Every push to GitHub main branch will auto-deploy!

---

## 🆘 Need Help?

- Vercel Docs: [https://vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas Docs: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- Check Vercel deployment logs for detailed error messages

---

**Good luck with your deployment! 🚀**

