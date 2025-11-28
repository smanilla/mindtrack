# 🔧 Troubleshooting Database Connection on Vercel

## Quick Fix Steps

### Step 1: Check Vercel Environment Variables

1. Go to your backend project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Verify `MONGO_URI` is set:
   - Should look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mindtrack`
   - Make sure you replaced `<password>` with your actual password
   - Make sure it's set for **Production, Preview, and Development**

### Step 2: Check MongoDB Atlas Network Access

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click **"Network Access"** (left sidebar)
3. Make sure you have **"Allow Access from Anywhere"** (IP: `0.0.0.0/0`)
   - If not, click **"Add IP Address"** → **"Allow Access from Anywhere"** → **"Confirm"**

### Step 3: Check Vercel Function Logs

1. In Vercel dashboard, go to your backend project
2. Click **"Functions"** tab
3. Click on a recent function invocation
4. Check the logs for the actual error message
5. Look for errors like:
   - "MONGO_URI not set"
   - "Authentication failed"
   - "Network timeout"

### Step 4: Verify Connection String Format

Your `MONGO_URI` should be:
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mindtrack?retryWrites=true&w=majority
```

**Important:**
- Replace `YOUR_USERNAME` with your MongoDB Atlas username
- Replace `YOUR_PASSWORD` with your actual password (URL-encode special characters if needed)
- Replace `cluster0.xxxxx` with your actual cluster name
- The `/mindtrack` at the end is the database name
- If your password has special characters, URL-encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - etc.

### Step 5: Redeploy After Changes

After updating environment variables:
1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 6: Test the Connection

Visit: `https://mindtrack-gamma.vercel.app/api/health`

Should return: `{"status":"ok"}`

If it returns an error, check the function logs.



