MindTrack API - Postman Testing Guide

Base URL
- http://localhost:5000

Auth
- Most endpoints require a Bearer token in the Authorization header.

1) Health Check
- Entrypoint: Health
- Request URL: GET /api/health
- Input: none
- Output (200): { "status": "ok" }
- Errors: 500 on server failure

2) Register
- Entrypoint: Register User
- Request URL: POST /api/auth/register
- Headers: Content-Type: application/json
- Input (JSON):
  { "name": "Alice", "email": "alice@example.com", "password": "Passw0rd!", "role": "patient" }
- Output (201):
  { "token": "<jwt>", "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "patient" } }
- Errors:
  - 400 Missing fields
  - 400 Email in use
  - 500 Server error

3) Login
- Entrypoint: Login User
- Request URL: POST /api/auth/login
- Headers: Content-Type: application/json
- Input (JSON):
  { "email": "alice@example.com", "password": "Passw0rd!" }
- Output (200):
  { "token": "<jwt>", "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "patient" } }
- Errors:
  - 400 Invalid credentials
  - 500 Server error

4) Create/Update Daily Entry
- Entrypoint: Upsert Entry
- Request URL: POST /api/entries
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer <token>
- Input (JSON):
  { "mood": "good", "text": "Had a nice walk.", "sleepHours": 7 }
  - mood: one of [very_bad, bad, neutral, good, very_good]
  - (optional) date: ISO string to set a specific day (00:00:00 used)
- Output (201): Entry document
- Errors:
  - 401 Not authorized (missing/invalid token)
  - 500 Server error

5) Get Recent Entries
- Entrypoint: List Entries
- Request URL: GET /api/entries
- Headers:
  - Authorization: Bearer <token>
- Input: none
- Output (200): [Entry]
- Errors:
  - 401 Not authorized
  - 500 Server error

6) Weekly Summary (Placeholder AI)
- Entrypoint: Weekly Summary (current user)
- Request URL: GET /api/ai/weekly-summary
- Headers:
  - Authorization: Bearer <token>
- Input: none
- Output (200):
  { "count": 3, "moodCounts": { "good": 2, "neutral": 1 }, "entries": [ ... ] }
- Errors:
  - 401 Not authorized
  - 500 Server error

Appendix: Common Postman Setup
- Create a collection "MindTrack"
- Add an environment with variable BASE_URL = http://localhost:5000
- Save the token from Login as a variable TOKEN and set Authorization header as:
  - Type: Bearer Token
  - Token: {{TOKEN}}

