# Voice Script in Bengali (Bangla) for Red Alert

## 📝 Script (Bengali/Bangla)

### Full Script:
```
নমস্কার, এটি MindTrack থেকে একটি জরুরি সতর্কতা বার্তা। 

[রোগীর নাম] একটি মানসিক সংকটের মধ্যে রয়েছে বলে জানিয়েছেন এবং তাদের তাত্ক্ষণিক সহায়তার প্রয়োজন। 

অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব তাদের সাথে যোগাযোগ করুন এবং তাদের সহায়তা করুন। 

যদি এটি একটি জরুরি অবস্থা হয়, অনুগ্রহ করে ৯৯৯ নম্বরে কল করুন। 

ধন্যবাদ।
```

### English Translation:
```
Hello, this is an urgent alert message from MindTrack.

[Patient Name] has indicated they are in a mental health crisis and need immediate support.

Please reach out to them as soon as possible and help them.

If this is an emergency situation, please call 999.

Thank you.
```

---

## 🎙️ How to Record

### Step 1: Prepare Your Recording
1. **Find a quiet place** - No background noise
2. **Speak clearly and slowly** - Don't rush
3. **Use a calm, professional tone** - This is serious but not panicked
4. **Practice first** - Read the script 2-3 times before recording
5. **Keep it under 30 seconds** - Short and clear

### Step 2: Record Using Your Phone
**Option A: Android Phone**
1. Open **Voice Recorder** app (built-in)
2. Tap the **Record** button (red circle)
3. Read the script clearly
4. Tap **Stop** when done
5. Save the file

**Option B: iPhone**
1. Open **Voice Memos** app
2. Tap the **Record** button (red circle)
3. Read the script clearly
4. Tap **Stop** when done
5. Save the recording

**Option C: Computer**
1. Use **Audacity** (free software) - https://www.audacityteam.org/
2. Or use online recorder: https://online-voice-recorder.com/
3. Record your message
4. Export as MP3

### Step 3: Convert to MP3 (if needed)
- If your phone saves as M4A or other format:
  - Use online converter: https://cloudconvert.com/
  - Upload your file
  - Convert to MP3
  - Download the MP3 file

### Step 4: Name Your File
- Name it: `red-alert-voice-bangla.mp3`
- Or: `emergency-alert-bangla.mp3`
- Keep the name simple (no spaces, use dashes)

---

## 📤 Upload to GitHub

### Step 1: Create a Folder in Your GitHub Repo
1. Go to your GitHub repository: `https://github.com/your-username/your-repo`
2. Click **"Add file"** → **"Create new file"**
3. Type: `public/red-alert-voice-bangla.mp3`
   - The `public/` part creates a folder
   - The filename is your MP3 file
4. **Don't upload yet!** We need to use a different method for binary files

### Step 2: Upload Using GitHub Desktop (Easiest)
1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Clone your repository** to your computer
3. **Create a folder** called `public` in your repo folder
4. **Copy your MP3 file** into the `public` folder
5. **Commit and push** using GitHub Desktop

### Step 3: Upload Using Git Command Line
```bash
# Navigate to your repo folder
cd your-repo-name

# Create public folder (if it doesn't exist)
mkdir -p public

# Copy your MP3 file to the public folder
# (Copy the file manually or use:)
cp /path/to/your/red-alert-voice-bangla.mp3 public/

# Add the file
git add public/red-alert-voice-bangla.mp3

# Commit
git commit -m "Add Bengali voice alert message"

# Push to GitHub
git push
```

### Step 4: Get the Raw URL
1. Go to your GitHub repository on the web
2. Navigate to: `public/red-alert-voice-bangla.mp3`
3. Click on the file
4. Click the **"Raw"** button (top right)
5. **Copy the URL** - It will look like:
   ```
   https://raw.githubusercontent.com/your-username/your-repo/main/public/red-alert-voice-bangla.mp3
   ```
https://github.com/smanilla/mindtrack/blob/c0152815309e62fff7b67986a10fd25381261406/public/red-alert-voice-bangla.mp3
---

## ⚙️ Add to Vercel

### Step 1: Go to Vercel Environment Variables
1. Go to **Vercel** → Your **Backend** Project → **Settings** → **Environment Variables**
   - ⚠️ **IMPORTANT**: This must be added to your **BACKEND** project, not frontend!
   - The backend handles all Twilio voice calls

### Step 2: Add the URL
1. Click **"Add New"**
2. **Key**: `RED_ALERT_VOICE_AUDIO_URL`
3. **Value**: Paste your GitHub raw URL
   ```
   https://raw.githubusercontent.com/your-username/your-repo/main/public/red-alert-voice-bangla.mp3
   ```
4. **Environment**: Select **"Production"** (or all three)
5. Click **"Save"**

### Step 3: Redeploy
1. Go to **"Deployments"** tab
2. Click **three dots** (⋯) on latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

---

## ✅ Test It

1. Trigger a red alert (use crisis language in assessment)
2. You should receive a call
3. **Your recorded Bengali voice will play** instead of text-to-speech!
4. Call will hang up automatically after the message

---

## 📋 Quick Checklist

- [ ] Recorded the Bengali script
- [ ] Converted to MP3 format
- [ ] Uploaded to GitHub (in `public/` folder)
- [ ] Got the raw URL from GitHub
- [ ] Added `RED_ALERT_VOICE_AUDIO_URL` to Vercel
- [ ] Redeployed the project
- [ ] Tested and received the call with your voice

---

## 🎯 Tips for Better Recording

1. **Speak slowly** - Give time for listeners to understand
2. **Clear pronunciation** - Especially important numbers (999)
3. **Calm tone** - Professional but caring
4. **No background noise** - Record in a quiet room
5. **Test playback** - Listen to your recording before uploading
6. **Keep it short** - Under 30 seconds is ideal

---

## 🔄 Alternative: Use GitHub Releases

If the file is too large for regular GitHub:

1. Go to your repo → **"Releases"** → **"Create a new release"**
2. Upload your MP3 file as an attachment
3. Get the direct download URL
4. Use that URL in Vercel instead

---

**Good luck with your recording! 🎙️**

