# Gmail Authentication Error Fix

## Error You're Seeing
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

This means Gmail is rejecting your credentials. Here's how to fix it:

---

## Quick Fix Steps

### Step 1: Verify You're Using App Password (Not Regular Password)

**❌ WRONG**: Using your regular Gmail password
**✅ CORRECT**: Using a 16-character App Password

### Step 2: Generate a Fresh App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if needed
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Type: `MindTrack` or `Vercel`
6. Click **Generate**
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables

#### For Vercel:
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Find `SMTP_PASS`
3. Click **Edit**
4. Paste the **full 16-character App Password** (you can include or remove spaces, both work)
5. Click **Save**
6. **Redeploy** your application

#### For Local (.env file):
1. Open `backend/.env`
2. Find the line: `SMTP_PASS=...`
3. Replace with your new App Password:
   ```env
   SMTP_PASS=abcdefghijklmnop
   ```
   (Remove spaces or keep them, both work)
4. Save the file
5. Restart your server

### Step 4: Verify Settings

Make sure these are correct in your environment variables:

```env
ENABLE_ALERT_EMAILS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com    # Must match the Gmail account
SMTP_PASS=your-16-char-app-password  # App Password, NOT regular password
MAIL_FROM=your-email@gmail.com
```

**Important Checks:**
- ✅ `SMTP_USER` must be the **exact Gmail address** you used to generate the App Password
- ✅ `SMTP_PASS` must be the **App Password**, not your regular Gmail password
- ✅ 2-factor authentication must be **enabled** on that Gmail account

---

## Common Mistakes

### Mistake 1: Using Regular Password
**Symptom**: Error 535 "Username and Password not accepted"
**Fix**: Generate and use App Password instead

### Mistake 2: Wrong Email Address
**Symptom**: Error 535
**Fix**: Make sure `SMTP_USER` matches the Gmail account exactly

### Mistake 3: 2FA Not Enabled
**Symptom**: Can't generate App Password
**Fix**: Enable 2-step verification first at https://myaccount.google.com/security

### Mistake 4: Copying Password Incorrectly
**Symptom**: Error 535
**Fix**: 
- Copy the entire 16-character password
- Make sure no extra spaces or characters
- Try regenerating if unsure

### Mistake 5: Using Old/Revoked Password
**Symptom**: Error 535
**Fix**: Generate a new App Password

---

## Step-by-Step: Generate New App Password

1. **Go to App Passwords page**:
   ```
   https://myaccount.google.com/apppasswords
   ```

2. **If you see "App passwords aren't available"**:
   - You need to enable 2-Step Verification first
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Then come back to App Passwords

3. **Generate App Password**:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: `MindTrack`
   - Click **Generate**

4. **Copy the password**:
   - It will show: `xxxx xxxx xxxx xxxx` (16 characters)
   - Copy the entire thing

5. **Use it in your environment variables**:
   - Paste into `SMTP_PASS`
   - You can remove spaces or keep them (both work)

---

## Testing After Fix

1. **Redeploy** (if using Vercel) or **restart server** (if local)

2. **Check server logs** - you should see:
   ```
   ✅ Email transporter initialized successfully
   ```

3. **Trigger a test red alert**

4. **Check the response** - should show:
   ```json
   {
     "emails": {
       "sent": true,
       "recipients": ["doctor@example.com", "contact@example.com"],
       "count": 2
     }
   }
   ```

5. **Check email inboxes** - you should receive the red alert email

---

## Still Not Working?

### Check 1: Verify App Password Format
- Should be exactly 16 characters
- Can have spaces or not (both work)
- Example: `abcd efgh ijkl mnop` or `abcdefghijklmnop`

### Check 2: Verify Email Address
- Must match exactly (case-sensitive for the part before @)
- `john.doe@gmail.com` ≠ `John.Doe@gmail.com` (but Gmail usually ignores case)

### Check 3: Check 2FA Status
- Go to: https://myaccount.google.com/security
- Verify "2-Step Verification" shows "On"

### Check 4: Try Different Port
If port 587 doesn't work, try 465 (SSL):
```env
SMTP_PORT=465
```
And update the code to use `secure: true` (but current code uses port 587 which is correct)

### Check 5: Check Gmail Account Status
- Make sure the Gmail account is active
- Not suspended or restricted
- Can send emails normally from Gmail web interface

---

## Security Note

If you've shared your App Password or think it's compromised:
1. Go to: https://myaccount.google.com/apppasswords
2. Find the App Password you created
3. Click **Delete** (trash icon)
4. Generate a new one
5. Update your environment variables

---

## Quick Checklist

- [ ] 2-Step Verification is enabled
- [ ] Generated App Password (not using regular password)
- [ ] Copied full 16-character App Password
- [ ] Updated `SMTP_PASS` in environment variables
- [ ] `SMTP_USER` matches Gmail account exactly
- [ ] Redeployed/Restarted after updating variables
- [ ] Checked server logs for initialization message

---

## Need More Help?

If you're still getting the error after following these steps:

1. **Double-check App Password**:
   - Generate a completely new one
   - Make sure you're copying it correctly

2. **Verify Environment Variables**:
   - Use the diagnostic endpoint: `/api/ai-assessment/twilio-config-check`
   - Check that all values are set correctly

3. **Test with Different Gmail Account**:
   - Try setting up with a different Gmail account
   - This will help identify if it's account-specific

4. **Check Vercel Environment Variables**:
   - Make sure you're editing the correct environment (Production/Preview/Development)
   - Redeploy after making changes

The error message is clear: Gmail is rejecting your credentials. The solution is almost always to use a proper App Password instead of your regular password.



