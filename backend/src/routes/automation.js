import express from 'express';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { runAutomation } from '../services/automationRunner.js';

const router = express.Router();

router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword, stagwellTier } = req.body;
    const userRef = doc(db, 'users', req.user.username);
    
    await setDoc(userRef, { 
      stagwellTelephone, 
      stagwellPassword, 
      'user-tier': stagwellTier,
      automationScheduled: true
    }, { merge: true });

    res.json({ message: 'Automation scheduled for daily execution' });
  } catch (error) {
    console.error('Error scheduling automation:', error);
    res.status(500).json({ error: 'Failed to schedule automation' });
  }
});

router.post('/run', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword, stagwellTier } = req.body;
    
    await runAutomation({
      username: req.user.username,
      telephone: stagwellTelephone,
      password: stagwellPassword,
      tier: stagwellTier
    });

    res.json({ message: 'Automation completed successfully' });
  } catch (error) {
    console.error('Error during automation:', error);
    res.status(500).json({ error: error.message || 'An error occurred during automation' });
  }
});

export default router;