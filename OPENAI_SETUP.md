# OpenAI API Key Setup Instructions

## Quick Setup Guide

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated API key (starts with `sk-`)

### Step 2: Add API Key to Backend
1. Open the file: `backend/.env`
2. Add this line (replace with your actual key):
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file

### Step 3: Restart Backend Server
1. Stop the backend server (Ctrl+C in the terminal)
2. Run `npm run dev` again in the backend directory

### Step 4: Test AI Assistant
1. Go to "My AI Assistant" in your app
2. Try asking a question
3. You should get real ChatGPT responses!

## Example .env file:
```
MONGO_URI=mongodb://127.0.0.1:27017/mindtrack
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=5000
```

## Troubleshooting
- If you get "AI service is not configured" error, check that the API key is correctly added to .env
- Make sure there are no extra spaces around the API key
- Restart the backend server after adding the key
- Check that your OpenAI account has credits/billing set up

## Cost Information
- OpenAI charges per token used
- GPT-3.5-turbo is very affordable (~$0.002 per 1K tokens)
- Typical conversation costs pennies
- You can set usage limits in your OpenAI account
