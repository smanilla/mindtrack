# 📞 Twilio Voice Call Troubleshooting Guide

## Issue: Call Shows "Ringing" But Never Connects

If you see a callback with `CallStatus: 'ringing'` but the call never progresses to `'answered'`, here's what to check:

---

## Common Causes

### 1. **Phone Not Answered** (Most Common)
- The phone rang but no one picked up
- Phone was on silent/vibrate
- Person was unavailable

**Solution:** 
- Verify the phone number is correct
- Try calling the number manually to confirm it works
- Ensure someone is available to answer

### 2. **International Calling Restrictions**
- Your Twilio number is in the US (+14013864560)
- Calling to Bangladesh (+8801742920232)
- Some carriers block international calls
- Phone plan may not support receiving international calls

**Solution:**
- Check if the Bangladesh number can receive calls from US numbers
- Verify the phone carrier allows international calls
- Consider using a local Twilio number for the target country

### 3. **Phone Turned Off or No Signal**
- Phone is powered off
- Phone is out of network coverage
- SIM card issues

**Solution:**
- Verify the phone is on and has signal
- Try calling manually to test

### 4. **Call Blocked or Rejected**
- Number is on a block list
- Call was manually rejected
- Carrier-level blocking

**Solution:**
- Check if the number is blocked
- Verify carrier settings allow incoming calls

### 5. **TwiML Endpoint Not Accessible** (Less Likely)
- If Twilio can't fetch the TwiML, the call would show different errors
- But if it reached "ringing", this is usually not the issue

**Solution:**
- Verify `/api/ai-assessment/voice-message` is publicly accessible
- Check Vercel logs to see if Twilio accessed the endpoint

---

## How to Check What Happened

### 1. **Check Call Status Callbacks**

The improved callback handler now logs all status updates. Look for these statuses:

- ✅ `answered` - Call was answered (success!)
- ✅ `completed` - Call finished successfully
- ❌ `no-answer` - Phone rang but wasn't answered
- ❌ `busy` - Phone was busy
- ❌ `failed` - Call failed (check error code)
- ❌ `canceled` - Call was canceled

### 2. **Check Twilio Console**

1. Go to: https://console.twilio.com
2. Navigate to **Monitor** → **Logs** → **Calls**
3. Find your call by Call SID (e.g., `CAa6286dd8c9064930d5efb5d6b41c587c`)
4. Check the call details:
   - **Status** - Final call status
   - **Duration** - How long the call lasted (0 = not answered)
   - **Error Code** - If there was an error
   - **TwiML** tab - See if TwiML was fetched successfully

### 3. **Check Your Backend Logs**

Look for these log messages:

```
=== CALL STATUS CALLBACK ===
Sequence: 1 | Status: ringing | SID: CA...
Sequence: 2 | Status: no-answer | SID: CA...  ← This tells you what happened
```

---

## Understanding Call Status Sequence

A typical call goes through these statuses:

1. **`initiated`** - Twilio received the request to make a call
2. **`ringing`** - Phone is ringing (this is where your call got stuck)
3. **`answered`** - Someone picked up (TwiML executes here)
4. **`completed`** - Call finished successfully

If the call stops at `ringing`, it means:
- ✅ Twilio successfully initiated the call
- ✅ The phone network received the call
- ✅ The phone started ringing
- ❌ But no one answered

---

## Solutions

### Solution 1: Test with a Known Working Number

Try calling a number you know works:

```javascript
// In your code, temporarily use a test number
const testNumber = '+1234567890'; // Your own phone number
```

### Solution 2: Check Phone Number Format

Ensure the number is in E.164 format:
- ✅ Correct: `+8801742920232`
- ❌ Wrong: `8801742920232` (missing +)
- ❌ Wrong: `01742920232` (missing country code)

### Solution 3: Verify Twilio Account Settings

1. Go to Twilio Console → **Phone Numbers** → **Manage** → **Active Numbers**
2. Verify your Twilio number is active
3. Check **Voice & Fax** settings:
   - Ensure voice calls are enabled
   - Check geographic permissions

### Solution 4: Test TwiML Endpoint Directly

Test if Twilio can access your TwiML endpoint:

```bash
# Replace with your actual backend URL
curl https://your-backend.vercel.app/api/ai-assessment/voice-message?patientName=Test

# Should return XML like:
# <?xml version="1.0" encoding="UTF-8"?>
# <Response>...</Response>
```

### Solution 5: Use Twilio's Test Audio

Temporarily use Twilio's test audio to verify the call works:

```javascript
// In voice-message endpoint, use:
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://api.twilio.com/cowbell.mp3</Play>
  <Hangup/>
</Response>`;
```

If this works, the issue is with your audio URL or TTS configuration.

---

## International Calling Considerations

### For Bangladesh Numbers (+880)

1. **Verify Number Format:**
   - Bangladesh country code: `+880`
   - Mobile numbers: `+8801XXXXXXXXX` (11 digits after country code)
   - Your number: `+8801742920232` ✅ (correct format)

2. **Check Twilio International Permissions:**
   - Go to Twilio Console → **Settings** → **Geo Permissions**
   - Ensure Bangladesh (BD) is enabled for outbound calls

3. **Consider Using Local Number:**
   - If possible, get a Bangladesh Twilio number
   - Local numbers have better connection rates
   - Check Twilio's available numbers in Bangladesh

---

## Debugging Checklist

Before reporting an issue, check:

- [ ] Phone number is correct and in E.164 format (+country code)
- [ ] Phone is turned on and has signal
- [ ] Phone can receive calls (test manually)
- [ ] Phone can receive international calls (if applicable)
- [ ] Twilio account has international calling enabled
- [ ] TwiML endpoint is publicly accessible (no auth required)
- [ ] Backend logs show call status updates
- [ ] Twilio Console shows call details
- [ ] No error codes in Twilio Console

---

## Next Steps

1. **Check your backend logs** for the improved call status messages
2. **Check Twilio Console** for detailed call information
3. **Test with a known working number** to isolate the issue
4. **Verify phone number format** and carrier settings

---

## Getting More Help

If the issue persists:

1. **Check Twilio Error Codes:**
   - Go to: https://www.twilio.com/docs/voice/twiml/error-codes
   - Look up any error codes you see

2. **Twilio Support:**
   - Check Twilio Console → **Support** → **Help Center**
   - Or contact Twilio support with your Call SID

3. **Check Your Logs:**
   - Vercel logs: Dashboard → Your Project → Functions → Logs
   - Look for call status callbacks and error messages

---

## Example: Successful Call Flow

```
1. Call initiated → Status: "initiated"
2. Phone starts ringing → Status: "ringing" (Sequence: 1)
3. Phone answered → Status: "answered" (Sequence: 2)
4. TwiML executed → Audio plays
5. Call ends → Status: "completed" (Sequence: 3, Duration: 45 seconds)
```

If your call stops at step 2, it means the phone rang but wasn't answered.
