# 🔧 Vercel Login Fix - Step by Step Guide

## What Was Fixed

1. **Improved login route** with better error logging and email normalization
2. **Password reset script** to fix incorrect passwords
3. **Production database script** to create/fix the doctor account

## Before Testing on Vercel

You need to do **3 things**:

### ✅ Step 1: Deploy Updated Code to Vercel

The login route has been improved. You need to push and deploy:

```bash
# Commit the changes
git add .
git commit -m "Fix login route with better error handling and email normalization"
git push

# Vercel will auto-deploy, or trigger a manual deployment
```

**Or manually deploy:**
1. Go to your Vercel dashboard
2. Select your backend project
3. Click "Redeploy" → "Redeploy" (latest deployment)

---

### ✅ Step 2: Create/Fix Doctor Account in Production Database

The doctor account needs to exist in your **production MongoDB database** (not just local).

#### Option A: Use the Production Script (Recommended)

1. **Get your production MONGO_URI** from Vercel:
   - Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables
   - Copy the `MONGO_URI` value

2. **Run the production script** with your production database:

   **Windows PowerShell:**
   ```powershell
   cd "D:\work\codes\final year project\mindtrack"
   $env:MONGO_URI="your-production-mongodb-connection-string"
   node backend/scripts/createDoctorAccountProduction.js
   ```

   **Mac/Linux:**
   ```bash
   cd /path/to/mindtrack
   MONGO_URI="your-production-mongodb-connection-string" node backend/scripts/createDoctorAccountProduction.js
   ```

   **Or create a temporary `.env` file in backend folder:**
   ```env
   MONGO_URI=your-production-mongodb-connection-string
   ```
   Then run:
   ```bash
   node backend/scripts/createDoctorAccountProduction.js
   ```

#### Option B: Use the Register API Endpoint

You can also create the account via API:

```bash
POST https://your-backend-url.vercel.app/api/auth/register
Content-Type: application/json

{
  "name": "Dr. Fatema",
  "email": "fatema@gmail.com",
  "password": "password123",
  "role": "doctor"
}
```

**Using curl:**
```bash
curl -X POST https://your-backend-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Fatema","email":"fatema@gmail.com","password":"password123","role":"doctor"}'
```

**Using Postman:**
- Method: POST
- URL: `https://your-backend-url.vercel.app/api/auth/register`
- Body (JSON):
  ```json
  {
    "name": "Dr. Fatema",
    "email": "fatema@gmail.com",
    "password": "password123",
    "role": "doctor"
  }
  ```

---

### ✅ Step 3: Verify Environment Variables in Vercel

Make sure these are set in your **Vercel backend project**:

1. Go to Vercel Dashboard → Your Backend Project → **Settings** → **Environment Variables**

2. Verify these variables exist:
   - ✅ `MONGO_URI` - Your production MongoDB connection string
   - ✅ `JWT_SECRET` - At least 10 characters (used for token signing)
   - ✅ `GOOGLE_API_KEY` - (Optional, for AI features)

3. **Important:** After adding/changing environment variables, you **must redeploy**:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

---

## Testing the Login

After completing all 3 steps above:

1. **Go to your frontend login page:**
   - `https://your-frontend-url.vercel.app/login`

2. **Try logging in with:**
   - Email: `fatema@gmail.com`
   - Password: `password123`

3. **If it still doesn't work:**
   - Check Vercel logs: Dashboard → Deployments → Latest → Functions tab
   - Look for error messages in the console
   - Check browser console (F12) for frontend errors

---

## Troubleshooting

### Still Getting 400 Bad Request?

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Backend Project → Deployments
   - Click on the latest deployment
   - Go to **Functions** tab
   - Look for error messages when you try to login

2. **Verify the account exists:**
   - Run the production script again to check
   - Or check your MongoDB database directly

3. **Check CORS:**
   - Make sure your frontend URL is in the allowed origins in `backend/server.js`
   - The frontend URL should match what's in the CORS configuration

4. **Check API URL:**
   - Verify your frontend has the correct `VITE_API_URL` environment variable
   - It should point to your backend Vercel URL

### Database Connection Issues?

- Verify `MONGO_URI` is correct in Vercel
- Check MongoDB Atlas network access (allow all IPs or add Vercel IPs)
- Make sure the database user has proper permissions

---

## Quick Checklist

Before testing login on Vercel:

- [ ] Code is deployed to Vercel (with updated login route)
- [ ] Doctor account exists in production database (created via script or API)
- [ ] Environment variables are set in Vercel (MONGO_URI, JWT_SECRET)
- [ ] Backend has been redeployed after any env var changes
- [ ] Frontend has correct VITE_API_URL pointing to backend

---

## Need Help?

If you're still having issues:
1. Check Vercel function logs for specific error messages
2. Check browser console (F12) for frontend errors
3. Verify all environment variables are set correctly
4. Make sure the account exists in the production database (not just local)
