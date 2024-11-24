export const tierConfig = {
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

export async function navigateToTier(page, tier) {
    const maxAttempts = 2;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const success = await clickTierAndNavigate(page, tier);
            if (success) {
                return true;
            }
            await page.goBack().catch(e => console.log('Error going back:', e));
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error(`Error during navigation attempt ${attempts + 1}:`, error);
        }
        attempts++;
    }
    return false;
}

async function clickTierAndNavigate(page, tier) {
    const tierInfo = tierConfig[tier];
    if (!tierInfo) {
        console.error(`Invalid tier: ${tier}`);
        return false;
    }

    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForNetworkIdle({ timeout: 30000 }).catch(e => {});

    const tierSelector = 'div.van-grid-item__content';
    try {
        await page.waitForSelector(tierSelector, { timeout: 20000 });
        
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
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
                new Promise(resolve => setTimeout(resolve, 10000))
            ]);

            const currentUrl = await page.url();
            const pageContent = await page.evaluate(() => document.body.innerText);

            if (currentUrl.includes('#/404') || pageContent.includes('404') || 
                pageContent.trim().toLowerCase().startsWith('service')) {
                return false;
            }
            return true;
        }
    } catch (error) {
        console.error(`Failed to navigate to ${tier} page:`, error);
        return false;
    }
    return false;
}