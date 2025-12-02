# How to Upload Audio File - Complete Guide

## Step 1: Get Your Doctor Token

### Method A: From Browser (Easiest)
1. **Log into your app as a doctor**
2. **Open browser console** (Press F12)
3. **Go to Console tab**
4. **Type this and press Enter**:
   ```javascript
   localStorage.getItem('token')
   ```
5. **Copy the token** (it's a long string starting with `eyJ...`)
6. **Save it somewhere** - you'll need it for the upload

### Method B: From Network Tab
1. **Log into your app as a doctor**
2. **Open browser console** (Press F12)
3. **Go to Network tab**
4. **Refresh the page or navigate**
5. **Find the request** that has `token` in the response
6. **Copy the token value**

### Method C: Login API Response
1. **Make a login request** to: `POST /api/auth/login`
2. **Body**: `{ "email": "doctor@example.com", "password": "password" }`
3. **Response will have**: `{ "token": "eyJ...", "user": {...} }`
4. **Copy the token**

---

## Step 2: Blob Token (Already Set!)

✅ **Good news!** Vercel already created the Blob token:
- **Name**: `mindtrack_READ_WRITE_TOKEN` (or similar)
- **Location**: Vercel → Your Backend Project → Settings → Environment Variables
- **Status**: Already set and working! ✅

You don't need to do anything - it's already configured!

---

## Step 3: Upload Your Audio File

### Method A: Using Postman (Recommended)

1. **Open Postman** (or similar tool)
2. **Create new request**:
   - **Method**: `POST`
   - **URL**: `https://mindtrack-gamma.vercel.app/api/upload/audio`
3. **Headers**:
   - **Key**: `Authorization`
   - **Value**: `Bearer YOUR_DOCTOR_TOKEN` (paste the token from Step 1)
4. **Body**:
   - Select **"form-data"**
   - **Key**: `audio` (make sure it's set to **"File"** type, not Text)
   - **Value**: Click "Select Files" and choose your `red-alert-voice-bangla.mp3`
5. **Click "Send"**
6. **Copy the `publicUrl`** from the response

### Method B: Using curl (Command Line)

```bash
curl -X POST https://mindtrack-gamma.vercel.app/api/upload/audio \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN_HERE" \
  -F "audio=@/path/to/your/red-alert-voice-bangla.mp3"
```

Replace:
- `YOUR_DOCTOR_TOKEN_HERE` with the token from Step 1
- `/path/to/your/red-alert-voice-bangla.mp3` with your actual file path

### Method C: Using Browser (Simple Test)

1. **Create an HTML file** (or use browser console):
```html
<!DOCTYPE html>
<html>
<body>
  <input type="file" id="audioFile" accept="audio/*">
  <button onclick="upload()">Upload</button>
  <div id="result"></div>

  <script>
    async function upload() {
      const file = document.getElementById('audioFile').files[0];
      const formData = new FormData();
      formData.append('audio', file);
      
      const token = 'YOUR_DOCTOR_TOKEN_HERE'; // Paste your token
      
      const response = await fetch('https://mindtrack-gamma.vercel.app/api/upload/audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      document.getElementById('result').innerHTML = JSON.stringify(result, null, 2);
      console.log('Public URL:', result.publicUrl);
    }
  </script>
</body>
</html>
```

---

## Step 4: Update Environment Variable

1. **Copy the `publicUrl`** from the upload response
   - It looks like: `https://[random].public.blob.vercel-storage.com/red-alert-voice-1234567890.mp3`
2. **Go to Vercel** → Your **Backend** Project → **Settings** → **Environment Variables**
3. **Find or add**: `RED_ALERT_VOICE_AUDIO_URL`
4. **Update the value** with the `publicUrl` you copied
5. **Save**

---

## Step 5: Redeploy

1. **Go to Deployments** tab
2. **Click three dots** (⋯) on latest deployment
3. **Click "Redeploy"**
4. **Wait 1-2 minutes**

---

## Step 6: Test

1. **Trigger a red alert** (use crisis language in assessment)
2. **You should receive a call**
3. **Your recorded Bengali voice should play!** ✅

---

## Troubleshooting

### "Unauthorized" error
- Make sure you're using a **doctor** account token
- Check the token is correct (no extra spaces)
- Token might have expired - log in again to get a new one

### "No audio file provided" error
- Make sure the form field is named `audio` (exactly)
- Make sure it's set as **File** type in Postman, not Text

### Upload fails
- Check Vercel logs for errors
- Make sure file is MP3 or WAV format
- File size must be under 5MB

### Blob token not found
- The token name might be different
- Check Vercel → Environment Variables for any token with "BLOB" or "READ_WRITE" in the name
- The code will try multiple token names automatically

---

## Quick Summary

1. ✅ Get doctor token: `localStorage.getItem('token')` in browser console
2. ✅ Blob token: Already set! (mindtrack_READ_WRITE_TOKEN)
3. ✅ Upload file: POST to `/api/upload/audio` with token and file
4. ✅ Copy `publicUrl` from response
5. ✅ Update `RED_ALERT_VOICE_AUDIO_URL` in Vercel
6. ✅ Redeploy
7. ✅ Test!

Good luck! 🎙️

