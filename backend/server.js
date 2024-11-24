import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/config/firebase.js';
import { runAutomation } from './src/services/automationRunner.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/user.js';
import automationRoutes from './src/routes/automation.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/automation', automationRoutes);

// Cron job for scheduled automations
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Running scheduled automations');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs
      .map(doc => doc.data())
      .filter(user => user.automationScheduled);

    for (const user of users) {
      try {
        await runAutomation({
          username: user.username,
          telephone: user.stagwellTelephone,
          password: user.stagwellPassword,
          tier: user['user-tier']
        });
      } catch (error) {
        console.error(`Error running automation for user ${user.username}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
}, {
  timezone: 'Africa/Johannesburg'
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});