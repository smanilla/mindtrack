# Gmail Email Setup - Complete Step-by-Step Guide

This guide will walk you through setting up Gmail to send red alert emails in your MindTrack application.

## Prerequisites
- A Gmail account
- Access to your backend environment variables (local `.env` file or Vercel dashboard)

---

## Step 1: Enable 2-Factor Authentication on Gmail

Gmail requires 2-factor authentication before you can generate an App Password.

### 1.1 Go to Google Account Settings
1. Open your browser and go to: https://myaccount.google.com/
2. Sign in with your Gmail account

### 1.2 Enable 2-Step Verification
1. Click on **Security** in the left sidebar
2. Under "Signing in to Google", find **2-Step Verification**
3. Click **Get started** (or **2-Step Verification** if already enabled)
4. Follow the prompts to set up 2-step verification:
   - Enter your password
   - Choose a verification method (phone number, authenticator app, etc.)
   - Complete the setup

**Note**: If 2-step verification is already enabled, you can skip to Step 2.

---

## Step 2: Generate Gmail App Password

App Passwords are special passwords that allow third-party apps to access your Gmail account securely.

### 2.1 Access App Passwords
1. Go back to: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Scroll down and click on **App passwords**
   - You may need to sign in again

### 2.2 Create App Password
1. You'll see a page titled "App passwords"
2. Under "Select app", choose **Mail**
3. Under "Select device", choose **Other (Custom name)**
4. Type: `MindTrack Backend` (or any name you prefer)
5. Click **Generate**

### 2.3 Copy Your App Password
1. Google will display a 16-character password (with spaces)
   - Example: `abcd efgh ijkl mnop`
2. **Copy this password** - you won't be able to see it again!
3. Click **Done**

**Important**: 
- This is NOT your regular Gmail password
- This is a special App Password for your application
- Keep it secure and don't share it

---

## Step 3: Configure Environment Variables

Now you need to add these settings to your application.

### Option A: Local Development (.env file)

#### 3.1 Create/Edit .env File
1. Navigate to your `backend` folder:
   ```
   cd backend
   ```

2. Create or edit the `.env` file:
   ```bash
   # Windows (PowerShell)
   notepad .env
   
   # Mac/Linux
   nano .env
   ```

#### 3.2 Add Gmail Configuration
Add these lines to your `.env` file:
```env
# Enable Email Alerts
ENABLE_ALERT_EMAILS=true

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM=your-email@gmail.com
```

**Replace**:
- `your-email@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the App Password you generated (remove spaces)

**Example**:
```env
ENABLE_ALERT_EMAILS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcdefghijklmnop
MAIL_FROM=john.doe@gmail.com
```

#### 3.3 Save and Restart
1. Save the `.env` file
2. Restart your backend server:
   ```bash
   npm start
   # or
   npm run dev
   ```

---

### Option B: Vercel Deployment

#### 3.1 Go to Vercel Dashboard
1. Go to: https://vercel.com/
2. Sign in to your account
3. Select your MindTrack project

#### 3.2 Add Environment Variables
1. Click on **Settings** in the top menu
2. Click on **Environment Variables** in the left sidebar
3. Add each variable one by one:

   **Variable 1:**
   - **Name**: `ENABLE_ALERT_EMAILS`
   - **Value**: `true`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Name**: `SMTP_HOST`
   - **Value**: `smtp.gmail.com`
   - **Environment**: Select all
   - Click **Save**

   **Variable 3:**
   - **Name**: `SMTP_PORT`
   - **Value**: `587`
   - **Environment**: Select all
   - Click **Save**

   **Variable 4:**
   - **Name**: `SMTP_USER`
   - **Value**: `your-email@gmail.com` (replace with your Gmail)
   - **Environment**: Select all
   - Click **Save**

   **Variable 5:**
   - **Name**: `SMTP_PASS`
   - **Value**: `your-16-character-app-password` (paste your App Password)
   - **Environment**: Select all
   - Click **Save**

   **Variable 6:**
   - **Name**: `MAIL_FROM`
   - **Value**: `your-email@gmail.com` (same as SMTP_USER)
   - **Environment**: Select all
   - Click **Save**

#### 3.3 Redeploy Application
1. After adding all variables, go to **Deployments**
2. Click the **⋯** (three dots) next to your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Step 4: Verify Configuration

### 4.1 Check Diagnostic Endpoint
1. Make sure you're logged in to your application
2. Visit this URL (replace with your backend URL):
   ```
   http://localhost:5000/api/ai-assessment/twilio-config-check
   # or for Vercel:
   https://your-backend.vercel.app/api/ai-assessment/twilio-config-check
   ```

3. Look for these values in the response:
   ```json
   {
     "enableAlertEmails": true,
     "transporterInitialized": true,
     "environmentVariables": {
       "ENABLE_ALERT_EMAILS": "true",
       "SMTP_HOST": "smtp.gmail.com",
       "SMTP_USER": "your-email@gmail.com",
       "SMTP_PASS": "SET (hidden)",
       "SMTP_PORT": "587"
     }
   }
   ```

### 4.2 Check Server Logs
When you start your server, you should see:
```
✅ Email transporter initialized successfully
```

If you see errors, check:
- App Password is correct (no spaces)
- Gmail address is correct
- 2-factor authentication is enabled

---

## Step 5: Add Email Addresses to Emergency Contacts

Before emails can be sent, you need to configure who receives them.

### 5.1 Add Doctor Email
1. Make sure the patient has a doctor assigned
2. The doctor's user account must have an email address

### 5.2 Add Emergency Contact Emails
1. Log in as a **Doctor**
2. Go to **Doctor Dashboard**
3. Select a patient
4. Click **📞 Manage Emergency Contacts**
5. For each emergency contact:
   - Enter **Name**
   - Enter **Phone Number**
   - **Enter Email Address** (this is required for email alerts!)
   - Enter **Relationship** (optional)
6. Click **Add Contact** or **Update**

---

## Step 6: Test Email Sending

### 6.1 Trigger a Red Alert
1. Log in as a **Patient**
2. Go to **AI Assessment**
3. Answer the questions with crisis language (e.g., "I want to hurt myself", "I feel hopeless", etc.)
4. Submit the assessment

### 6.2 Check the Response
Look at the API response or check the frontend. You should see:
```json
{
  "notifications": {
    "emails": {
      "sent": true,
      "recipients": ["doctor@example.com", "contact@example.com"],
      "count": 2
    }
  }
}
```

### 6.3 Check Email Inboxes
1. Check the **Doctor's email inbox**
2. Check **Emergency contact email inboxes**
3. Look for an email with subject:
   ```
   🚨 MindTrack Red Alert: [Patient Name] Needs Immediate Attention
   ```

---

## Troubleshooting

### Problem: "mail_disabled" in response
**Solution**: Make sure `ENABLE_ALERT_EMAILS=true` is set

### Problem: "mail_not_configured" in response
**Solution**: Check that all SMTP variables are set:
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`

