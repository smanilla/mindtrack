// Script to create the doctor account in PRODUCTION database
// This script uses MONGO_URI from environment variables
// 
// Usage for PRODUCTION:
// 1. Set MONGO_URI environment variable to your production MongoDB connection string
// 2. Run: node backend/scripts/createDoctorAccountProduction.js
//
// Or set it inline (Windows PowerShell):
// $env:MONGO_URI="your-production-mongodb-uri"; node backend/scripts/createDoctorAccountProduction.js
//
// Or set it inline (Mac/Linux):
// MONGO_URI="your-production-mongodb-uri" node backend/scripts/createDoctorAccountProduction.js

require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function createDoctorAccount() {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('❌ ERROR: MONGO_URI environment variable is not set!');
      console.error('\nPlease set it using one of these methods:');
      console.error('\n1. Create a .env file in the backend folder with:');
      console.error('   MONGO_URI=your-production-mongodb-connection-string');
      console.error('\n2. Set it inline before running:');
      console.error('   Windows PowerShell: $env:MONGO_URI="your-uri"; node backend/scripts/createDoctorAccountProduction.js');
      console.error('   Mac/Linux: MONGO_URI="your-uri" node backend/scripts/createDoctorAccountProduction.js');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    console.log('   Using MONGO_URI:', process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await connectDB();
    console.log('✅ Connected to database\n');

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
      console.log('👤 Doctor not found. Creating doctor account...');
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
    console.log('\n💡 You can now test login on your Vercel deployment.');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error creating doctor account:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('\n💡 Check your MongoDB connection string credentials.');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Check your MongoDB connection string and network access.');
    }
    process.exit(1);
  }
}

createDoctorAccount();

