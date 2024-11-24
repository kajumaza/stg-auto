const tierConfig = {
    intern: { selector: 'intern', videoCount: 5 },  
    K1: { selector: 'K1', videoCount: 5 },
    K2: { selector: 'K2', videoCount: 10 },
    K3: { selector: 'K3', videoCount: 15 },
    K4: { selector: 'K4', videoCount: 30 },
    K5: { selector: 'K5', videoCount: 40 },
    K6: { selector: 'K6', videoCount: 50 },
    K7: { selector: 'K7', videoCount: 70 },
    K8: { selector: 'K8', videoCount: 100 }
  };
  
  async function navigateToTier(page, tier) {
    const maxAttempts = 2;
    let attempts = 0;
  
    while (attempts < maxAttempts) {
      console.log(`Attempt ${attempts + 1} to navigate to ${tier} page`);
      try {
        const success = await clickTierAndNavigate(page, tier);
        
        if (success) {
          console.log(`Successfully navigated to ${tier} page`);
          const currentUrl = await page.url();
          const pageTitle = await page.title();
          console.log('Current URL:', currentUrl);
          console.log('Page Title:', pageTitle);
  
          const pageContent = await page.evaluate(() => document.body.innerText.slice(0, 200));
          console.log('Page Content (first 200 chars):', pageContent);
          return true;
        } else {
          console.log('Navigation failed. Attempting to go back to previous page.');
          await page.goBack().catch(e => console.log('Error going back:', e));
          console.log('Waiting 5 seconds before next attempt');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Error during navigation attempt ${attempts + 1}:`, error);
      }
      
      attempts++;
    }
  
    console.log(`Failed to navigate to ${tier} page after ${maxAttempts} attempts`);
    return false;
  }
  
  async function clickTierAndNavigate(page, tier) {
    const tierInfo = tierConfig[tier];
    if (!tierInfo) {
      console.error(`Invalid tier: ${tier}`);
      return false;
    }
  
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
  
    await page.waitForNetworkIdle({ timeout: 30000 }).catch(e => console.log('Network idle timeout, continuing anyway'));
  
    const tierSelector = 'div.van-grid-item__content';
    try {
      await page.waitForSelector(tierSelector, { timeout: 20000 });
      console.log(`Grid item found. Searching for ${tier}.`);
  
      const clicked = await page.evaluate((selector, tierName) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent.includes(tierName)) {
            element.click();
            return true;
          }
        }
        return false;
      }, tierSelector, tierInfo.selector);
  
      if (clicked) {
        console.log(`Clicked on ${tier} element.`);
        
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 10000))
        ]);
  
        const currentUrl = await page.url();
        const pageContent = await page.evaluate(() => document.body.innerText);
  
        if (currentUrl.includes('#/404') || pageContent.includes('404') || pageContent.trim().toLowerCase().startsWith('service')) {
          console.log('Landed on 404 page or error page.');
          return false;
        } else {
          console.log(`Successfully navigated to ${tier} page.`);
          return true;
        }
      } else {
        throw new Error(`${tier} element not found or not clickable`);
      }
    } catch (error) {
      console.error(`Failed to navigate to ${tier} page:`, error);
      return false;
    }
  }
  
  module.exports = {
    navigateToTier,
    tierConfig
  };