const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDoc, setDoc, doc, query, where, getDocs } = require('firebase/firestore');
const { runAutomation } = require('./automationRunner');
const auth = require('./auth');
const navigation = require('./navigation');
const videoWatcher = require('./videoWatcher');
const stagwellAuth = require('./stagwellAuth');
require('dotenv').config();
const { db } = require('./firebase')

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

app.use(bodyParser.json());
app.use(express.static('public'));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/user-info', authenticateToken, async (req, res) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', req.user.username));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      res.json({ username: userData.username, telephone: userData.telephone, tier: userData['user-tier'] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Error fetching user info' });
  }
});

app.post('/register', async (req, res) => {
  console.log('Received registration request:', req.body);
  try {
    const { username, email, telephone, password, tier } = req.body;
    
    const userQuery = query(collection(db, 'users'), where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      email,
      telephone,
      password: hashedPassword,
      'user-tier': tier,
    };

    await addDoc(collection(db, 'users'), newUser);
    console.log('User registered:', { username, email, telephone, tier });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  console.log('Received login request:', req.body);
  try {
    const { username, password } = req.body;
    const userQuery = query(collection(db, 'users'), where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'User not found' });
    }

    const userData = userSnapshot.docs[0].data();
    const validPassword = await bcrypt.compare(password, userData.password);
    
    if (!validPassword) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ username: userData.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful for user:', username);
    res.json({ token, username: userData.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.post('/save-stagwell-credentials', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword } = req.body;
    const userRef = doc(db, 'users', req.user.username);
    await setDoc(userRef, { stagwellTelephone, stagwellPassword }, { merge: true });
    console.log('Saved Stagwell TV credentials for user:', req.user.username);
    res.json({ message: 'Stagwell TV credentials saved successfully' });
  } catch (error) {
    console.error('Error saving Stagwell TV credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

app.get('/get-stagwell-credentials', authenticateToken, async (req, res) => {
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
    console.error('Error fetching Stagwell credentials:', error);
    res.status(500).json({ error: 'Error fetching Stagwell credentials' });
  }
});

app.post('/schedule-automation', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword, stagwellTier } = req.body;
    console.log('Received request to schedule automation:', { stagwellTelephone, stagwellTier });

    const userRef = doc(db, 'users', req.user.username);
    await setDoc(userRef, { 
      stagwellTelephone, 
      stagwellPassword, 
      'user-tier': stagwellTier,
      automationScheduled: true
    }, { merge: true });
    console.log('Updated user data in Firestore for scheduled automation');

    console.log('Automation scheduled for daily run at 18:56.');
    res.json({ message: 'Automation scheduled for daily execution at 18:56' });
  } catch (error) {
    console.error('Error scheduling automation:', error);
    res.status(500).json({ error: 'Failed to schedule automation' });
  }
});

async function getUsersForAutomation() {
  console.log('Fetching users for automation...');
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      console.log('User data from Firebase:', userData);
      return {
          username: userData.username,
          telephone: userData.stagwellTelephone || userData.telephone,
          password: userData.stagwellPassword,
          tier: userData['user-tier']
      };
  });
  console.log('Processed users for automation:', users);
  return users;
}

app.post('/run-immediate-automation', authenticateToken, async (req, res) => {
  try {
    const { stagwellTelephone, stagwellPassword, stagwellTier } = req.body;
    const userRef = doc(db, 'users', req.user.username);
    await setDoc(userRef, { 
      stagwellTelephone, 
      stagwellPassword, 
      'user-tier': stagwellTier 
    }, { merge: true });
    console.log('Received Stagwell TV credentials for immediate automation:', {
      stagwellTelephone,
      stagwellTier
    });
    await runAutomation({
      username: req.user.username,
      telephone: stagwellTelephone,
      password: stagwellPassword,
      tier: stagwellTier
    });
    res.json({ message: 'Immediate automation completed successfully' });
  } catch (error) {
    console.error('Error during immediate automation:', error);
    res.status(500).json({ error: error.message || 'An error occurred during automation' });
  }
});

app.post('/trigger-automation', authenticateToken, async (req, res) => {
  try {
    console.log('Manually triggering automation');
    const users = await getUsersForAutomation();
    console.log('Users retrieved for manual automation:', users);
    for (const user of users) {
      console.log(`Running automation for user: ${user.username}`);
      await runAutomation(user);
    }
    res.json({ message: 'Manual automation triggered successfully' });
  } catch (error) {
    console.error('Error during manual automation trigger:', error);
    res.status(500).json({ error: 'Failed to trigger automation' });
  }
});

app.get('/trigger-cron', async (req, res) => {
  console.log('Manual cron job trigger');
  try {
    console.log('Running manual automation');
    const users = await getUsersForAutomation();
    console.log('Users retrieved for manual automation:', users);
    if (users.length === 0) {
      console.warn('No users found for automation');
      return res.send('No users found for automation');
    }
    for (const user of users) {
      try {
        console.log(`Running automation for user: ${user.username}`);
        await runAutomation(user);
        console.log(`Automation completed for user: ${user.username}`);
      } catch (userError) {
        console.error(`Error running automation for user ${user.username}:`, userError);
      }
    }
    res.send('Cron job triggered manually and completed');
  } catch (error) {
    console.error('Error in manual cron trigger:', error);
    res.status(500).send('Error occurred during manual cron trigger');
  }
});

console.log('Server time:', new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }));

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Running automation Monday through Saturday at 18:56');
    const users = await getUsersForAutomation();
    console.log('Users retrieved for automation:', users);
    if (users.length === 0) {
      console.warn('No users found for automation');
      return;
    }
    for (const user of users) {
      try {
        console.log(`Running automation for user: ${user.username}`);
        await runAutomation(user);
        console.log(`Automation completed for user: ${user.username}`);
      } catch (userError) {
        console.error(`Error running automation for user ${user.username}:`, userError);
      }
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
}, 
{
  timezone: 'Africa/Johannesburg'
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

console.log('Server setup complete');