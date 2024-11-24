#!/bin/bash

# Create directory structure
mkdir -p ~/stagwell-backend/src/{config,services,routes}

# Install Node.js and other dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs chromium-browser

# Copy backend files
cd ~/stagwell-backend

# Create package.json
cat > package.json << 'EOL'
{
  "name": "stagwell-automation-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "firebase": "^10.8.1",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "puppeteer": "^22.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOL

# Create .env file
cat > .env << 'EOL'
FIREBASE_API_KEY=AIzaSyBWtXkaUyRjyrgkDA9N0ETGbPG_SmpFaTI
FIREBASE_AUTH_DOMAIN=stgtv-app.firebaseapp.com
FIREBASE_PROJECT_ID=stgtv-app
FIREBASE_STORAGE_BUCKET=stgtv-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=790104416351
FIREBASE_APP_ID=1:790104416351:web:180f20a4e8507f97023bea
JWT_SECRET=stgtv-secret-key-2024
PORT=3001
EOL

# Install dependencies
npm install

# Install PM2 globally
sudo npm install -g pm2

# Start the server with PM2
pm2 start server.js --name stagwell-backend