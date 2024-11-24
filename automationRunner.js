const puppeteer = require('puppeteer');
const { login, handlePopup, handleOverlay } = require('./auth');
const { navigateToTier } = require('./navigation');
const { watchVideos } = require('./videoWatcher');
const stagwellAuth = require('./stagwellAuth');
const navigation = require('./navigation');
const videoWatcher = require('./videoWatcher');
const StagwellDatabase = require('./stagwellDatabase/stagwellDatabase');

async function runAutomation(user) {
    const stagwellCredentials = StagwellDatabase.getUserCredentials(user.username) || {};
    
    console.log('Stagwell credentials from database:', stagwellCredentials);
    
    console.log('Full user object for automation:', JSON.stringify(user, null, 2));
    
    const loginTelephone = stagwellCredentials.stagwellTelephone || user.stagwellTelephone || user.telephone;
    const loginPassword = stagwellCredentials.stagwellPassword || user.stagwellPassword || user.password;
    
    console.log('Login details:', {
      telephone: loginTelephone,
      password: loginPassword ? '[REDACTED]' : 'Not provided'
    });
  
    console.log('User object at start of automation:', {
      username: user.username,
      telephone: loginTelephone,
      tier: user.tier || user['user-tier']
    });
    console.log(`Starting automation for user: ${user.username}`);
    console.log('Using Stagwell credentials:', {
      telephone: loginTelephone,
      tier: user.tier || user['user-tier']
    });
    
    try {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      
      console.log('Browser launched');
      
      await page.goto('https://stagwelltv88.com', { waitUntil: 'networkidle0', timeout: 60000 });
      console.log('Navigated to Stagwell TV');
      
      await stagwellAuth.handlePopup(page);
      console.log('Handled popup');
      
      await stagwellAuth.login(page, loginTelephone, loginPassword);
      console.log('Login completed');
        await stagwellAuth.handleOverlay(page);
        console.log('Handled overlay');
        
        const automationTier = user.tier;
        await navigation.navigateToTier(page, automationTier);
        console.log(`Navigated to tier: ${automationTier}`);
        
        await videoWatcher.watchVideos(page, {
            telephone: loginTelephone,
            tier: automationTier
        });
        console.log('Video watching completed');
        
        await stagwellAuth.logout(page);
        console.log('Logout completed');
    } catch (error) {
        console.error(`Error during automation for user ${user.username}:`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

module.exports = { runAutomation };