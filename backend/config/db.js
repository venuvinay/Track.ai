const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vinayerusu4:MsTWsEcNPeX5eQzZ@erusuvenu.fivvoju.mongodb.net/?retryWrites=true&w=majority&appName=ERUSUVENU';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
