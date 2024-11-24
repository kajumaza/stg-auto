import express from 'express';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/info', authenticateToken, async (req, res) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', req.user.username));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      res.json({ 
        username: userData.username, 
        telephone: userData.telephone, 
        tier: userData['user-tier'] 
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Error fetching user info' });
  }
});

router.post('/credentials', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword } = req.body;
    const userRef = doc(db, 'users', req.user.username);
    await setDoc(userRef, { stagwellTelephone, stagwellPassword }, { merge: true });
    res.json({ message: 'Stagwell TV credentials saved successfully' });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

router.get('/credentials', authenticateToken, async (req, res) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', req.user.username));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      res.json({
        stagwellTelephone: userData.stagwellTelephone || null,
        stagwellPassword: userData.stagwellPassword || null,
        stagwellTier: userData['user-tier'] || null
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Error fetching credentials' });
  }
});

export default router;