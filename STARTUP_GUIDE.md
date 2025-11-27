# MindTrack: Complete Project Startup Guide

## 🚀 Quick Start (Complete Project)

### Prerequisites
- Node.js 18+ installed
- MongoDB running (local or Atlas)
- Two terminal windows

### Step 1: Backend Setup
```bash
# Terminal 1 - Backend
cd backend
npm install

# Create environment file
# Windows PowerShell:
New-Item -Path . -Name ".env" -ItemType "file"

# Add these lines to backend/.env:
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=sk-your-openai-key-optional

# Start backend server
npm run dev
```

**Expected output:**
```
[nodemon] starting `node server.js`
MongoDB connected
Server running on port 5000
```

### Step 2: Frontend Setup
```bash
# Terminal 2 - Frontend  
cd frontend
npm install

# Create environment file
# Windows PowerShell:
New-Item -Path . -Name ".env" -ItemType "file"

# Add this line to frontend/.env:
VITE_API_URL=http://localhost:5000

# Start frontend dev server
npm run dev
```

**Expected output:**
```
  VITE v7.1.7  ready in 500 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Test the Application
1. **Open browser:** Go to `http://localhost:5173`
2. **Register:** Create a new account (Patient/Doctor/Caregiver)
3. **Login:** Sign in with your credentials
4. **Dashboard:** Add daily entries and view weekly summary

## 🔧 Troubleshooting

### Backend Issues
- **"MongoDB connected" not showing:** Check your `MONGO_URI` in `.env`
- **Port 5000 in use:** Change `PORT=5001` in `.env` and update frontend `VITE_API_URL`
- **JWT errors:** Ensure `JWT_SECRET` is set in `.env`

### Frontend Issues  
- **"Failed to fetch":** Check `VITE_API_URL` matches backend port
- **White screen:** Check browser console for errors
- **Login redirects:** Clear localStorage and try again

### Database Issues
- **Local MongoDB:** Ensure MongoDB service is running
- **Atlas:** Use full connection string: `mongodb+srv://user:pass@cluster.mongodb.net/mindtrack`

## 📱 Features Available

### ✅ Working Features
- User registration/login with roles
- Daily mood entries with journal notes
- Sleep hours tracking
- Weekly summary with mood distribution
- Responsive gradient design
- Error handling and loading states

### 🔄 Next Steps (AI Integration)
- Add OpenAI API key to backend `.env`
- Implement AI-generated summaries
- Add caregiver notification system
- Doctor dashboard with patient insights

## 🎯 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can register new user
- [ ] Can login with credentials  
- [ ] Dashboard loads user data
- [ ] Can create daily entry
- [ ] Weekly summary shows mood counts
- [ ] Logout clears session

## 📁 Project Structure
```
mindtrack/
├── backend/           # Node.js + Express API
│   ├── server.js      # Main server file
│   ├── models/        # User & Entry models
│   ├── routes/        # API endpoints
│   └── middleware/    # Auth middleware
├── frontend/          # React + Vite app
│   ├── src/pages/     # Login, Register, Dashboard
│   └── src/components/ # EntryForm, ReportCard
└── docs/              # API documentation
```

## 🚨 Common Commands

**Backend:**
- `npm run dev` - Start with nodemon
- `npm start` - Production start
- `npm install` - Install dependencies

**Frontend:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview build

**Both running:** Full-stack app ready for development!