### Problem: "send_failed" error
**Possible causes**:
1. **Wrong password**: Using regular Gmail password instead of App Password
   - **Fix**: Generate a new App Password and use that

2. **2FA not enabled**: App Passwords require 2-factor authentication
   - **Fix**: Enable 2-step verification first

3. **App Password has spaces**: Copy the password exactly, spaces don't matter but make sure it's complete
   - **Fix**: Copy the full 16-character password

4. **"Less secure app access"**: This is deprecated, use App Passwords instead
   - **Fix**: Don't enable "less secure apps", use App Passwords

5. **Firewall/Network**: Some networks block SMTP
   - **Fix**: Try from a different network or check firewall settings

### Problem: Emails go to spam
**Solution**: 
- Check spam/junk folder
- Mark as "Not Spam" to improve deliverability
- Consider using a custom domain email for production

### Problem: "Invalid login" error
**Solution**:
- Double-check your App Password (no typos)
- Make sure you're using the App Password, not your regular password
- Verify 2-factor authentication is enabled

---

## Security Best Practices

1. **Never commit `.env` file** to Git
   - Add `.env` to your `.gitignore` file

2. **Use different Gmail accounts** for:
   - Development (local testing)
   - Production (live application)

3. **Rotate App Passwords** periodically:
   - Generate new App Password
   - Update environment variables
   - Delete old App Password

4. **Monitor email usage**:
   - Check Gmail account activity regularly
   - Review sent emails in Gmail

---

## Quick Reference

### Gmail SMTP Settings
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@gmail.com
ENABLE_ALERT_EMAILS=true
```

### Common Ports
- **587**: TLS (recommended, most common)
- **465**: SSL (alternative)
- **25**: Usually blocked by ISPs

---

## Need Help?

If you're still having issues:

1. **Check server logs** for detailed error messages
2. **Use diagnostic endpoint**: `/api/ai-assessment/twilio-config-check`
3. **Verify App Password**: Generate a new one and try again
4. **Test SMTP connection**: Use an email testing tool to verify credentials

---

## Summary Checklist

- [ ] Enabled 2-factor authentication on Gmail
- [ ] Generated App Password
- [ ] Added all environment variables to `.env` (local) or Vercel
- [ ] Restarted server / Redeployed (Vercel)
- [ ] Verified configuration with diagnostic endpoint
- [ ] Added email addresses to emergency contacts
- [ ] Tested red alert and received emails

Once all steps are complete, your Gmail email alerts should be working! 🎉

