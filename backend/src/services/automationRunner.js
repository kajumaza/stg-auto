import puppeteer from 'puppeteer';
import { handlePopup, handleOverlay, login, logout } from './stagwellAuth.js';
import { navigateToTier } from './navigation.js';
import { watchVideos } from './videoWatcher.js';

export async function runAutomation(user) {
    console.log('Starting automation for user:', user.username);
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        await page.goto('https://stagwelltv88.com', { waitUntil: 'networkidle0', timeout: 60000 });
        
        await handlePopup(page);
        await login(page, user.telephone, user.password);
        await handleOverlay(page);
        
        await navigateToTier(page, user.tier);
        
        await watchVideos(page, {
            telephone: user.telephone,
            tier: user.tier
        });
        
        await logout(page);
    } catch (error) {
        console.error(`Error during automation for user ${user.username}:`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}