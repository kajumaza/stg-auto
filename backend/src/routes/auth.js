import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const router = express.Router();

router.post('/register', async (req, res) => {
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
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userQuery = query(collection(db, 'users'), where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userData = userSnapshot.docs[0].data();
    const validPassword = await bcrypt.compare(password, userData.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ username: userData.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: userData.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

export default router;