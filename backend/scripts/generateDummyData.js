// Script to generate dummy data for testing
// Run with: node backend/scripts/generateDummyData.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Entry = require('../models/Entry');
const Journal = require('../models/Journal');
const Assessment = require('../models/Assessment');

const patientNames = [
  'Rahim Rahman', 'Ayesha Begum', 'Karim Hossain', 'Fatima Ahmed', 'Hasan Ali',
  'Rina Khan', 'Kamal Uddin', 'Nusrat Islam', 'Sohel Chowdhury', 'Tania Mia'
];

const moods = ['very_good', 'good', 'neutral', 'bad', 'very_bad'];
const journalTitles = [
  'Morning Reflection', 'Evening Thoughts', 'Daily Gratitude', 'Weekend Musings',
  'Work Stress', 'Family Time', 'Self-Care Day', 'Challenging Day', 'Breakthrough Moment',
  'Quiet Evening', 'Busy Day', 'Peaceful Morning', 'Anxious Thoughts', 'Happy Memories',
  'Friday Prayer', 'Eid Preparation', 'Family Gathering', 'Study Session', 'Market Visit'
];

const journalContents = [
  'Today was a productive day. I felt more energized and focused on my tasks.',
  'Had a difficult conversation but handled it well. Feeling proud of my growth.',
  'Spent time with family which lifted my spirits. Family connection is important.',
  'Struggled with anxiety today but used breathing exercises to manage it.',
  'Feeling grateful for the small moments of joy throughout the day.',
  'Work was stressful but I took breaks and practiced mindfulness.',
  'Had a good therapy session. Working through some deep issues.',
  'Feeling overwhelmed but trying to take things one step at a time.',
  'Made progress on personal goals. Celebrating small wins.',
  'Difficult day but reminded myself that this too shall pass.',
  'Practiced self-compassion today. Learning to be kinder to myself.',
  'Felt more balanced today. The medication seems to be helping.',
  'Struggled with motivation but pushed through and got things done.',
  'Had a breakthrough moment in understanding my patterns.',
  'Feeling hopeful about the future despite current challenges.',
  'Attended Friday prayer today. It brought me peace and clarity.',
  'Spent quality time with family during iftar. These moments matter.',
  'Visited the local market. The hustle and bustle reminded me of life\'s energy.',
  'Had a long conversation with a friend. Good to catch up and share thoughts.',
  'Studied for my exams today. Feeling more prepared and confident.'
];

const assessmentSummaries = [
  'The patient reported a mixed emotional day with moments of both stress and accomplishment. They demonstrated good self-awareness by identifying specific triggers and using coping strategies effectively. Strengths observed include resilience, willingness to engage in self-care, and maintaining social connections. Recommended next steps: continue practicing mindfulness techniques and maintain regular sleep schedule.',
  'Today showed signs of increased anxiety related to work pressures. The patient utilized breathing exercises and took necessary breaks, showing adaptive coping mechanisms. Their self-awareness about emotional states is improving. Strengths: proactive stress management, recognition of limits. Next steps: consider discussing work-life balance strategies and continue monitoring sleep patterns.',
  'A generally positive day with good social engagement and mood stability. The patient showed awareness of their emotional needs and took steps to meet them. Strengths include social support utilization and emotional regulation skills. Recommended: maintain current self-care routine and continue tracking mood patterns.',
  'The patient experienced some challenges but demonstrated resilience and problem-solving skills. They used multiple coping strategies and showed good insight into their emotional patterns. Strengths: adaptability, self-reflection, use of support systems. Next steps: continue building on current coping strategies and explore additional stress management techniques.',
  'Mixed day with both positive moments and some difficulties. The patient showed good emotional awareness and used appropriate coping mechanisms. Their ability to recognize and address emotional needs is developing well. Strengths: emotional intelligence, self-care practices. Recommended: maintain consistency in self-care routines.',
  'Reported feeling more balanced and stable today. The patient engaged in meaningful activities and showed good emotional regulation. Their progress in therapy appears to be showing positive effects. Strengths: stability, engagement, therapeutic progress. Next steps: continue current treatment plan and monitor for sustained improvement.',
  'Some anxiety present but well-managed through various techniques. The patient demonstrated good self-awareness and proactive stress management. Their coping skills are developing positively. Strengths: stress management, self-awareness, adaptive strategies. Recommended: continue practicing learned techniques and maintain regular check-ins.',
  'Positive day with good mood and energy levels. The patient engaged in self-care activities and maintained social connections. Their overall well-being appears to be improving. Strengths: positive mood, self-care engagement, social support. Next steps: maintain current positive patterns and continue monitoring.',
  'Challenging day but the patient handled difficulties with resilience. They used multiple coping strategies and showed good problem-solving skills. Their ability to navigate difficult emotions is improving. Strengths: resilience, coping skills, emotional regulation. Recommended: continue building on these strengths.',
  'Stable day with good emotional awareness. The patient showed insight into their patterns and used appropriate strategies. Their therapeutic progress continues to show positive results. Strengths: insight, stability, therapeutic engagement. Next steps: maintain current treatment approach.'
];

