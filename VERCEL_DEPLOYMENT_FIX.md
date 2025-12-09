# Vercel Deployment Login Fix

## Issues Fixed

### 1. CORS Error
**Problem:** Frontend at `https://mindtrack-i2on.vercel.app` couldn't access backend at `https://mindtrack-gamma.vercel.app` due to CORS policy.

**Solution:** Updated CORS configuration in `backend/server.js` to explicitly allow your frontend origin.

### 2. 500 Internal Server Error
**Problem:** Serverless function was crashing, likely due to missing environment variables.

**Solution:** 
- Added validation for `JWT_SECRET` and `MONGO_URI` at startup
- Added better error handling in login route
- Improved error messages

## Required Vercel Environment Variables

Make sure these are set in your **Vercel project settings** (for the backend deployment):

1. **JWT_SECRET**
   - Minimum 10 characters
   - Example: `your-super-secret-jwt-key-min-32-chars-recommended`
   - Used for signing authentication tokens

2. **MONGO_URI**
   - Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/mindtrack`

3. **GOOGLE_API_KEY** (optional, for AI features)
   - Your Google Gemini API key

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `JWT_SECRET`
   - **Value**: Your secret key (at least 10 characters)
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for `MONGO_URI` and `GOOGLE_API_KEY`
5. **Redeploy** your backend after adding variables

## Testing the Fix

1. **Check Environment Variables:**
   - Verify all required variables are set in Vercel
   - Redeploy if you just added them

2. **Test Login:**
   - Go to your frontend: `https://mindtrack-i2on.vercel.app/login`
   - Try logging in with:
     - Email: `sfatemon@gmail.com`
     - Password: `password123`

3. **Check Vercel Logs:**
   - Go to your Vercel project → **Deployments** → Click on latest deployment → **Functions** tab
   - Check for any error messages

## If Still Not Working

1. **Check Vercel Function Logs:**
   - Look for errors related to:
     - Missing `JWT_SECRET`
     - Missing `MONGO_URI`
     - Database connection failures

2. **Verify Frontend API URL:**
   - Make sure your frontend `.env` or Vercel environment variables have:
     - `VITE_API_URL=https://mindtrack-gamma.vercel.app`

3. **Test Backend Directly:**
   - Try accessing: `https://mindtrack-gamma.vercel.app/api/health`
   - Should return: `{"status":"ok"}`

4. **Create Doctor Account:**
   - If the doctor account doesn't exist, create it via API:
     ```bash
     POST https://mindtrack-gamma.vercel.app/api/auth/register
     {
       "name": "Dr. Sfatemon",
       "email": "sfatemon@gmail.com",
       "password": "password123",
       "role": "doctor"
     }
     ```

## Notes

- After adding environment variables in Vercel, you **must redeploy** for changes to take effect
- CORS is now configured to allow your frontend origin
- All errors now include better logging for debugging

