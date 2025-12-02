# Twilio Setup Guide - Step by Step (For Beginners)

## 🎯 What We're Doing

We're setting up Twilio so that when someone has a crisis (red alert), the system will automatically call their doctor and emergency contacts with a voice message.

---

## Step 1: Create a Twilio Account (FREE)

### 1.1 Go to Twilio Website
1. Open your web browser (Chrome, Firefox, etc.)
2. Go to: **https://www.twilio.com/try-twilio**
3. You'll see a sign-up form

### 1.2 Fill Out the Form
1. **First Name**: Type your first name
2. **Last Name**: Type your last name
3. **Email**: Type your email address (use a real one, you'll need to verify it)
4. **Password**: Create a strong password (write it down somewhere safe!)
5. **Country**: Select "Bangladesh" from the dropdown
6. Check the box that says you agree to the terms
7. Click the big **"Start your free trial"** button

### 1.3 Verify Your Email
1. Check your email inbox
2. Look for an email from Twilio
3. Click the verification link in the email
4. This will open a new page confirming your email is verified

### 1.4 Verify Your Phone Number
1. Twilio will ask for your phone number
2. Enter your Bangladesh phone number (with country code: +880)
   - Example: If your number is 01712345678, enter: **+8801712345678**
3. Choose how to verify:
   - **SMS** (text message) - Recommended
   - **Voice Call** (phone call)
4. Enter the code you receive
5. Click **Verify**

✅ **Congratulations!** You now have a Twilio account with $15.50 free credits!

---

## Step 2: Get Your Twilio Credentials

### 2.1 Log Into Twilio Console
1. Go to: **https://www.twilio.com/console**
2. Log in with your email and password

### 2.2 Find Your Account SID
1. On the dashboard (main page), look for a section called **"Account Info"** or **"Project Info"**
2. You'll see something like:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **Copy this entire Account SID** (it starts with "AC" and has 34 characters)
4. Paste it somewhere safe (like a Notepad file) - you'll need it later

### 2.3 Find Your Auth Token
1. Still on the dashboard, look for **"Auth Token"**
2. You'll see dots or stars: `••••••••••••••••`
3. Click the **eye icon** 👁️ next to it to reveal the token
4. **Copy the entire Auth Token** (it's a long string of letters and numbers)
5. Paste it in your Notepad file - **keep this secret!**

✅ **You now have:**
- Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Auth Token: `your_secret_token_here`

---

## Step 3: Get a Free Twilio Phone Number

### 3.1 Go to Phone Numbers Section
1. In the Twilio Console, look at the left sidebar
2. Click on **"Phone Numbers"** → **"Manage"** → **"Buy a number"**
   - OR click this link: https://www.twilio.com/console/phone-numbers/search

### 3.2 Search for a Number
1. You'll see a search form
2. **Country**: Select **"United States"** (US numbers are cheapest and work for calling Bangladesh)
3. **Capabilities**: Make sure **"Voice"** is checked ✅
4. Click **"Search"**

### 3.3 Buy a Number
1. You'll see a list of available numbers
2. Click **"Buy"** on any number (they're all the same, just pick one)
3. Confirm the purchase (it's FREE during trial!)
4. Click **"Buy this number"**

✅ **You now have a Twilio phone number!** It will look like: `+1234567890`

### 3.4 Copy Your Phone Number
1. Go back to **"Phone Numbers"** → **"Manage"** → **"Active numbers"**
2. You'll see your new number
3. **Copy the full number** (including the + sign)
4. Add it to your Notepad file

✅ **You now have:**
- Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Auth Token: `your_secret_token_here`
- Phone Number: `+1234567890`

---

## Step 4: Verify Phone Numbers You Want to Call

### 4.1 Go to Verified Caller IDs
1. In Twilio Console, go to **"Phone Numbers"** → **"Verified Caller IDs"**
   - OR click: https://www.twilio.com/console/phone-numbers/verified

### 4.2 Add Your Test Number
1. Click **"Add a new Caller ID"** button
2. Enter a phone number you want to test with:
   - Format: `+8801712345678` (your Bangladesh number with +880)
3. Choose verification method:
   - **Call Me** (recommended - you'll get a call with a code)
   - **Text Me** (you'll get an SMS with a code)
4. Click **"Verify"**
5. Answer the call or check SMS for the code
6. Enter the code
7. Click **"Verify"**

### 4.3 Add More Numbers (Optional)
Repeat Step 4.2 for:
- Your doctor's number
- Emergency contact numbers
- Any other numbers you want to test with

**Important**: During the free trial, you can ONLY call verified numbers. After you upgrade (add money), you can call any number.

✅ **Your test numbers are now verified!**

---

## Step 5: Set Up Your Vercel Environment Variables

### 5.1 Go to Your Vercel Project
1. Go to: **https://vercel.com**
2. Log in to your account
3. Click on your **MindTrack** project

### 5.2 Open Settings
1. Click on **"Settings"** tab (at the top)
2. Click on **"Environment Variables"** (in the left sidebar)

### 5.3 Add Twilio Variables

Add these **5 variables** one by one:

#### Variable 1: ENABLE_VOICE_CALLS
1. Click **"Add New"** button
2. **Key**: Type exactly: `ENABLE_VOICE_CALLS`
3. **Value**: Type exactly: `true`
4. **Environment**: Select **"Production"** (or all three: Production, Preview, Development)
5. Click **"Save"**

#### Variable 2: TWILIO_ACCOUNT_SID
1. Click **"Add New"** button
2. **Key**: Type exactly: `TWILIO_ACCOUNT_SID`
3. **Value**: Paste your Account SID (the one that starts with "AC")
4. **Environment**: Select **"Production"** (or all three)
5. Click **"Save"**

#### Variable 3: TWILIO_AUTH_TOKEN
1. Click **"Add New"** button
2. **Key**: Type exactly: `TWILIO_AUTH_TOKEN`
3. **Value**: Paste your Auth Token (the secret one you copied)
4. **Environment**: Select **"Production"** (or all three)
5. Click **"Save"**

#### Variable 4: TWILIO_PHONE_NUMBER
1. Click **"Add New"** button
2. **Key**: Type exactly: `TWILIO_PHONE_NUMBER`
3. **Value**: Paste your Twilio phone number (the one you bought, like +1234567890)
4. **Environment**: Select **"Production"** (or all three)
5. Click **"Save"**

#### Variable 5: API_URL (IMPORTANT!)
1. Click **"Add New"** button
2. **Key**: Type exactly: `API_URL`
3. **Value**: Your Vercel backend URL
   - **From your error logs, it should be**: `https://mindtrack-gamma.vercel.app`
   - Find it in Vercel → Your Project → Settings → Domains
   - OR check your Vercel deployment URL
   - **MUST start with https://** (not http://)
   - **MUST NOT have a trailing slash** (no / at the end)
   - Example: `https://mindtrack-gamma.vercel.app` ✅
   - Wrong: `http://mindtrack-gamma.vercel.app` ❌
   - Wrong: `https://mindtrack-gamma.vercel.app/` ❌
4. **Environment**: Select **"Production"** (or all three: Production, Preview, Development)
5. Click **"Save"**
   
**⚠️ CRITICAL**: This is the most common mistake! Make sure:
- URL starts with `https://`
- URL does NOT end with `/`
- URL is your actual Vercel backend domain

✅ **All 5 variables are now added!**

### 5.4 Redeploy Your Project
1. Go to **"Deployments"** tab (at the top)
2. Find your latest deployment
3. Click the **three dots** (⋯) next to it
4. Click **"Redeploy"**
5. Wait for it to finish (takes 1-2 minutes)

✅ **Your project is now redeployed with Twilio settings!**

---

## Step 6: Test It!

### 6.1 Add Emergency Contact
1. Log into your MindTrack app as a **Doctor**
2. Go to a patient's profile
3. Click **"📞 Manage Emergency Contacts"**
4. Add a contact with:
   - **Name**: Your name (for testing)
   - **Phone**: Your verified phone number (format: +8801712345678)
   - **Relationship**: Friend
5. Click **"Add Contact"**

### 6.2 Trigger a Red Alert
1. Log out and log in as a **Patient**
2. Go to **"AI Assessment"** page
3. Fill out the assessment
4. In the last question, type something like:
   - `"I am feeling like ending my life"`
   - `"I want to kill myself"`
   - `"I feel like ending me"`
5. Click **"Generate Summary"**

### 6.3 Check the Result
1. You should see a **"🚨 Red Alert Summary"** (red box)
2. It will show:
   - Email notifications: ✅ Sent or ❌ Not sent
   - Voice calls: ✅ Sent or ❌ Not sent
3. **You should receive a phone call!**
4. The call will play a message (currently text-to-speech)
5. The call will hang up automatically

✅ **If you received the call, everything is working!**

---

## Step 7: Add Your Own Voice Recording (Optional)

### 7.1 Record Your Message
1. Record a voice message (in Bengali or English):
   - **Bengali Script**: See `VOICE_SCRIPT_BANGLA.md` for the complete Bengali script
   - **English Example**: *"Hello, this is an urgent alert from MindTrack. [Patient Name] has indicated they may be in crisis and needs immediate support. Please reach out to them as soon as possible. If this is an emergency, please call 999. Thank you."*
2. Save it as **MP3** or **WAV** file
3. Keep it short (20-30 seconds)
4. **Speak clearly and slowly** - Practice first!

### 7.2 Upload to a Free Hosting Service

**Option A: GitHub (Easiest & Free)**
1. Go to your GitHub repository
2. **Method 1 - Using GitHub Desktop (Recommended)**:
   - Download GitHub Desktop: https://desktop.github.com/
   - Clone your repository
   - Create a `public` folder
   - Copy your MP3 file into the `public` folder
   - Commit and push
3. **Method 2 - Using Git Command Line**:
   ```bash
   mkdir -p public
   cp your-file.mp3 public/red-alert-voice-bangla.mp3
   git add public/red-alert-voice-bangla.mp3
   git commit -m "Add voice alert"
   git push
   ```
4. Go to your GitHub repo on the web
5. Navigate to: `public/red-alert-voice-bangla.mp3`
6. Click on the file
7. Click **"Raw"** button
8. Copy the URL (looks like: `https://raw.githubusercontent.com/username/repo/main/public/red-alert-voice-bangla.mp3`)
   
**Note**: See `VOICE_SCRIPT_BANGLA.md` for detailed Bengali script and step-by-step instructions!

**Option B: Vercel Blob (Free)**
1. Install: `npm install @vercel/blob`
2. Upload your file using Vercel Blob
3. Get the public URL

**Option C: Any Free File Hosting**
- Upload to any service that gives you a direct link
- Make sure the URL ends with `.mp3` or `.wav`

### 7.3 Add to Vercel Environment Variables
1. Go back to Vercel → Your Project → Settings → Environment Variables
2. Click **"Add New"**
3. **Key**: Type exactly: `RED_ALERT_VOICE_AUDIO_URL`
4. **Value**: Paste your audio file URL (from Step 7.2)
5. **Environment**: Select **"Production"** (or all three)
6. Click **"Save"**
7. **Redeploy** your project (Step 5.4)

✅ **Now your custom voice will play instead of text-to-speech!**

---

## 🎉 You're Done!

### What You Have Now:
- ✅ Twilio account with free credits
- ✅ Twilio phone number
- ✅ All credentials configured
- ✅ System ready to make emergency calls

### How It Works:
1. Patient fills assessment and indicates crisis
2. System automatically calls:
   - Doctor's phone number
   - All emergency contacts
3. Each call plays your voice message
4. Call hangs up automatically (one-way only)

### Important Notes:
- **Free Trial**: You can only call verified numbers
- **Free Credits**: $15.50 = ~1,200 minutes of calls (plenty for testing!)
- **After Trial**: You'll need to add money (~$0.013/minute for US calls)
- **Bangladesh Calls**: ~$0.056/minute (more expensive)

---

## 🆘 Troubleshooting

### Problem: "voice_calls_disabled" error
**Solution**: 
- Check `ENABLE_VOICE_CALLS=true` is set in Vercel
- Redeploy your project

### Problem: "twilio_not_configured" error
**Solution**:
- Check all 5 environment variables are set correctly
- Make sure no extra spaces in values
- Redeploy after adding variables

### Problem: "invalid_phone" error
**Solution**:
- Phone numbers must include country code
- Format: `+8801712345678` (not `01712345678`)
- No spaces or dashes

### Problem: Calls not going through / "Url is not a valid URL: http://localhost:5000"
**Solution**:
- **This is the #1 issue!** Your `API_URL` is not set correctly
- Go to Vercel → Settings → Environment Variables
- Check `API_URL` is set to: `https://your-backend.vercel.app` (with https://, no trailing slash)
- From your logs, it should be: `https://mindtrack-gamma.vercel.app`
- After fixing, **Redeploy** your project
- Verify the number in Twilio Console (for trial accounts)
- Check Twilio account has credits (check dashboard)
- Check phone number format is correct
- Look at Vercel function logs for errors

### Problem: No call received
**Solution**:
- Make sure number is verified in Twilio Console
- Check your phone is on and has signal
- Wait a few seconds (calls take time to connect)
- Check Vercel logs for errors

---

## 📞 Need Help?

- **Twilio Support**: https://support.twilio.com
- **Twilio Console**: https://www.twilio.com/console
- **Check Your Credits**: Twilio Console → Dashboard (shows remaining balance)

---

## ✅ Quick Checklist

Before testing, make sure you have:
- [ ] Twilio account created
- [ ] Account SID copied
- [ ] Auth Token copied
- [ ] Twilio phone number purchased
- [ ] Test phone number verified
- [ ] All 5 environment variables added to Vercel
- [ ] Project redeployed
- [ ] Emergency contact added in app
- [ ] Ready to test!

**Good luck! 🚀**

