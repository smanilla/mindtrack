# MindTrack: AI-Assisted Mental Health Tracker
## Complete Project Overview

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Project Overview & Purpose](#2-project-overview--purpose)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Core Features](#5-core-features)
6. [Database Models](#6-database-models)
7. [API Endpoints](#7-api-endpoints)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Security & Authentication](#9-security--authentication)
10. [AI Integration](#10-ai-integration)
11. [Crisis Detection & Emergency Response](#11-crisis-detection--emergency-response)
12. [Deployment Configuration](#12-deployment-configuration)
13. [Project Structure](#13-project-structure)
14. [Setup Instructions](#14-setup-instructions)
15. [Testing & Development](#15-testing--development)
16. [Future Enhancements](#16-future-enhancements)

---

## 1. Project Introduction

**MindTrack** is a comprehensive AI-assisted mental health tracking platform designed to help patients monitor their mental well-being while providing healthcare professionals with tools to track and analyze patient progress. The system combines daily mood tracking, journaling, AI-powered assessments, and crisis detection to create a holistic mental health management solution.

### Key Highlights
- **Dual User System**: Separate interfaces for patients and doctors
- **AI-Powered Insights**: Google Gemini AI integration for assessments and chat support
- **Crisis Detection**: Automated detection of crisis situations with emergency notifications
- **Comprehensive Tracking**: Daily entries, journals, and periodic assessments
- **Real-time Monitoring**: Doctors can monitor patient progress in real-time

---

## 2. Project Overview & Purpose

### Problem Statement
Mental health tracking and monitoring require consistent engagement from patients and efficient tools for healthcare providers to assess patient progress. Traditional methods often lack:
- Continuous monitoring capabilities
- AI-powered insights and recommendations
- Automated crisis detection and response
- Integrated communication between patients and doctors

### Solution
MindTrack addresses these challenges by providing:
1. **Patient Portal**: Easy-to-use interface for daily mood tracking, journaling, and AI assessments
2. **Doctor Dashboard**: Comprehensive view of patient data with analytics and reports
3. **AI Assistant**: 24/7 emotional support and guidance using Google Gemini AI
4. **Crisis Management**: Automated detection and emergency notification system
5. **Data Analytics**: Weekly summaries, mood trends, and progress reports

### Target Users
- **Patients**: Individuals seeking to track and improve their mental health
- **Doctors**: Healthcare professionals monitoring patient progress
- **Caregivers**: Family members or support persons (future implementation)

---

## 3. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB (via Mongoose 8.19.2)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.2
- **AI Services**:
  - Google Gemini AI (@google/generative-ai 0.21.0)
  - OpenAI (openai 6.7.0) - Optional
- **File Storage**: Vercel Blob Storage (@vercel/blob 0.25.1)
- **Communication**:
  - Twilio (twilio 5.3.5) - Voice calls
  - Nodemailer (nodemailer 6.9.15) - Email notifications
- **File Upload**: Multer (multer 1.4.5-lts.1)
- **CORS**: cors 2.8.5
- **Environment**: dotenv 17.2.3

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **HTTP Client**: Axios 1.13.0
- **Language**: JavaScript (JSX)
- **TypeScript**: TypeScript 5.9.3 (configuration)

### Deployment
- **Platform**: Vercel (Serverless Functions)
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: Vercel Blob Storage

---

## 4. System Architecture

### Architecture Pattern
- **Client-Server Architecture**: RESTful API backend with React SPA frontend
- **Serverless Backend**: Deployed on Vercel as serverless functions
- **Database**: MongoDB for data persistence
- **Authentication**: JWT-based stateless authentication

### Data Flow
```
User (Browser)
    ↓
React Frontend (Vite)
    ↓
REST API (Express.js on Vercel)
    ↓
MongoDB Database
    ↓
External Services (Gemini AI, Twilio, Email)
```

### Key Components
1. **Authentication Layer**: JWT middleware for route protection
2. **Business Logic Layer**: Express routes handling requests
3. **Data Access Layer**: Mongoose models for database operations
4. **AI Service Layer**: Google Gemini integration for assessments and chat
5. **Notification Layer**: Twilio and Nodemailer for emergency alerts

---

## 5. Core Features

### 5.1 Patient Features

#### Daily Mood Tracking
- Record daily mood (5 levels: very_bad, bad, neutral, good, very_good)
- Add text notes about the day
- Track sleep hours
- One entry per day (upsert functionality)
- View historical entries

#### Journaling
- Create journal entries with title and content
- Tag entries for organization
- Associate mood with journal entries
- View, edit, and delete journal entries
- Filter by date

#### AI Assessment
- 10-question comprehensive mental health assessment
- AI-generated summaries (descriptive and advice)
- Crisis detection with automatic flagging
- Historical assessment tracking
- Personalized recommendations

#### AI Chat Assistant
- 24/7 emotional support chat
- Conversation history management
- Crisis detection in chat
- Ethical AI guidelines enforcement
- General emotional support and coping strategies

#### Reports & Analytics
- Weekly mood summaries
- Mood trend visualization
- Sleep pattern analysis
- Progress reports
- Historical data views

#### Emergency Contacts
- Manage emergency contact list
- Store contact information (name, phone, relationship)
- Automatic notifications in crisis situations

### 5.2 Doctor Features

#### Patient Management
- Register new patients
- View all assigned patients
- Patient search and filtering
- Patient profile management

#### Patient Monitoring
- View patient daily entries
- Read patient journals
- Review AI assessments
- Access patient emergency contacts
- View comprehensive patient reports

#### Analytics Dashboard
- Patient overview cards
- Weekly summaries for each patient
- Mood trend analysis
- Sleep pattern tracking
- Assessment history
- Crisis alerts and notifications

#### Emergency Response
- Receive email alerts for crisis situations
- Receive voice call alerts (Twilio integration)
- Access patient emergency contacts
- View crisis assessment details

---

## 6. Database Models

### 6.1 User Model
```javascript
{
  name: String (required)
  email: String (required, unique, lowercase)
  password: String (required, hashed)
  role: String (enum: ['patient', 'doctor', 'caregiver'])
  doctor: ObjectId (ref: 'User') // Assigned doctor for patients
  phone: String
  emergencyContacts: [{
    name: String (required)
    phone: String (required)
    relationship: String
  }]
  timestamps: true
}
```

**Features**:
- Password hashing with bcryptjs
- Role-based access control
- Doctor-patient relationship linking
- Emergency contacts array

### 6.2 Entry Model
```javascript
{
  user: ObjectId (ref: 'User', required)
  mood: String (enum: ['very_bad', 'bad', 'neutral', 'good', 'very_good'], required)
  text: String (default: '')
  sleepHours: Number (default: 0)
  date: Date (default: today at 00:00:00)
  timestamps: true
}
```

**Features**:
- Unique index on (user, date) - one entry per day
- Automatic date normalization
- Mood tracking with 5 levels

### 6.3 Journal Model
```javascript
{
  user: ObjectId (ref: 'User', required)
  title: String (required, trimmed)
  content: String (required)
  date: Date (default: Date.now)
  mood: String (enum: ['very_bad', 'bad', 'neutral', 'good', 'very_good'])
  tags: [String]
  timestamps: true
}
```

**Features**:
- Rich text journaling
- Mood association
- Tagging system
- Date-based filtering

### 6.4 Assessment Model
```javascript
{
  user: ObjectId (ref: 'User', required)
  answers: [String] (required, length: 10)
  summary: String (required) // Legacy compatibility
  descriptiveSummary: String // Document-style summary
  adviceSummary: String // Advice and recommendations
  crisis: Boolean (default: false)
  timestamps: true
}
```

**Features**:
- 10-question assessment storage
- Dual summary format (descriptive + advice)
- Crisis flagging
- Historical tracking

---

## 7. API Endpoints

### 7.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new doctor account | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user info | Yes |

**Note**: Patient registration is restricted - only doctors can register. Patients must be created by their assigned doctor.

### 7.2 Entry Routes (`/api/entries`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/entries` | Get user's entries (last 30) | Yes |
| POST | `/api/entries` | Create/update today's entry | Yes |

### 7.3 Journal Routes (`/api/journals`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/journals` | Get all user journals | Yes |
| POST | `/api/journals` | Create new journal | Yes |
| GET | `/api/journals/:id` | Get specific journal | Yes |
| PUT | `/api/journals/:id` | Update journal | Yes |
| DELETE | `/api/journals/:id` | Delete journal | Yes |
| GET | `/api/journals/date/:date` | Get journals by date | Yes |

### 7.4 AI Routes (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ai/weekly-summary` | Get weekly summary for current user | Yes |
| GET | `/api/ai/weekly-summary/:userId` | Get weekly summary for specific user | Yes |

### 7.5 AI Assessment Routes (`/api/ai-assessment`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ai-assessment/start` | Get assessment questions | Yes |
| POST | `/api/ai-assessment/submit` | Submit assessment answers | Yes |
| GET | `/api/ai-assessment/mine` | Get user's assessments | Yes |
| GET | `/api/ai-assessment/voice-message` | TwiML endpoint for voice calls | No (Public) |
| POST | `/api/ai-assessment/call-status` | Twilio callback endpoint | No (Public) |

**Crisis Detection**: Automatically detects crisis situations and triggers emergency notifications.

### 7.6 AI Chat Routes (`/api/ai-chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ai-chat/message` | Send chat message | Yes |
| GET | `/api/ai-chat/history` | Get conversation history | Yes |
| DELETE | `/api/ai-chat/history` | Clear conversation history | Yes |

### 7.7 Doctor Routes (`/api/doctor`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/doctor/register-patient` | Register new patient | Yes | Doctor |
| GET | `/api/doctor/patients` | Get all assigned patients | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId` | Get patient details | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId/entries` | Get patient entries | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId/journals` | Get patient journals | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId/assessments` | Get patient assessments | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId/emergency-contacts` | Get emergency contacts | Yes | Doctor |
| POST | `/api/doctor/patients/:patientId/emergency-contacts` | Add emergency contact | Yes | Doctor |
| PUT | `/api/doctor/patients/:patientId/emergency-contacts/:contactId` | Update contact | Yes | Doctor |
| DELETE | `/api/doctor/patients/:patientId/emergency-contacts/:contactId` | Delete contact | Yes | Doctor |

### 7.8 Upload Routes (`/api/upload`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/upload/audio` | Upload audio file (for red alerts) | Yes | Doctor |

---

## 8. Frontend Pages & Components

### 8.1 Authentication Pages

#### Login (`/login`)
- Email and password authentication
- Role-based redirect after login
- Token storage in localStorage

#### Register (`/register`)
- Doctor registration only
- Patient registration restricted
- Form validation

### 8.2 Patient Pages

#### Dashboard (`/patient/dashboard`)
- Daily entry form
- Recent entries display
- Weekly summary card
- Quick journal access
- Navigation to other features

#### Profile (`/patient/profile`)
- User information display
- Emergency contacts management
- Account settings

#### Report (`/patient/report`)
- Comprehensive mood analytics
- Weekly summaries
- Trend visualizations
- Sleep pattern analysis

#### Journal (`/patient/journal`)
- Create new journal entries
- View journal list
- Edit/delete journals
- Filter by date

#### All Entries (`/patient/all-entries`)
- Complete entry history
- Date-based filtering
- Entry details view

#### AI Assistant (`/patient/ai-assistant`)
- Chat interface with AI
- Conversation history
- Crisis detection warnings
- Supportive responses

#### AI Assessment (`/patient/ai-assessment`)
- 10-question assessment form
- Progress indicator
- Results display
- Historical assessments

#### Contacts (`/patient/contacts`)
- Emergency contacts list
- Add/edit/delete contacts
- Contact information management

#### Summaries (`/patient/summaries`)
- AI-generated summaries
- Assessment history
- Progress tracking

### 8.3 Doctor Pages

#### Dashboard (`/doctor/dashboard`)
- Patient list overview
- Patient cards with summaries
- Quick access to patient data
- Crisis alerts display

#### Register Patient (`/doctor/register-patient`)
- Patient registration form
- Email and password setup
- Automatic doctor assignment

#### Patient Report (`/doctor/patient/:patientId/report`)
- Comprehensive patient analytics
- Mood trends
- Entry history
- Assessment summaries

#### Patient Entries (`/doctor/patient/:patientId/entries`)
- View all patient entries
- Filter and search
- Entry details

#### Patient Journals (`/doctor/patient/:patientId/journals`)
- Read patient journals
- Journal list view
- Date filtering

#### Patient Assessments (`/doctor/patient/:patientId/assessments`)
- View all assessments
- Crisis flags
- Summary details

### 8.4 Shared Components

#### Header
- Navigation menu
- User information
- Logout functionality
- Role-based menu items

#### Footer
- Copyright information
- Links to resources

#### EntryForm
- Daily mood selection
- Text input
- Sleep hours input
- Submit functionality

#### ReportCard
- Weekly summary display
- Mood counts
- Visual indicators

#### JournalTile
- Journal preview
- Date and mood display
- Quick actions

#### EmergencyContactsManager
- Contact list display
- Add/edit/delete functionality
- Form validation

---

## 9. Security & Authentication

### 9.1 Authentication Mechanism

#### JWT (JSON Web Tokens)
- **Token Generation**: On successful login/registration
- **Token Expiration**: 7 days
- **Storage**: localStorage (frontend)
- **Header Format**: `Authorization: Bearer <token>`

#### Password Security
- **Hashing**: bcryptjs with salt rounds (10)
- **Pre-save Hook**: Automatic hashing before storage
- **Comparison**: Secure password comparison method

### 9.2 Authorization

#### Role-Based Access Control (RBAC)
- **Roles**: `patient`, `doctor`, `caregiver`
- **Middleware**: `protect` (authentication) and `authorize` (role check)
- **Route Protection**: All sensitive routes require authentication
- **Doctor-Only Routes**: Patient management and emergency contact management

#### Patient-Doctor Relationship
- Patients are assigned to specific doctors
- Doctors can only access their assigned patients
- Verification on all patient data access routes

### 9.3 Security Features

#### Input Validation
- Email format validation
- Required field checks
- Data type validation
- Enum value validation

#### Error Handling
- Generic error messages in production
- Detailed errors in development
- No sensitive data in error responses

#### CORS Configuration
- Cross-origin resource sharing enabled
- Configurable for production domains

---

## 10. AI Integration

### 10.1 Google Gemini AI

#### Integration Points
1. **Assessment Summaries**: Generates descriptive and advice summaries
2. **Chat Assistant**: Provides emotional support and guidance

#### Configuration
- **Model**: `gemini-pro` (primary), `gemini-1.5-pro` (fallback)
- **API Key**: `GOOGLE_API_KEY` environment variable
- **Fallback**: Hardcoded summaries if API unavailable

#### Assessment Summary Generation
- **Descriptive Summary**: Factual, document-style summary of responses
- **Advice Summary**: Supportive recommendations and next steps
- **Crisis Detection**: Automatic flagging of crisis situations
- **Prompt Engineering**: Specialized prompts for mental health context

#### Chat Assistant
- **Conversation History**: In-memory storage (Map-based)
- **System Prompt**: Ethical guidelines and role definition
- **Crisis Response**: Immediate emergency resources
- **Context Management**: Maintains conversation context

### 10.2 OpenAI (Optional)
- **Status**: Configured but optional
- **Usage**: Alternative AI provider
- **Configuration**: `OPENAI_API_KEY` environment variable

### 10.3 AI Features

#### Natural Language Processing
- Crisis keyword detection
- Sentiment analysis
- Pattern recognition in responses

#### Personalized Responses
- Context-aware responses
- User-specific recommendations
- Adaptive conversation flow

---

## 11. Crisis Detection & Emergency Response

### 11.1 Crisis Detection

#### Detection Mechanism
- **Keyword Matching**: Strict pattern matching for crisis indicators
- **Assessment Analysis**: Real-time analysis of assessment responses
- **Chat Monitoring**: Crisis detection in chat conversations

#### Crisis Indicators
- Self-harm references
- Suicide ideation
- Violent thoughts
- Extreme distress signals

#### Detection Algorithm
```javascript
Keywords: 'kill myself', 'end my life', 'suicide', 'self harm', 
          'hurt myself', 'die by suicide', 'i want to die', etc.
Pattern: /(feel|feeling|filling)[^\n]{0,20}(end|kill|die|suicide)/i
```

### 11.2 Emergency Response System

#### Multi-Channel Notifications

##### Email Alerts
- **Service**: Nodemailer
- **Recipients**: 
  - Assigned doctor
  - Additional contacts (optional)
- **Content**: Assessment summary, crisis details, patient information
- **Configuration**: SMTP settings via environment variables

##### Voice Call Alerts
- **Service**: Twilio
- **Recipients**:
  - Assigned doctor (if phone number provided)
  - Emergency contacts (from patient profile)
- **Content**: Pre-recorded audio or text-to-speech message
- **Language**: Configurable (supports Bengali/Bangla)
- **Audio**: Custom audio file via Vercel Blob Storage

#### Response Flow
1. **Detection**: Crisis detected in assessment or chat
2. **Flagging**: Assessment marked with `crisis: true`
3. **Notification Trigger**: Automatic notification dispatch
4. **Multi-Channel**: Simultaneous email and voice calls
5. **Logging**: All notifications logged for tracking

#### TwiML Voice Message
- **Endpoint**: `/api/ai-assessment/voice-message`
- **Format**: XML (Twilio Markup Language)
- **Content**: Pre-recorded audio or TTS message
- **Access**: Public endpoint (no authentication required for Twilio)

#### Configuration
- **Enable Voice Calls**: `ENABLE_VOICE_CALLS=true`
- **Enable Emails**: `ENABLE_ALERT_EMAILS=true`
- **Twilio Settings**: Account SID, Auth Token, Phone Number
- **Audio URL**: `RED_ALERT_VOICE_AUDIO_URL` (Vercel Blob URL)

---

## 12. Deployment Configuration

### 12.1 Vercel Deployment

#### Backend Configuration (`vercel.json`)
- Serverless function configuration
- Route mapping
- Environment variable setup

#### Frontend Configuration (`vercel.json`)
- Build settings
- Static file serving
- Routing configuration

### 12.2 Environment Variables

#### Backend Required Variables
```
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=your-secret-key
GOOGLE_API_KEY=your-google-api-key
VITE_API_URL=https://your-backend.vercel.app
```

#### Optional Variables
```
OPENAI_API_KEY=your-openai-key
ENABLE_VOICE_CALLS=true
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
RED_ALERT_VOICE_AUDIO_URL=https://...
ENABLE_ALERT_EMAILS=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 12.3 Database Configuration
- **Provider**: MongoDB Atlas (Cloud)
- **Connection**: Mongoose with connection pooling
- **Serverless**: Connection caching for Vercel functions

---

## 13. Project Structure

```
mindtrack/
├── backend/
│   ├── api/
│   │   └── index.js                 # Vercel serverless entry
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT authentication
│   ├── models/
│   │   ├── User.js                  # User model
│   │   ├── Entry.js                 # Daily entry model
│   │   ├── Journal.js               # Journal model
│   │   └── Assessment.js            # Assessment model
│   ├── routes/
│   │   ├── authRoutes.js            # Authentication routes
│   │   ├── entryRoutes.js           # Entry routes
│   │   ├── journalRoutes.js         # Journal routes
│   │   ├── aiRoutes.js              # AI summary routes
│   │   ├── aiAssessmentRoutes.js    # Assessment routes
│   │   ├── aiChatRoutes.js          # Chat routes
│   │   ├── doctorRoutes.js          # Doctor routes
│   │   └── uploadAudio.js           # File upload routes
│   ├── scripts/
│   │   └── generateDummyData.js     # Dummy data generator
│   ├── server.js                    # Express server
│   ├── package.json                 # Dependencies
│   └── vercel.json                  # Vercel config
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntryForm.jsx        # Entry form component
│   │   │   ├── ReportCard.jsx       # Summary card
│   │   │   ├── JournalTile.jsx      # Journal preview
│   │   │   ├── EmergencyContactsManager.jsx
│   │   │   ├── Header.jsx           # Navigation header
│   │   │   └── Footer.jsx           # Footer component
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Dashboard.jsx        # Patient dashboard
│   │   │   ├── DoctorDashboard.jsx  # Doctor dashboard
│   │   │   ├── Profile.jsx          # User profile
│   │   │   ├── Report.jsx           # Analytics report
│   │   │   ├── Journal.jsx          # Journal page
│   │   │   ├── AllEntries.jsx       # All entries view
│   │   │   ├── AIAssessment.jsx     # Assessment page
│   │   │   ├── AIAssistant.jsx      # Chat assistant
│   │   │   ├── Contacts.jsx         # Emergency contacts
│   │   │   ├── RegisterPatient.jsx  # Patient registration
│   │   │   ├── PatientSummaries.jsx # Assessment summaries
│   │   │   ├── ReadJournal.jsx      # Journal reader
│   │   │   ├── DoctorPatientReport.jsx
│   │   │   ├── DoctorPatientEntries.jsx
│   │   │   ├── DoctorPatientJournals.jsx
│   │   │   └── DoctorPatientAssessments.jsx
│   │   ├── main.jsx                 # React entry point
│   │   └── style.css                # Global styles
│   ├── public/                       # Static assets
│   ├── package.json                  # Dependencies
│   └── vercel.json                   # Vercel config
│
├── docs/
│   ├── MindTrack_Project_Proposal.html
│   └── TESTING_POSTMAN.md
│
├── DUMMY_DATA_GUIDE.md              # Dummy data instructions
├── UPLOAD_AUDIO_GUIDE.md            # Audio upload guide
├── README.md                         # Quick start guide
└── PROJECT_OVERVIEW.md               # This document
```

---

## 14. Setup Instructions

### 14.1 Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google Cloud account (for Gemini API key)
- Vercel account (for deployment)
- Git

### 14.2 Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mindtrack
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   GOOGLE_API_KEY=your-google-gemini-api-key
   VITE_API_URL=http://localhost:5000
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### 14.3 Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### 14.4 Database Setup

1. **Create MongoDB Atlas cluster** (or use local MongoDB)
2. **Get connection string** from MongoDB Atlas
3. **Update `MONGO_URI` in backend `.env`**
4. **Database will be created automatically** on first connection

### 14.5 Initial User Creation

1. **Register a doctor account**:
   - Navigate to `/register`
   - Fill in name, email, password
   - Role: `doctor`
   - Submit

2. **Login as doctor**:
   - Navigate to `/login`
   - Use doctor credentials

3. **Register patients** (as doctor):
   - Navigate to `/doctor/register-patient`
   - Create patient accounts
   - Patients are automatically assigned to the doctor

### 14.6 Optional: Generate Dummy Data

1. **Update script** (if needed):
   - Edit `backend/scripts/generateDummyData.js`
   - Update doctor email if different

2. **Run script**:
   ```bash
   cd backend
   node scripts/generateDummyData.js
   ```

3. **Result**:
   - 10 patients created
   - 30 days of entries per patient
   - Sample journals and assessments

---

## 15. Testing & Development

### 15.1 API Testing

#### Using Postman
- Import API endpoints from `docs/TESTING_POSTMAN.md`
- Set up environment variables
- Test authentication flow
- Test protected routes

#### Manual Testing
1. **Authentication**:
   - Register doctor
   - Login
   - Verify token in response

2. **Entries**:
   - Create daily entry
   - Retrieve entries
   - Verify upsert functionality

3. **Journals**:
   - Create journal
   - Update journal
   - Delete journal

4. **Assessments**:
   - Start assessment
   - Submit answers
   - Verify crisis detection

### 15.2 Frontend Testing

#### User Flows
1. **Patient Flow**:
   - Login → Dashboard → Create Entry → View Report → Journal → Assessment

2. **Doctor Flow**:
   - Login → Dashboard → View Patients → Patient Report → Patient Entries

#### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

### 15.3 Crisis Detection Testing

#### Test Scenarios
1. **Normal Assessment**: Submit normal responses, verify no crisis flag
2. **Crisis Assessment**: Include crisis keywords, verify:
   - Crisis flag set to `true`
   - Email sent (if configured)
   - Voice call made (if configured)

#### Test Keywords
- "I want to kill myself"
- "feeling like ending my life"
- "suicide"
- "self harm"

**⚠️ Warning**: Use test accounts only. Do not trigger real emergency responses during testing.

---

## 16. Future Enhancements

### 16.1 Planned Features

#### Enhanced Analytics
- Advanced data visualization
- Predictive analytics
- Trend forecasting
- Comparative analysis

#### Communication Features
- Direct messaging between doctor and patient
- Appointment scheduling
- Medication reminders
- Treatment plan management

#### Mobile Application
- Native iOS app
- Native Android app
- Offline mode support
- Push notifications

#### Advanced AI Features
- Personalized therapy recommendations
- Mood prediction
- Intervention suggestions
- Progress analysis

#### Integration Enhancements
- Calendar integration
- Wearable device integration
- Health app integration
- Electronic health records (EHR) integration

#### Security Enhancements
- Two-factor authentication (2FA)
- End-to-end encryption
- HIPAA compliance
- Audit logging

#### Caregiver Features
- Caregiver dashboard
- Family member access
- Shared reports
- Notification preferences

### 16.2 Technical Improvements

#### Performance
- Database indexing optimization
- Caching layer (Redis)
- CDN for static assets
- Query optimization

#### Scalability
- Microservices architecture
- Load balancing
- Database sharding
- Horizontal scaling

#### Monitoring
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Analytics dashboard
- Health checks

#### Testing
- Unit tests
- Integration tests
- End-to-end tests
- Performance tests

---

## Conclusion

MindTrack represents a comprehensive solution for mental health tracking and monitoring, combining modern web technologies with AI-powered insights. The system provides valuable tools for both patients and healthcare professionals, with a focus on user experience, security, and crisis management.

The project demonstrates:
- **Full-stack development** with React and Node.js
- **AI integration** with Google Gemini
- **Real-time monitoring** and analytics
- **Crisis detection** and emergency response
- **Role-based access control** and security
- **Scalable architecture** with serverless deployment

This overview document provides a complete reference for understanding the project's architecture, features, and implementation details, suitable for project documentation, academic submissions, or development handoff.

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Project Status**: Active Development

