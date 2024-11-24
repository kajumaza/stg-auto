require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');
const { db } = require('./firebase')

const jwtSecret = process.env.JWT_SECRET;

async function register(username, email, telephone, password, tier) {
  try {
    const userQuery = query(collection(db, 'users'), where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
      username, 
      email, 
      telephone, 
      password: hashedPassword, 
      'user-tier': tier 
    };

    await addDoc(collection(db, 'users'), newUser);
    console.log('User registered:', { username, email, telephone, tier });
    return { username, email, telephone, tier };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async function login(username, password) {
  try {
    const userQuery = query(collection(db, 'users'), where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userData = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { username: userData.username, telephone: userData.telephone },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return { token, username: userData.username, telephone: userData.telephone };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

function logout(token) {
  console.log('User logged out');
}

function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  register,
  login,
  logout,
  verifyToken
};