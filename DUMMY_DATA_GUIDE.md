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
   - Backend dependencies installed

2. **Run the script:**
   ```bash
   cd backend
   node scripts/generateDummyData.js
   ```

3. **The script will:**
   - Connect to your database
   - **Automatically create the doctor account** if it doesn't exist (fatema@gmail.com)
   - Create 10 patients with Bangladeshi names (or use existing ones)
   - Generate 30 days of data for each patient
   - Create entries, journals, and AI assessments

4. **Login credentials:**
   - **Doctor:**
     - Email: `fatema@gmail.com`
     - Password: `password123`
     - Note: The script automatically creates this account if it doesn't exist
   - **Patients (with Bangladeshi names):**
     - Rahim Rahman: `patient1@example.com`
     - Ayesha Begum: `patient2@example.com`
     - Karim Hossain: `patient3@example.com`
     - Fatima Ahmed: `patient4@example.com`
     - Hasan Ali: `patient5@example.com`
     - Rina Khan: `patient6@example.com`
     - Kamal Uddin: `patient7@example.com`
     - Nusrat Islam: `patient8@example.com`
     - Sohel Chowdhury: `patient9@example.com`
     - Tania Mia: `patient10@example.com`
     - Password: `password123` (for all patients)

### Notes:
- The script will delete existing data for these patients before generating new data
- Each patient gets different mood patterns and entries
- AI assessments are generated with varied summaries
- Crisis flags are randomly assigned (5% chance)

### After Running:
- Log in as doctor to see all patients
- Log in as any patient to see their 30 days of data
- AI summaries will appear in the doctor dashboard for each patient








