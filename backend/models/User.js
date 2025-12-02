const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'caregiver'], default: 'patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Assigned doctor for patients
    phone: { type: String, default: null }, // User's phone number
    emergencyContacts: [{
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, default: '' } // e.g., "spouse", "parent", "friend"
    }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);


