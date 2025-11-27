MindTrack: AI-Assisted Mental Health Tracker

Minimal starter for backend (Node/Express/Mongo) and frontend (React + Vite) with JWT auth and mood entries.

Setup
- Backend
  - cd backend
  - npm install
  - Create .env with PORT, MONGO_URI, JWT_SECRET, OPENAI_API_KEY
  - npm run dev
- Frontend
  - cd frontend
  - npm install
  - Create .env with VITE_API_URL=http://localhost:5000
  - npm run dev

API
- POST /api/auth/register {name,email,password,role}
- POST /api/auth/login {email,password}
- GET /api/entries (auth)
- POST /api/entries {mood,text,sleepHours} (auth)
- GET /api/ai/weekly-summary (auth)

Notes
- AI is a placeholder. Integrate OpenAI later in backend/routes/aiRoutes.js.

