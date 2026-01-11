// Script to create the doctor account if it doesn't exist
// Run with: node backend/scripts/createDoctorAccount.js

require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function createDoctorAccount() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check if doctor already exists
    let doctor = await User.findOne({ email: 'fatema@gmail.com', role: 'doctor' });
    
    if (doctor) {
      console.log(`✅ Doctor account already exists:`);
      console.log(`   Name: ${doctor.name}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Role: ${doctor.role}`);
      console.log(`   Created: ${doctor.createdAt}`);
      
      // Test password
      const passwordMatch = await doctor.comparePassword('password123');
      if (passwordMatch) {
        console.log(`   ✅ Password is correct`);
      } else {
        console.log(`   ⚠️  Password does not match 'password123'`);
        console.log(`   Resetting password...`);
        doctor.password = 'password123';
        await doctor.save();
        console.log(`   ✅ Password reset successfully`);
      }
    } else {
      console.log('Doctor not found. Creating doctor account...');
      doctor = await User.create({
        name: 'Dr. Fatema',
        email: 'fatema@gmail.com',
        password: 'password123',
        role: 'doctor'
      });
      console.log(`✅ Created doctor account:`);
      console.log(`   Name: ${doctor.name}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Role: ${doctor.role}`);
    }
    
    console.log('\n✅ Doctor account is ready!');
    console.log('   Email: fatema@gmail.com');
    console.log('   Password: password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating doctor account:', err);
    process.exit(1);
  }
}

createDoctorAccount();
