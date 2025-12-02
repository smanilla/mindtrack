# Twilio Setup Guide for MindTrack

## 📋 Overview

Twilio is used to send voice calls to emergency contacts and doctors during red alert situations. This guide covers setup, pricing, and alternatives.

## 🆓 Is Twilio Free?

**Short Answer**: Yes, for testing! Twilio offers a **free trial** with $15.50 in credits.

### Free Trial Details:
- ✅ **$15.50 free credits** to start
- ✅ Can verify your own phone number for testing
- ✅ Voice calls cost ~$0.013 per minute (US)
- ⚠️ **Limitations**: 
  - Can only call verified numbers during trial
  - Calls include "Sent from a Twilio trial account" message
  - Must upgrade to remove trial restrictions

### After Trial:
- Voice calls: ~$0.013/minute (US domestic)
- Phone number: ~$1/month
- **Estimated cost**: ~$0.10-0.20 per red alert call (1-2 minutes)

## 🚀 Setup Instructions

### Step 1: Create Twilio Account

1. Visit [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up with:
   - First name, last name
   - Email address
   - Password
3. Verify your email address
4. Verify your phone number (you'll receive a code)

### Step 2: Get Your Credentials

1. Log into [Twilio Console](https://www.twilio.com/console)
2. On the dashboard, find:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)
3. Copy both values

### Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select:
   - Country: Your country
   - Capabilities: Voice
3. Click **Buy** (free during trial, ~$1/month after)

### Step 4: Verify Test Numbers (For Trial)

1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter phone numbers you want to test with
4. Verify via SMS or call

### Step 5: Configure Environment Variables

**Important**: The `API_URL` must be your **public Vercel backend URL** (not localhost) for TwiML to work in production.

Add these to your `.env` file (or Vercel environment variables):

```env
# Twilio Configuration
ENABLE_VOICE_CALLS=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# API URL (for TwiML endpoint - MUST be your public Vercel backend URL)
API_URL=https://your-backend.vercel.app
```

**For Vercel Deployment:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add each variable above
3. Make sure `API_URL` is set to your actual Vercel backend URL (e.g., `https://mindtrack-backend.vercel.app`)
4. Redeploy after adding variables

### Step 6: Deploy to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add all the variables from Step 5:
   - `ENABLE_VOICE_CALLS` = `true`
   - `TWILIO_ACCOUNT_SID` = (your Account SID)
   - `TWILIO_AUTH_TOKEN` = (your Auth Token)
   - `TWILIO_PHONE_NUMBER` = (your Twilio number, e.g., +1234567890)
   - `API_URL` = (your Vercel backend URL, e.g., https://mindtrack-backend.vercel.app)
3. **Important**: Set `API_URL` to your actual Vercel backend URL (not localhost)
4. Click **Save** for each variable
5. Go to **Deployments** and click **Redeploy** (or push a new commit)
6. Wait for deployment to complete

**Testing the Setup:**
- After deployment, test with a red alert
- Check the frontend notification status
- If calls fail, check Vercel function logs for errors

## 🧪 Testing with Your Own Number

**Yes, you can use your own number for testing!**

1. During the free trial, verify your personal phone number in Twilio Console:
   - Go to **Phone Numbers** → **Verified Caller IDs**
   - Click **Add a new Caller ID**
   - Enter your phone number (with country code, e.g., +1234567890)
   - Verify via SMS or voice call
2. In MindTrack, have a doctor add your number as an emergency contact for a test patient
3. Trigger a red alert (use phrases like "I want to end my life" in the assessment)
4. You'll receive a call with the emergency message
5. The call will say: *"Hello, this is an urgent alert from MindTrack. [Patient Name] has indicated they may be in crisis and needs immediate support..."*

**Note**: During the free trial, calls will include "Sent from a Twilio trial account" message. This is removed when you upgrade.

## 💰 Cost Breakdown

### Free Trial:
- **$15.50 free credits**
- ~1,200 minutes of voice calls (US)
- Enough for extensive testing

### After Trial (Production):
- **Voice calls**: $0.013/minute (US domestic)
- **Phone number**: $1.00/month
- **Example**: 10 red alerts/month × 1 minute = $0.13 + $1 = **$1.13/month**

### International Calls:
- Varies by country (check [Twilio Pricing](https://www.twilio.com/pricing))

## 🔄 Alternatives to Twilio

### 1. **Plivo** (Similar pricing)
- Voice: $0.0125/minute (US)
- Good documentation
- [plivo.com](https://www.plivo.com)

### 2. **Vonage (Nexmo)**
- Voice: ~$0.01-0.02/minute
- Good for international
- [vonage.com](https://www.vonage.com)

### 3. **MessageBird**
- Competitive rates in Europe/Asia
- Visual workflow builder
- [messagebird.com](https://www.messagebird.com)

### 4. **Free Alternative: Development Mode**
For development/testing without costs, you can:
- Use the mock mode (see below)
- Log calls to console instead of making real calls
- Use email notifications only

## 🛠️ Development/Testing Mode (No Cost)

If you want to test without setting up Twilio, the system will gracefully handle missing credentials:

1. **Don't set** `ENABLE_VOICE_CALLS=true` or leave Twilio credentials empty
2. The system will log: `voice_calls_disabled` or `twilio_not_configured`
3. Red alerts will still work via email (if configured)
4. You can see the notification status in the frontend

## 📝 Quick Start Checklist

- [ ] Create Twilio account
- [ ] Get Account SID and Auth Token
- [ ] Purchase/Get a Twilio phone number
- [ ] Verify your test phone numbers
- [ ] Add environment variables to `.env` or Vercel
- [ ] Set `ENABLE_VOICE_CALLS=true`
- [ ] Deploy to Vercel
- [ ] Test with a red alert

## 🆘 Troubleshooting

### "voice_calls_disabled" error
- Check `ENABLE_VOICE_CALLS=true` is set
- Verify Twilio credentials are correct

### "twilio_not_configured" error
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Check credentials are correct (no extra spaces)

### "invalid_phone" error
- Phone numbers must include country code (e.g., +1234567890)
- Format: `+[country code][number]`

### Calls not going through
- Verify recipient numbers in Twilio Console (for trial accounts)
- Check Twilio account has credits/balance
- Review Twilio Console logs for errors

## 📚 Additional Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Voice API](https://www.twilio.com/docs/voice)
- [Twilio Pricing](https://www.twilio.com/pricing)
- [Twilio Console](https://www.twilio.com/console)

---

**Note**: For production use, consider upgrading from trial to remove limitations and ensure reliable emergency notifications.

