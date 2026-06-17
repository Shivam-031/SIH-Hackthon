import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import config from './config.js';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
const app = express();
const PORT = config.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:false}));

// MongoDB connection
const MONGODB_URI = config.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});