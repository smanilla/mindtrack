# MongoDB Atlas Network Access Setup

## Step 1: Allow Access from Anywhere

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Log in to your account
3. In the left sidebar, click **"Network Access"** (under Security)
4. Click **"Add IP Address"** button (top right)
5. In the popup:
   - Click **"Allow Access from Anywhere"** button
   - This will automatically fill in `0.0.0.0/0`
   - Add a comment (optional): "Vercel deployment"
   - Click **"Confirm"**
6. Wait 1-2 minutes for the change to take effect

**Important:** The IP address `0.0.0.0/0` means "allow from anywhere" - this is safe for Vercel deployments.

## Step 2: URL-Encode Your Password

If your MongoDB password contains special characters, you need to URL-encode them:

- `!` becomes `%21`
- `$` becomes `%24`
- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- `&` becomes `%26`
- `*` becomes `%2A`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `?` becomes `%3F`
- `[` becomes `%5B`
- `]` becomes `%5D`

### Example:
If your password is: `MyP@ss!$word`
The URL-encoded version is: `MyP%40ss%21%24word`

### How to URL-encode:
1. Use an online tool: https://www.urlencoder.org/
2. Or use this format in your connection string:
   - Original: `mongodb+srv://username:MyP@ss!$word@cluster0.xxxxx.mongodb.net/mindtrack`
   - Encoded: `mongodb+srv://username:MyP%40ss%21%24word@cluster0.xxxxx.mongodb.net/mindtrack`

## Step 3: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Backend Project
2. Settings → Environment Variables
3. Find `MONGO_URI`
4. Click "Edit" or delete and recreate it
5. Use the URL-encoded password in the connection string
6. Make sure it's set for Production, Preview, and Development
7. Click "Save"
8. **Redeploy** your backend (Deployments → ... → Redeploy)