async function generateDummyData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find or create the doctor
    let doctor = await User.findOne({ email: 'fatema@gmail.com', role: 'doctor' });
    if (!doctor) {
      console.log('Doctor not found. Creating doctor account...');
      doctor = await User.create({
        name: 'Dr. Fatema',
        email: 'fatema@gmail.com',
        password: 'password123',
        role: 'doctor'
      });
      console.log(`✅ Created doctor account: ${doctor.name} (${doctor.email})`);
    } else {
      console.log(`Found doctor: ${doctor.name}`);
    }

    // Delete all existing patients with patient1@example.com through patient10@example.com emails
    console.log('\nDeleting old patients and their data...');
    const patientEmails = [];
    for (let i = 1; i <= 10; i++) {
      patientEmails.push(`patient${i}@example.com`);
    }
    
    const oldPatients = await User.find({ 
      email: { $in: patientEmails },
      role: 'patient' 
    });
    
    for (const oldPatient of oldPatients) {
      // Delete all data for old patients
      await Entry.deleteMany({ user: oldPatient._id });
      await Journal.deleteMany({ user: oldPatient._id });
      await Assessment.deleteMany({ user: oldPatient._id });
      // Delete the patient
      await User.findByIdAndDelete(oldPatient._id);
      console.log(`Deleted old patient: ${oldPatient.name} (${oldPatient.email})`);
    }
    console.log(`Deleted ${oldPatients.length} old patient(s)\n`);

    // Create 10 new patients with Bangladeshi names
    const patients = [];
    for (let i = 0; i < 10; i++) {
      const email = `patient${i + 1}@example.com`;
      // Check if patient already exists (shouldn't after deletion, but just in case)
      let patient = await User.findOne({ email });
      if (patient) {
        // Update existing patient with new name and doctor
        patient.name = patientNames[i];
        patient.doctor = doctor._id;
        await patient.save();
        console.log(`Updated patient: ${patient.name} (${patient.email})`);
      } else {
        // Create new patient
        patient = await User.create({
          name: patientNames[i],
          email: email,
          password: 'password123',
          role: 'patient',
          doctor: doctor._id
        });
        console.log(`✅ Created patient: ${patient.name} (${patient.email})`);
      }
      patients.push(patient);
    }

    // Generate 30 days of data for each patient
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const patient of patients) {
      console.log(`\nGenerating data for ${patient.name}...`);
      
      // Delete existing data for this patient
      await Entry.deleteMany({ user: patient._id });
      await Journal.deleteMany({ user: patient._id });
      await Assessment.deleteMany({ user: patient._id });

      const entries = [];
      const journals = [];
      const assessments = [];

      // Generate entries for last 30 days
      for (let day = 29; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        date.setHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0);

        // Create entry
        const mood = moods[Math.floor(Math.random() * moods.length)];
        const sleepHours = Math.floor(Math.random() * 4) + 6; // 6-9 hours
        const hasText = Math.random() > 0.3; // 70% chance of having text
        
        const entry = await Entry.create({
          user: patient._id,
          date: date.getTime(),
          mood: mood,
          sleepHours: sleepHours,
          text: hasText ? `Entry for ${date.toLocaleDateString()}. Feeling ${mood} today.` : ''
        });
        entries.push(entry);

        // Create journal entry (30% chance per day)
        if (Math.random() > 0.7) {
          const journalTitle = journalTitles[Math.floor(Math.random() * journalTitles.length)];
          const journalContent = journalContents[Math.floor(Math.random() * journalContents.length)];
          
          const journal = await Journal.create({
            user: patient._id,
            title: journalTitle,
            content: journalContent,
            mood: mood,
            createdAt: new Date(date.getTime() + Math.random() * 86400000) // Random time during the day
          });
          journals.push(journal);
        }

        // Create assessment (once every 3-4 days)
        if (day % 3 === 0 || day % 4 === 0) {
          const activities = ['Went for a walk', 'Rest day', 'Visited family', 'Attended prayer', 'Studied', 'Went to market', 'Met with friends'];
          const copingStrategies = ['Used breathing exercises', 'Talked to a friend', 'Prayed', 'Spent time with family', 'Listened to music', 'Read a book'];
          const events = ['Work related', 'Personal time', 'Family gathering', 'Study session', 'Social event', 'Religious activity'];
          
          const answers = [
            `Feeling ${mood} today`,
            `Most significant event: ${events[Math.floor(Math.random() * events.length)]}`,
            `Triggers: ${Math.random() > 0.5 ? 'Some stress at work' : 'None significant'}`,
            `Energy: ${Math.random() > 0.5 ? 'Moderate' : 'Low'}`,
            `Sleep: ${sleepHours} hours, quality was ${Math.random() > 0.5 ? 'good' : 'fair'}`,
            `Activity: ${activities[Math.floor(Math.random() * activities.length)]}`,
            `Interactions: ${Math.random() > 0.5 ? 'Positive' : 'Neutral'}`,
            `Thoughts: ${Math.random() > 0.5 ? 'Some worry but manageable' : 'Generally positive'}`,
            `Coping: ${copingStrategies[Math.floor(Math.random() * copingStrategies.length)]}`,
            `Support needed: ${Math.random() > 0.5 ? 'None right now' : 'Some guidance would help'}`
          ];

          const summary = assessmentSummaries[Math.floor(Math.random() * assessmentSummaries.length)];
          const crisis = Math.random() > 0.95; // 5% chance of crisis flag

          const assessment = await Assessment.create({
            user: patient._id,
            answers: answers,
            summary: summary,
            crisis: crisis,
            createdAt: new Date(date.getTime() + Math.random() * 86400000)
          });
          assessments.push(assessment);
        }
      }

      console.log(`  Created ${entries.length} entries, ${journals.length} journals, ${assessments.length} assessments`);
    }

    console.log('\n✅ Dummy data generation complete!');
    console.log(`   - ${patients.length} patients`);
    console.log(`   - 30 days of entries per patient`);
    console.log(`   - Journal entries and AI assessments generated`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating dummy data:', error);
    process.exit(1);
  }
}

generateDummyData();








