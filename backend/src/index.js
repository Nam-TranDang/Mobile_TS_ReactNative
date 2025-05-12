import express from 'express';
import { connect } from 'mongoose';
import { connectDB } from './lib/db.js';
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running on port 3000');
  connectDB();
});