# 📊 Generate Dummy Data Guide

## How to Run the Dummy Data Script

The script will create:
- 10 patients under your doctor account
- 30 days of daily entries for each patient
- Journal entries (randomly distributed)
- AI assessment summaries for each patient

### Steps:

1. **Make sure your backend is set up:**
   - MongoDB connection is working
   - Doctor account exists: `sfatemon@gmail.com`

2. **Run the script:**
   ```bash
   cd backend
   node scripts/generateDummyData.js
   ```

3. **The script will:**
   - Connect to your database
   - Find your doctor account
   - Create 10 patients (or use existing ones)
   - Generate 30 days of data for each patient
   - Create entries, journals, and AI assessments

4. **Patient credentials:**
   - Email: `patient1@example.com` through `patient10@example.com`
   - Password: `password123` (for all)

### Notes:
- The script will delete existing data for these patients before generating new data
- Each patient gets different mood patterns and entries
- AI assessments are generated with varied summaries
- Crisis flags are randomly assigned (5% chance)

### After Running:
- Log in as doctor to see all patients
- Log in as any patient to see their 30 days of data
- AI summaries will appear in the doctor dashboard for each patient


