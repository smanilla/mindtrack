# How to Create a Doctor Account

## Method 1: Through Web UI (Recommended)
1. Open http://localhost:5173/register
2. Fill in the form with role="doctor"
3. Submit and login

## Method 2: Via API (Using Postman/curl)

### Register Doctor:
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Dr. Admin",
  "email": "doctor@test.com",
  "password": "password123",
  "role": "doctor"
}
```

### Login as Doctor:
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "doctor@test.com",
  "password": "password123"
}
```

## Method 3: Direct Database (Advanced)

If you have MongoDB access, you can create a doctor directly in the database:

```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Dr. Admin",
  email: "doctor@test.com",
  password: "$2a$10$hashedpasswordhere", // Use bcrypt to hash
  role: "doctor",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note:** You'll need to hash the password using bcrypt. It's easier to use Method 1 or 2.


