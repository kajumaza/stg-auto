const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Middleware to verify Firebase ID token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = jwt.verify(token, functions.config().jwt.secret);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { username, email, telephone, password, tier } = req.body;
    
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('username', '==', username)
      .get();
    
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await admin.firestore().collection('users').add({
      username,
      email,
      telephone,
      password: hashedPassword,
      'user-tier': tier,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('username', '==', username)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userData = userSnapshot.docs[0].data();
    const validPassword = await bcrypt.compare(password, userData.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { username: userData.username },
      functions.config().jwt.secret,
      { expiresIn: '1h' }
    );

    res.json({ token, username: userData.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// User Routes
app.get('/user/info', authenticateToken, async (req, res) => {
  try {
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('username', '==', req.user.username)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
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

// Stagwell Credentials Routes
app.post('/user/credentials', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword } = req.body;
    
    const userRef = admin.firestore()
      .collection('users')
      .where('username', '==', req.user.username);
    
    const snapshot = await userRef.get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        stagwellTelephone,
        stagwellPassword
      });
      res.json({ message: 'Stagwell TV credentials saved successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

app.get('/user/credentials', authenticateToken, async (req, res) => {
  try {
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('username', '==', req.user.username)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
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

// Automation Routes
app.post('/automation/schedule', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword, stagwellTier } = req.body;
    
    const userRef = admin.firestore()
      .collection('users')
      .where('username', '==', req.user.username);
    
    const snapshot = await userRef.get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        stagwellTelephone,
        stagwellPassword,
        'user-tier': stagwellTier,
        automationScheduled: true
      });
      res.json({ message: 'Automation scheduled successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error scheduling automation:', error);
    res.status(500).json({ error: 'Failed to schedule automation' });
  }
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);