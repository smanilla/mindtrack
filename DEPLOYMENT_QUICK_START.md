# 🚀 Quick Start - Vercel Deployment

## Before You Start

1. **Push your code to GitHub** (if not already done)
2. **Set up MongoDB Atlas** (free tier) - see full guide for details
3. **Create Vercel account** at [vercel.com](https://vercel.com)

## Deployment Steps (TL;DR)

### Backend Deployment
1. Go to Vercel Dashboard → Add New Project
2. Import your GitHub repo
3. **Set Root Directory to `backend`**
4. Framework: **Other**
5. Add Environment Variables:
   - `MONGO_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Any random secret string
   - `OPENAI_API_KEY` = (optional)
6. Deploy
7. **Copy the backend URL**

### Frontend Deployment
1. Go to Vercel Dashboard → Add New Project
2. Import the same GitHub repo
3. **Set Root Directory to `frontend`**
4. Framework: **Vite** (auto-detected)
5. Add Environment Variable:
   - `VITE_API_URL` = Your backend URL (from step above)
6. Deploy
7. **Done!** Visit your frontend URL

## Important Notes

- ✅ **Root Directory is CRITICAL** - must be set correctly!
- ✅ Backend and Frontend are **separate projects** in Vercel
- ✅ Environment variables must be set in both projects
- ✅ MongoDB connection string should NOT have `<password>` - replace it!
- ✅ Frontend `VITE_API_URL` should NOT end with `/api`

## Need Help?

See the full guide: `VERCEL_DEPLOYMENT_GUIDE.md`


