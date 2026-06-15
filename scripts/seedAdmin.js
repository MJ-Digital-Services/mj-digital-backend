import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);

const existing = await User.findOne({ email: 'admin@mjdigitalservices.com' });
if (existing) {
  console.log('Admin already exists');
  process.exit(0);
}

await User.create({
  name: 'MJ Admin',
  email: 'admin@mjdigitalservices.com',
  password: 'Admin@123',
  role: 'admin',
});

console.log('✅ Admin created');
console.log('Email: admin@mjdigitalservices.com');
console.log('Password: Admin@123');
process.exit(0);